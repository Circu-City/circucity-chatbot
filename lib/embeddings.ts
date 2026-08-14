import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (_openai) return _openai;
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("No API key available for embeddings");
    return null;
  }
  _openai = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey,
  });
  return _openai;
}

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIMS = parseInt(process.env.EMBEDDING_DIMS || "1536", 10);

let _embeddingsAvailable: boolean | null = null;

/**
 * Probes whether the configured provider can actually generate embeddings.
 * Cached for the lifetime of the process — the result is stable per provider
 * and this avoids a wasted failing API call on every semantic search/query.
 */
export async function embeddingsAvailable(): Promise<boolean> {
  if (_embeddingsAvailable !== null) return _embeddingsAvailable;
  const client = getClient();
  if (!client) {
    _embeddingsAvailable = false;
    return false;
  }
  try {
    const resp = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: "probe",
      dimensions: EMBEDDING_DIMS,
    });
    _embeddingsAvailable = !!(resp.data && resp.data[0] && resp.data[0].embedding && resp.data[0].embedding.length > 0);
  } catch (e: any) {
    console.warn("Embeddings unavailable on this provider (" + String((e && e.message) || e).slice(0, 160) + ") — semantic search disabled, using full-text/keyword retrieval only.");
    _embeddingsAvailable = false;
  }
  return _embeddingsAvailable;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!(await embeddingsAvailable())) return [];
  const client = getClient();
  if (!client) return [];
  try {
    const resp = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMS,
    });
    return resp.data[0].embedding;
  } catch (e) {
    console.error("Embedding generation failed:", e);
    return [];
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!(await embeddingsAvailable())) return texts.map(() => []);
  const client = getClient();
  if (!client) return texts.map(() => []);
  try {
    const resp = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMS,
    });
    return resp.data.map(d => d.embedding);
  } catch (e) {
    console.error("Batch embedding generation failed:", e);
    return texts.map(() => []);
  }
}

export function formatEmbeddingForSQL(embedding: number[]): string {
  const vals = embedding.join(",");
  return "[" + vals + "]";
}
