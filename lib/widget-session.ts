import jwt from "jsonwebtoken";

export const WIDGET_SESSION_TTL_SECONDS = 15 * 60;

function getSecret(): string {
  return (
    process.env.WIDGET_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    "cc-widget-dev-secret-change-me"
  );
}

export interface WidgetSessionClaims {
  sub: string;
  tenant: string;
  origin: string;
  scope: string[];
  jti: string;
}

export function signWidgetSessionToken(
  tenantId: string,
  sessionId: string,
  origin: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: "circucity-widget-api",
      aud: "circucity-chat",
      tenant: tenantId,
      origin: origin || "",
      scope: ["chat:send", "history:read", "widget:read"],
      iat: now,
      exp: now + WIDGET_SESSION_TTL_SECONDS,
      jti: Math.random().toString(36).slice(2) + Date.now().toString(36),
    },
    getSecret(),
    { algorithm: "HS256", subject: String(sessionId || "visitor").slice(0, 100) },
  );
}

export function verifyWidgetSessionToken(
  token: string | null | undefined,
): WidgetSessionClaims | null {
  if (!token || typeof token !== "string") return null;
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
      audience: "circucity-chat",
      issuer: "circucity-widget-api",
    });
    if (typeof decoded === "string") return null;
    const d = decoded as any;
    if (!d.tenant || !Array.isArray(d.scope)) return null;
    return {
      sub: String(d.sub || ""),
      tenant: String(d.tenant),
      origin: String(d.origin || ""),
      scope: d.scope.map(String),
      jti: String(d.jti || ""),
    };
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}
