import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/middleware-auth";

const publicRoutes = ["/", "/api/auth/", "/partner/setup", "/api/partner/apply", "/api/partner/verify"];
const protectedRoutes = ["/dashboard", "/onboarding", "/admin", "/partner/dashboard"];
const authRoutes = ["/sign-in", "/sign-up"];
const rateLimitedPaths = ["/api/"];
// Routes with their own auth + per-store/per-session limits are exempt from the IP-based cap.
const rateLimitExempt = ["/api/chat", "/api/widget", "/api/rag", "/api/cron", "/api/session", "/api/public", "/api/demo", "/api/listings"];

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.circucity.com https://*.circucity.ai https://cdn.jsdelivr.net https://cdn.simpleicons.org https://js.stripe.com https://accounts.google.com https://*.clerk.com https://clerk.circucity.com; connect-src 'self' https://*.circucity.com https://*.circucity.ai https://api.github.com wss://*.circucity.com ws://127.0.0.1:8000 https://api.cognitive.microsofttranslator.com https://edge.microsoft.com https://api.translate.zvo.cn; img-src 'self' data: blob: https://*.circucity.com https://*.circucity.ai https://img.clerk.com https://cdn.jsdelivr.net https://images.unsplash.com https://cdn.simpleicons.org https://utfs.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://js.stripe.com https://accounts.google.com https://*.clerk.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
};

const rateLimitMap = new Map();
// Expired entries are pruned lazily inside isRateLimited (Edge runtime has no timers).

// Rate limiting applies to all POST /api/* routes (expanded from auth-only).
// In production with multiple instances, replace with Redis.

function isRateLimited(ip: string, path: string): boolean {
  const key = `${ip}:${path}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Lazy prune: sweep expired entries when the map grows large.
  if (rateLimitMap.size > 1000) {
    for (const [k, e] of rateLimitMap) {
      if (now > e.resetAt) rateLimitMap.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > 20;
}



export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for auth/partner endpoints
  if (rateLimitedPaths.some(p => pathname.startsWith(p)) && request.method === "POST" && !rateLimitExempt.some(p => pathname.startsWith(p))) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    if (isRateLimited(ip, pathname)) {
      return new NextResponse(JSON.stringify({ success: false, error: "Too many requests. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  }

  const token = request.cookies.get("session")?.value;

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuth = authRoutes.some((route) => pathname.startsWith(route));

  const session = token ? await verifyToken(token) : null;

  // Redirect authenticated users away from sign-in/sign-up
  if (isAuth && session) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign-in
  if (isProtected && !session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Non-admin users on admin routes → dashboard
  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // The Listing Desk is intentionally embeddable (store-admin plugin demo), so
  // drop X-Frame-Options and relax frame-ancestors for that single route. Every
  // other route keeps the strict deny-by-default framing policy.
  if (pathname.startsWith("/demo/listing")) {
    response.headers.delete("X-Frame-Options");
    const csp = response.headers.get("Content-Security-Policy");
    if (csp) {
      response.headers.set(
        "Content-Security-Policy",
        csp.replace(
          "frame-ancestors 'self'",
          "frame-ancestors https://*.circucity.com https://*.myshopify.com https://*.woocommerce.com https://*.ebay.com https://*.etsy.com"
        )
      );
    }
  }

  // CORS headers for all responses (H3)
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|api/public/).*)",
  ],
};
