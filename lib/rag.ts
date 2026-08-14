import prisma from "@/lib/db";
import { randomUUID } from "crypto";
import { embeddingsAvailable, generateEmbedding, generateEmbeddings, formatEmbeddingForSQL } from "@/lib/embeddings";
import { selectRelevantFaqs, selectRelevantPages, type CrawlData } from "@/lib/prompt-builder";

interface DocumentChunk {
  id: string;
  source: string;
  content: string;
  metadata: Record<string, any>;
  similarity?: number;
}

const FTS_CONFIG = "simple";

function ctxPrefix(kind: "page" | "doc" | "faq", title: string, url?: string): string {
  const label = kind === "faq" ? "FAQ" : kind === "doc" ? "Document" : "Page";
  return "[" + label + (title ? ": " + title : "") + (url ? " (" + url + ")" : "") + "]\n";
}

export async function indexDocumentChunks(
  storeId: string,
  source: string,
  chunks: string[],
  metadata: Record<string, any> = {}
): Promise<number> {
  const embeddings = await Promise.all(chunks.map(c => generateEmbedding(c)));
  let count = 0;
  for (let i = 0; i < chunks.length; i++) {
    // Embeddings are optional: when the provider can't generate them (e.g. Groq),
    // chunks are still stored and served via PostgreSQL full-text search. Only add
    // the vector column when one was actually produced.
    const vec = embeddings[i] && embeddings[i].length > 0 ? formatEmbeddingForSQL(embeddings[i]) : null;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "storeId", source, content, "contentTsv", embedding, metadata)
         VALUES ($1, $2, $3, $4, to_tsvector('${FTS_CONFIG}', $4), $5::vector, $6::jsonb)`,
        randomUUID(), storeId, source, chunks[i], vec, JSON.stringify(metadata)
      );
      count++;
    } catch (e) {
      console.error("Chunk insert failed:", e);
    }
  }
  return count;
}

export async function clearStoreChunks(storeId: string): Promise<void> {
  try {
    await prisma.documentChunk.deleteMany({ where: { storeId } });
  } catch (e) {
    console.error("Failed to clear chunks for store " + storeId + ":", e);
  }
}

export async function indexWidgetUpload(
  storeId: string,
  fileName: string,
  text: string,
): Promise<number> {
  const clean = text.replace(/\0/g, "").trim();
  if (!clean) return 0;
  const prefix = ctxPrefix("doc", fileName);
  const chunks = chunkText(clean, 900).map(c => prefix + c);
  const source = "upload:" + fileName;
  try {
    await prisma.documentChunk.deleteMany({ where: { storeId, source } });
  } catch (e) {
    console.error("Failed to clear old upload chunks:", e);
  }
  return indexDocumentChunks(storeId, source, chunks, { kind: "doc", title: fileName, url: "" });
}

export async function indexCrawlKnowledge(
  storeId: string,
  crawl: CrawlData | null,
): Promise<number> {
  if (!crawl) return 0;

  const jobs: { source: string; content: string; metadata: Record<string, any> }[] = [];

  for (const p of crawl.pages || []) {
    if (!p.content || p.content.length < 30) continue;
    const prefix = ctxPrefix("page", p.title || p.url, p.url);
    for (const chunk of chunkText(p.content, 900)) {
      jobs.push({
        source: "page:" + p.url,
        content: prefix + chunk,
        metadata: { kind: "page", title: p.title || p.url, url: p.url },
      });
    }
  }

  for (const d of crawl.documents || []) {
    if (!d.content || d.content.length < 30) continue;
    const prefix = ctxPrefix("doc", d.name);
    for (const chunk of chunkText(d.content, 900)) {
      jobs.push({
        source: "doc:" + d.name,
        content: prefix + chunk,
        metadata: { kind: "doc", title: d.name },
      });
    }
  }

  for (const f of crawl.faqs || []) {
    if (!f.question || !f.answer) continue;
    jobs.push({
      source: "faq:" + f.question,
      content: ctxPrefix("faq", f.question) + "Q: " + f.question + "\nA: " + f.answer,
      metadata: { kind: "faq", title: f.question },
    });
  }

  if (jobs.length === 0) return 0;

  await clearStoreChunks(storeId);

  let count = 0;
  const BATCH = 16;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddings(batch.map(j => j.content));
    } catch (e) {
      console.error("Batch embedding failed, falling back to single:", e);
      embeddings = [];
      for (const j of batch) embeddings.push(await generateEmbedding(j.content));
    }
    for (let k = 0; k < batch.length; k++) {
      const emb = embeddings[k] && embeddings[k].length > 0 ? formatEmbeddingForSQL(embeddings[k]) : null;
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "DocumentChunk" (id, "storeId", source, content, "contentTsv", embedding, metadata)
           VALUES ($1, $2, $3, $4, to_tsvector('${FTS_CONFIG}', $4), $5::vector, $6::jsonb)`,
          randomUUID(), storeId, batch[k].source, batch[k].content, emb, JSON.stringify(batch[k].metadata)
        );
        count++;
      } catch (e) {
        console.error("Chunk insert failed:", e);
      }
    }
  }

  console.log("[RAG] Indexed " + count + " chunks for store " + storeId);
  return count;
}

