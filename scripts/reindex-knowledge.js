/**
 * Knowledge Re-indexer
 *
 * Rebuilds the DocumentChunk tables for all stores from their stored crawlData,
 * using PostgreSQL full-text (tsvector) only — no embeddings required.
 * Embeddings are optional; when the provider supports them they are attached,
 * otherwise chunks are still fully searchable via full-text/keyword retrieval.
 *
 * Usage:
 *   su -s /bin/bash circucity -c "cd /opt/circuitcity-ai && HOME=/home/circucity node scripts/reindex-knowledge.js [storeId]"
 */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();
const FTS_CONFIG = 'simple';

function ctxPrefix(kind, title, url) {
  const label = kind === 'faq' ? 'FAQ' : kind === 'doc' ? 'Document' : 'Page';
  return '[' + label + (title ? ': ' + title : '') + (url ? ' (' + url + ')' : '') + ']\n';
}

function chunkText(text, maxChars = 900) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? current + ' ' + s : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function indexStore(storeId) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { crawlData: true },
  });
  if (!store || !store.crawlData) {
    console.log('[Reindex] ' + storeId + ': no crawlData, skipped');
    return 0;
  }

  let crawl;
  try {
    crawl = JSON.parse(store.crawlData);
  } catch (e) {
    console.log('[Reindex] ' + storeId + ': invalid crawlData, skipped');
    return 0;
  }

  const jobs = [];
  for (const p of crawl.pages || []) {
    if (!p.content || p.content.length < 30) continue;
    const prefix = ctxPrefix('page', p.title || p.url, p.url);
    for (const chunk of chunkText(p.content, 900)) {
      jobs.push({ source: 'page:' + p.url, content: prefix + chunk, metadata: { kind: 'page', title: p.title || p.url, url: p.url } });
    }
  }
  for (const d of crawl.documents || []) {
    if (!d.content || d.content.length < 30) continue;
    const prefix = ctxPrefix('doc', d.name);
    for (const chunk of chunkText(d.content, 900)) {
      jobs.push({ source: 'doc:' + d.name, content: prefix + chunk, metadata: { kind: 'doc', title: d.name } });
    }
  }
  for (const f of crawl.faqs || []) {
    if (!f.question || !f.answer) continue;
    jobs.push({
      source: 'faq:' + f.question,
      content: ctxPrefix('faq', f.question) + 'Q: ' + f.question + '\nA: ' + f.answer,
      metadata: { kind: 'faq', title: f.question },
    });
  }

  if (jobs.length === 0) {
    console.log('[Reindex] ' + storeId + ': no indexable content');
    return 0;
  }

  await prisma.documentChunk.deleteMany({ where: { storeId } });

  let count = 0;
  for (const job of jobs) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "storeId", source, content, "contentTsv", embedding, metadata)
         VALUES ($1, $2, $3, $4, to_tsvector('${FTS_CONFIG}', $4), NULL::vector, $5::jsonb)`,
        randomUUID(), storeId, job.source, job.content, JSON.stringify(job.metadata)
      );
      count++;
    } catch (e) {
      console.error('[Reindex] Chunk insert failed for ' + storeId + ':', e.message);
    }
  }
  console.log('[Reindex] ' + storeId + ': indexed ' + count + ' chunks (from ' + jobs.length + ' jobs)');
  return count;
}

(async () => {
  const target = process.argv[2];
  let stores;
  if (target) {
    stores = [{ id: target }];
  } else {
    stores = await prisma.store.findMany({ where: { crawlData: { not: null } }, select: { id: true } });
  }
  console.log('[Reindex] Starting re-index of ' + stores.length + ' store(s)');
  let total = 0;
  for (const s of stores) {
    try {
      total += await indexStore(s.id);
    } catch (e) {
      console.error('[Reindex] Failed for ' + s.id + ':', e.message);
    }
  }
  console.log('[Reindex] Done — total ' + total + ' chunks');
  await prisma.$disconnect();
})();
