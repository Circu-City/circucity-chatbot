import prisma from "@/lib/db";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsHeadersFor(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin || "*";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "600",
  };
  if (requestOrigin) headers["Vary"] = "Origin";
  return headers;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

const recentRequestIds = new Map<string, number>();
const REQUEST_ID_TTL_MS = 5 * 60_000;

export function isDuplicateRequest(requestId: string | undefined | null): boolean {
  if (!requestId || typeof requestId !== "string") return false;
  const now = Date.now();
  if (recentRequestIds.size > 5000) {
    for (const [id, ts] of recentRequestIds) {
      if (now - ts > REQUEST_ID_TTL_MS) recentRequestIds.delete(id);
    }
  }
  if (recentRequestIds.has(requestId)) return true;
  recentRequestIds.set(requestId, now);
  return false;
}

export async function findActiveStoreByApiKey(apiKey: string | undefined | null) {
  if (!apiKey || typeof apiKey !== "string") return null;
  return prisma.store.findFirst({
    where: { apiKey, status: "active" },
    include: { embedSettings: true },
  });
}

export async function trackWidgetEvent(
  storeId: string,
  event: string,
  sessionId?: string | null,
  data?: unknown,
) {
  try {
    await prisma.widgetEvent.create({
      data: {
        storeId,
        sessionId: sessionId || null,
        event: String(event).slice(0, 80),
        data: data != null ? JSON.stringify(data).slice(0, 4000) : null,
      },
    });
  } catch {
    // non-fatal
  }
}

export function extractPdfText(base64Data: string): string {
  try {
    const b64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buf = Buffer.from(b64, "base64");
    const raw = buf.toString("latin1");
    const parts: string[] = [];
    const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRe.exec(raw)) !== null) {
      const t = m[1]
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\\[0-7]{1,3}/g, " ");
      if (t.trim()) parts.push(t);
      if (parts.join(" ").length > 2500) break;
    }
    const text = parts.join(" ").replace(/\s+/g, " ").trim();
    return text.slice(0, 2000);
  } catch {
    return "";
  }
}

export function hexToRgb(hex: string): string {
  const h = (hex || "#A3E635").replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "163,230,53";
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