export async function semanticSearchDocuments(
  query: string,
  storeId: string,
  limit: number = 5
): Promise<DocumentChunk[]> {
  const embedding = await generateEmbedding(query);
  if (embedding.length === 0) return [];
  const vec = formatEmbeddingForSQL(embedding);

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, source, content, metadata,
             1 - (embedding <=> $1::vector) AS similarity
      FROM "DocumentChunk"
      WHERE "storeId" = $2 AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `, vec, storeId, limit);

    return rows.map(r => ({
      id: r.id,
      source: r.source,
      content: r.content,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {}),
      similarity: Math.round((r.similarity || 0) * 100),
    }));
  } catch (e) {
    console.error("Document semantic search failed:", e);
    return [];
  }
}

export async function fullTextSearchDocuments(
  query: string,
  storeId: string,
  limit: number = 5
): Promise<DocumentChunk[]> {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9Ã¥Ã¤Ã¶Ã©Ã¨Ã¼Ã¶Ã¸Ã¦-]+/i)
    .map(t => t.replace(/[^a-z0-9]/gi, ""))
    .filter(t => t.length > 2)
    .slice(0, 8)
    .join(" ");
  if (!tokens) return [];

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, source, content, metadata,
             ts_rank_cd("contentTsv", plainto_tsquery('${FTS_CONFIG}', $1)) AS similarity
      FROM "DocumentChunk"
      WHERE "storeId" = $2
        AND "contentTsv" @@ plainto_tsquery('${FTS_CONFIG}', $1)
      ORDER BY ts_rank_cd("contentTsv", plainto_tsquery('${FTS_CONFIG}', $1)) DESC
      LIMIT $3
    `, tokens, storeId, limit);

    return rows.map(r => ({
      id: r.id,
      source: r.source,
      content: r.content,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {}),
      similarity: Math.round((r.similarity || 0) * 100),
    }));
  } catch (e) {
    console.error("Document full-text search failed:", e);
    return [];
  }
}

function rrfMerge(rankedLists: DocumentChunk[][], limit: number, k: number = 60): DocumentChunk[] {
  const scores = new Map<string, { chunk: DocumentChunk; score: number }>();
  for (const list of rankedLists) {
    list.forEach((chunk, i) => {
      const entry = scores.get(chunk.id) || { chunk, score: 0 };
      entry.score += 1 / (k + i + 1);
      scores.set(chunk.id, entry);
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(v => v.chunk);
}

export async function hybridSearch(
  query: string,
  storeId: string,
  limit: number = 6
): Promise<DocumentChunk[]> {
  if (!(await embeddingsAvailable())) {
    // No embeddings on this provider — full-text over the store's own crawled
    // chunks is the fast, zero-cost retrieval path.
    return fullTextSearchDocuments(query, storeId, limit);
  }
  const [semantic, fts] = await Promise.all([
    semanticSearchDocuments(query, storeId, Math.max(limit, 8)),
    fullTextSearchDocuments(query, storeId, Math.max(limit, 8)),
  ]);
  if (semantic.length === 0 && fts.length === 0) return [];
  return rrfMerge([semantic, fts], limit);
}

export async function retrieveKnowledge(
  query: string,
  storeId: string,
  limit: number = 6,
): Promise<DocumentChunk[]> {
  const hybrid = await hybridSearch(query, storeId, limit);
  if (hybrid.length >= Math.min(3, limit)) return hybrid;

  const fallback = await keywordRetrieve(query, storeId, limit);
  const seen = new Set<string>();
  const merged = [...hybrid];
  for (const item of fallback) {
    if (merged.length >= limit + 4) break;
    if (!seen.has(item.source)) {
      seen.add(item.source);
      merged.push(item);
    }
  }
  return merged;
}

async function keywordRetrieve(
  query: string,
  storeId: string,
  limit: number,
): Promise<DocumentChunk[]> {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { crawlData: true },
    });
    if (!store?.crawlData) return [];
    const crawl: CrawlData = JSON.parse(store.crawlData);
    const out: DocumentChunk[] = [];
    const faqs = selectRelevantFaqs(query, crawl.faqs, 4);
    for (const f of faqs) {
      out.push({
        id: "faq-" + f.question,
        source: "faq:" + f.question,
        content: ctxPrefix("faq", f.question) + "Q: " + f.question + "\nA: " + f.answer,
        metadata: { kind: "faq", title: f.question },
      });
    }
    const pages = selectRelevantPages(query, crawl.pages, 4);
    for (const p of pages) {
      out.push({
        id: "page-" + p.url,
        source: "page:" + p.url,
        content: ctxPrefix("page", p.title || p.url, p.url) + p.content.substring(0, 1200),
        metadata: { kind: "page", title: p.title, url: p.url },
      });
    }
    return out.slice(0, limit);
  } catch {
    return [];
  }
}

export function formatKnowledgeForPrompt(chunks: DocumentChunk[]): string {
  if (!chunks?.length) return "";
  return chunks
    .map((c, i) => {
      const meta = c.metadata || {};
      const label = meta.title || c.source || "Source " + (i + 1);
      return "[Knowledge " + (i + 1) + ": " + label + "]\n" + c.content;
    })
    .join("\n\n");
}

export function chunkText(text: string, maxChars: number = 512): string[] {
  const chunks: string[] = [];
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

