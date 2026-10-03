import prisma from "@/lib/db";
import { randomUUID } from "node:crypto";
import { getRedis } from "@/lib/redis";

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

// --- Widget domain authorization -------------------------------------------
// A store's apiKey is public (it sits in the embed snippet on the customer's
// page), so the key alone proves nothing about who is calling. allowedDomains
// is the second factor: the request's Origin/Referer host must be one the
// merchant registered. Stores with nothing configured are still served — the
// call is logged instead — so existing embeds don't break the moment this
// ships. Once a store has domains configured, enforcement is hard.

// Hosts belonging to the platform itself (dashboard preview, local dev).
const PLATFORM_HOSTS = new Set([
  "ai.circucity.com",
  "chatbot.circucity.com",
  "gavriel.circucity.com",
  // The dashboard preview loads the widget from the box's own hostname.
  "srv1729701.hstgr.cloud",
  "localhost",
  "127.0.0.1",
]);

// Enforcement rolls out in two stages. In "monitor" every decision is still made and
// logged, but nothing is refused -- real traffic proves the configured domains are
// right before any merchant's widget can break. Setting WIDGET_ENFORCE=enforce turns
// the same decisions into refusals: no code change, and reversible by unsetting it.
export type WidgetEnforceMode = "monitor" | "enforce";

export function widgetEnforceMode(): WidgetEnforceMode {
  return process.env.WIDGET_ENFORCE === "enforce" ? "enforce" : "monitor";
}

export function parseAllowedDomains(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean);
}

export function hostFromUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function hostMatchesPattern(host: string, pattern: string): boolean {
  if (host === pattern) return true;
  // "*.example.com" matches example.com and any depth of subdomain.
  if (pattern.startsWith("*.")) {
    const base = pattern.slice(2);
    return host === base || host.endsWith("." + base);
  }
  return false;
}

export type OriginDecision = {
  /** What the caller should do. In monitor mode this is true even for a mismatch. */
  allowed: boolean;
  /** The store has domain patterns at all. */
  configured: boolean;
  /**
   * Whether the host actually satisfied those patterns. Distinct from `allowed`:
   * under monitor a mismatch is still served, so the verdict has to be recorded
   * independently of the action or the log can't tell the two apart.
   */
  matched: boolean;
  host: string | null;
};

export function checkWidgetOrigin(
  store: { id: string; allowedDomains?: string | null },
  originHeader?: string | null,
  refererHeader?: string | null,
  // Script delivery (GET /api/widget) is loaded via a <script> tag, which sends
  // no Origin and whose Referer a site's referrer-policy may strip. Serving the
  // UI shell to an unidentifiable host is harmless — it carries no tenant data —
  // so that route opts into leniency. The data routes must not.
  opts?: { allowUnknownHost?: boolean },
): OriginDecision {
  const host = hostFromUrl(originHeader) || hostFromUrl(refererHeader);
  const patterns = parseAllowedDomains(store.allowedDomains);

  if (host && PLATFORM_HOSTS.has(host)) {
    return { allowed: true, configured: patterns.length > 0, matched: true, host };
  }

  if (patterns.length === 0) {
    console.warn(
      "[WidgetAuth] UNCONFIGURED store=" + store.id + " served to host=" + (host || "unknown"),
    );
    return { allowed: true, configured: false, matched: false, host };
  }

  if (!host) {
    if (opts?.allowUnknownHost) {
      return { allowed: true, configured: true, matched: true, host: null };
    }
    const monitoringNoHost = widgetEnforceMode() === "monitor";
    console.warn(
      "[WidgetAuth] " + (monitoringNoHost ? "WOULD REJECT" : "REJECTED") +
        " store=" + store.id + ": no Origin or Referer header",
    );
    return { allowed: monitoringNoHost, configured: true, matched: false, host: null };
  }

  const matches = patterns.some((p) => hostMatchesPattern(host, p));
  if (!matches) {
    const monitoring = widgetEnforceMode() === "monitor";
    console.warn(
      "[WidgetAuth] " + (monitoring ? "WOULD REJECT" : "REJECTED") +
        " store=" + store.id + " host=" + host + " (allowed: " + patterns.join(", ") + ")",
    );
    return { allowed: monitoring, configured: true, matched: false, host };
  }
  return { allowed: true, configured: true, matched: true, host };
}

