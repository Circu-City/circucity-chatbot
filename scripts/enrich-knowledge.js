/**
 * Knowledge Enrichment
 *
 * Uses the cheap/free LLM tier (Groq llama-3.1-8b-instant) OFFLINE to turn
 * each crawled page into structured Q&A knowledge + a summary, indexed as
 * full-text-searchable DocumentChunks. This enriches Cira's local knowledge
 * base once per crawl — it does NOT burn per-request credit at chat time.
 *
 * Usage (requires Node >= 20.6 for --env-file):
 *   node --env-file=.env scripts/enrich-knowledge.js [storeId]
 */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const FTS_CONFIG = 'simple';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || process.env.OPENROUTER_BASE_URL || 'https://api.groq.com/openai/v1',
});
const MODEL = process.env.ENRICH_MODEL || 'llama-3.1-8b-instant';

const SYSTEM = [
  'You extract knowledge for a store\'s customer-support AI assistant.',
  'Given a page from the store\'s own website, produce:',
  '1) "summary": 1-2 sentences describing what this page covers (facts only).',
  '2) "qa": up to 6 factual question/answer pairs a customer might ask, WITH their exact answers.',
  'Only use facts present in the page content. Never invent prices, policies, or features.',
  'If the page has no useful factual content, return {"summary":"","qa":[]}.',
  'STRICT JSON RULES: inside string values never use double quotes or newlines; keep answers under 50 words.',
  'Respond with ONLY valid JSON: {"summary": string, "qa": [{"question": string, "answer": string}]}',
].join('\n');

// Tolerant Q/A extraction used when the model's JSON is malformed (e.g. an
// unescaped quote broke the string). Matches "question"/"answer" pairs up to
// the next boundary — degraded output beats discarding the whole page.
function extractQaFromText(text) {
  const qa = [];
  const re = /"question"\s*:\s*"([\s\S]*?)"\s*,\s*"answer"\s*:\s*"([\s\S]*?)"(?=\s*[,}]|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const q = m[1].trim().replace(/\\"/g, '"').replace(/\s+/g, ' ');
    const a = m[2].trim().replace(/\\"/g, '"').replace(/\s+/g, ' ');
    if (q.length > 8 && a.length > 20 && !q.includes('"') && !a.includes('"')) {
      qa.push({ question: q, answer: a });
      if (qa.length >= 6) break;
    }
  }
  return qa;
}

function parseRepaired(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let candidate = match[0];
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      return JSON.parse(candidate);
    } catch (e) {}
    const lastQuote = candidate.lastIndexOf('"');
    const lastClose = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    const cut = Math.max(lastQuote, lastClose);
    if (cut <= 0) break;
    candidate = candidate.slice(0, cut).replace(/,\s*$/, '');
    let depth = 0;
    for (const ch of candidate) {
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
    }
    if (depth > 0) candidate += '}'.repeat(depth);
  }
  return null;
}

function ctxPrefix(kind, title, url) {
  const label = kind === 'faq' ? 'FAQ' : 'Page';
  return '[' + label + (title ? ': ' + title : '') + (url ? ' (' + url + ')' : '') + ']\n';
}

async function enrichPage(page) {
  const content = (page.content || '').trim();
  if (content.length < 120) return null;
  const user = 'PAGE TITLE: ' + (page.title || '') + '\nURL: ' + page.url + '\n\nCONTENT:\n' + content.substring(0, 6000);
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
      temperature: 0.2,
      max_tokens: 2000,
    });
    const text = completion.choices[0]?.message?.content || '';
    let parsed = parseRepaired(text);
    if (!parsed) {
      const fallbackQa = extractQaFromText(text);
      parsed = fallbackQa.length > 0 ? { summary: '', qa: fallbackQa } : null;
    }
    if (!parsed) {
      console.error('[Enrich] No usable output for ' + page.url);
      return null;
    }
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      qa: Array.isArray(parsed.qa) ? parsed.qa.filter(q => q && typeof q.question === 'string' && typeof q.answer === 'string' && q.question.trim().length > 8 && q.answer.trim().length > 20).slice(0, 6) : [],
    };
  } catch (e) {
    console.error('[Enrich] LLM call failed for ' + page.url + ':', (e && e.message || e).slice(0, 160));
    return null;
  }
}

async function indexChunk(storeId, source, content, metadata) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" (id, "storeId", source, content, "contentTsv", embedding, metadata)
       VALUES ($1, $2, $3, $4, to_tsvector('${FTS_CONFIG}', $4), NULL::vector, $5::jsonb)`,
      randomUUID(), storeId, source, content, JSON.stringify(metadata)
    );
    return 1;
  } catch (e) {
    console.error('[Enrich] Chunk insert failed:', e.message);
    return 0;
  }
}

async function enrichStore(storeId) {
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { crawlData: true } });
  if (!store || !store.crawlData) {
    console.log('[Enrich] ' + storeId + ': no crawlData');
    return;
  }
  const crawl = JSON.parse(store.crawlData);
  const pages = (crawl.pages || []).filter(p => p && p.content && p.content.trim().length >= 120);
  console.log('[Enrich] ' + storeId + ': enriching ' + pages.length + ' pages');

  await prisma.documentChunk.deleteMany({ where: { storeId, source: { startsWith: 'enrich:' } } });

  let total = 0;
  let done = 0;
  for (const page of pages) {
    const result = await enrichPage(page);
    done++;
    if (!result) continue;
    if (result.summary) {
      total += await indexChunk(storeId, 'enrich:summary:' + page.url,
        ctxPrefix('page', (page.title || '').slice(0, 80), page.url) + result.summary,
        { kind: 'page-summary', title: page.title || page.url, url: page.url });
    }
    for (const q of result.qa) {
      total += await indexChunk(storeId, 'enrich:faq:' + q.question,
        ctxPrefix('faq', q.question) + 'Q: ' + q.question + '\nA: ' + q.answer,
        { kind: 'faq', title: q.question, url: page.url });
    }
    console.log('[Enrich] ' + page.url.slice(0, 60) + ' -> summary=' + (result.summary ? 'yes' : 'no') + ', qa=' + result.qa.length + ' (' + done + '/' + pages.length + ')');
  }
  console.log('[Enrich] ' + storeId + ': added ' + total + ' enriched chunks');
}

(async () => {
  const target = process.argv[2];
  let stores;
  if (target) {
    stores = [{ id: target }];
  } else {
    stores = await prisma.store.findMany({ where: { crawlData: { not: null } }, select: { id: true } });
  }
  for (const s of stores) {
    try {
      await enrichStore(s.id);
    } catch (e) {
      console.error('[Enrich] Failed for ' + s.id + ':', e.message);
    }
  }
  console.log('[Enrich] Done');
  await prisma.$disconnect();
})();
