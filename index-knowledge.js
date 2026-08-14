const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");

const envRaw = fs.readFileSync("/opt/circuitcity-ai/.env", "utf8");
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].replace(/^"|"$/g, "").replace(/'/g, "");
  }
}

const prisma = new PrismaClient();
const client = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
});
const EMBED_MODEL = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small";

function chunkText(text, maxChars = 900) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? current + " " + s : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function embedBatch(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += 16) {
    const batch = texts.slice(i, i + 16);
    try {
      const resp = await client.embeddings.create({ model: EMBED_MODEL, input: batch });
      out.push(...resp.data.map((d) => d.embedding));
    } catch (e) {
      console.error("embed batch failed:", e.message);
      for (const t of batch) {
        try {
          const r = await client.embeddings.create({ model: EMBED_MODEL, input: t });
          out.push(r.data[0].embedding);
        } catch (e2) {
          console.error("embed single failed:", e2.message);
          out.push([]);
        }
      }
    }
  }
  return out;
}

function ctxPrefix(kind, title, url) {
  const label = kind === "faq" ? "FAQ" : kind === "doc" ? "Document" : "Page";
  return "[" + label + (title ? ": " + title : "") + (url ? " (" + url + ")" : "") + "]\n";
}

async function main() {
  const stores = await prisma.store.findMany({
    where: { crawlData: { not: null } },
    select: { id: true, name: true, crawlData: true },
  });
  let total = 0;
  for (const store of stores) {
    let crawl = null;
    try { crawl = JSON.parse(store.crawlData); } catch (e) { crawl = null; }
    if (!crawl) continue;
    const jobs = [];
    for (const p of crawl.pages || []) {
      if (!p.content || p.content.length < 30) continue;
      const prefix = ctxPrefix("page", p.title || p.url, p.url);
      for (const chunk of chunkText(p.content)) {
        jobs.push({ source: "page:" + p.url, content: prefix + chunk, metadata: { kind: "page", title: p.title || p.url, url: p.url } });
      }
    }
    for (const d of crawl.documents || []) {
      if (!d.content || d.content.length < 30) continue;
      const prefix = ctxPrefix("doc", d.name);
      for (const chunk of chunkText(d.content)) {
        jobs.push({ source: "doc:" + d.name, content: prefix + chunk, metadata: { kind: "doc", title: d.name } });
      }
    }
    for (const f of crawl.faqs || []) {
      if (!f.question || !f.answer) continue;
      jobs.push({ source: "faq:" + f.question, content: ctxPrefix("faq", f.question) + "Q: " + f.question + "\nA: " + f.answer, metadata: { kind: "faq", title: f.question } });
    }
    if (jobs.length === 0) {
      console.log("SKIP " + store.name + " (no knowledge)");
      continue;
    }
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "DocumentChunk" WHERE "storeId" = $1`, store.id);
    } catch (e) {
      console.error("clear failed for " + store.name + ":", e.message);
      continue;
    }
    const embeddings = await embedBatch(jobs.map((j) => j.content));
    let count = 0;
    for (let i = 0; i < jobs.length; i++) {
      if (!embeddings[i] || embeddings[i].length === 0) continue;
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "DocumentChunk" (id, "storeId", source, content, "contentTsv", embedding, metadata) VALUES ($1, $2, $3, $4, to_tsvector('simple', $4), $5::vector, $6::jsonb)`,
          crypto.randomUUID(), store.id, jobs[i].source, jobs[i].content, "[" + embeddings[i].join(",") + "]", JSON.stringify(jobs[i].metadata)
        );
        count++;
      } catch (e) {
        console.error("insert failed:", e.message);
      }
    }
    console.log("INDEXED " + store.name + ": " + count + " chunks");
    total += count;
  }
  console.log("TOTAL chunks indexed: " + total);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