export function originForbiddenResponseBody(host: string | null) {
  return {
    error: "Origin not authorized for this workspace",
    detail:
      "The domain " +
      (host || "(unknown)") +
      " is not registered for this API key. Add it to the workspace's allowed domains.",
  };
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(key: string, limit = 60, windowMs = 60_000): Promise<boolean> {
  try {
    const redis = await getRedis();
    if (redis) {
      const count = Number(await redis.eval(
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return n",
        { keys: [`cira:ratelimit:${key}`], arguments: [String(windowMs)] },
      ));
      return count <= limit;
    }
  } catch (error) {
    console.error("[redis] rate-limit fallback", error);
  }
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

export async function isDuplicateRequest(requestId: string | undefined | null): Promise<boolean> {
  if (!requestId || typeof requestId !== "string") return false;
  const normalized = requestId.slice(0, 160);
  try {
    const redis = await getRedis();
    if (redis) {
      const stored = await redis.set(`cira:request:${normalized}`, "1", {
        NX: true,
        PX: REQUEST_ID_TTL_MS,
      });
      return stored === null;
    }
  } catch (error) {
    console.error("[redis] idempotency fallback", error);
  }
  const now = Date.now();
  if (recentRequestIds.size > 5000) {
    for (const [id, ts] of recentRequestIds) {
      if (now - ts > REQUEST_ID_TTL_MS) recentRequestIds.delete(id);
    }
  }
  if (recentRequestIds.has(normalized)) return true;
  recentRequestIds.set(normalized, now);
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
  const payload = JSON.stringify({
    id: `evt_${randomUUID().replace(/-/g, "")}`,
    storeId,
    sessionId: sessionId || null,
    event: String(event).slice(0, 80),
    data: data != null ? JSON.stringify(data).slice(0, 4000) : null,
    createdAt: new Date().toISOString(),
  });
  try {
    const redis = await getRedis();
    if (redis) {
      await redis.multi().lPush("cira:events:widget", payload).lTrim("cira:events:widget", 0, 99_999).exec();
      return;
    }
  } catch (error) {
    console.error("[redis] event queue fallback", error);
  }
  try {
    const queued = JSON.parse(payload);
    await prisma.widgetEvent.create({ data: queued });
  } catch (error) {
    console.error("[tracking] event write failed", error);
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


// pm2's log window turned out to be minutes, not days, so monitor-mode findings were
// gone before anyone could read them. Decisions are aggregated into one row per
// (store, host, outcome) and counted, rather than appended per request -- the table
// stays bounded by the number of distinct origins, not by traffic.
export type OriginOutcome = "allowed" | "would_reject" | "unconfigured";

export function outcomeOf(decision: OriginDecision): OriginOutcome {
  if (!decision.configured) return "unconfigured";
  return decision.matched ? "allowed" : "would_reject";
}

/**
 * Fire-and-forget. Never await this and never let it reject: a logging failure must
 * not turn into a failed chat message.
 */
export function recordOriginDecision(
  prisma: { $executeRaw: (q: TemplateStringsArray, ...v: unknown[]) => Promise<number> },
  storeId: string,
  decision: OriginDecision,
): void {
  const outcome = outcomeOf(decision);
  const host = decision.host ?? "";
  void prisma.$executeRaw`
    INSERT INTO chatbot."WidgetOriginEvent" (id, "storeId", host, outcome, hits, "firstSeen", "lastSeen")
    VALUES (gen_random_uuid()::text, ${storeId}, ${host}, ${outcome}, 1, NOW(), NOW())
    ON CONFLICT ("storeId", host, outcome)
    DO UPDATE SET hits = chatbot."WidgetOriginEvent".hits + 1, "lastSeen" = NOW()
  `.catch((e: unknown) => {
    console.error("[WidgetAuth] could not record origin decision:", (e as Error)?.message);
  });
}
