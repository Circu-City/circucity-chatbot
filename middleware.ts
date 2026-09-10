import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/middleware-auth";

const publicRoutes = [
  "/",
  "/api/auth/",
  "/partner/setup",
  "/api/partner/apply",
  "/api/partner/verify",
  "/early-access",
  "/campaign",
  "/startnext",
  "/api/campaign",
  "/api/gavriel/auth/sign-in",
  "/api/gavriel/auth/sign-up",
  "/api/gavriel/auth/session",
  "/api/gavriel/demand-insights",
];

const protectedRoutes = ["/dashboard", "/onboarding", "/admin", "/partner/dashboard"];
const authRoutes = ["/sign-in", "/sign-up"];
const rateLimitedPaths = ["/api/"];

// Routes with their own internal auth + per-store/per-session limits are exempt from the global IP-based cap.
// Note: Gavriel auth routes are INTENTIONALLY NOT exempt to prevent brute-force attacks.
const rateLimitExempt = [
  "/api/chat",
  "/api/widget",
  "/api/rag",
  "/api/cron",
  "/api/session",
  "/api/public",
  "/api/demo",
  "/api/listings",
  "/api/webhooks",
  "/api/shopify",
  "/api/campaign",
];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, path: string): boolean {
  const key = `${ip}:${path}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

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

const ALLOWED_ORIGINS = new Set([
  "https://gavriel.circucity.com",
  "https://chatbot.circucity.com",
  "https://circucity.com",
  "https://www.circucity.com",
  "https://partners.circucity.com",
  "http://localhost:3000",
  "http://localhost:3003",
]);

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, searchParams } = request.nextUrl;

  // Standalone domain routing for Gavriel OS
  if (host.includes("gavriel.circucity.com")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/gavriel", request.url));
    }
  } else if (pathname === "/gavriel" || pathname.startsWith("/gavriel/")) {
    // Explicitly redirect /gavriel on chatbot.circucity.com to standalone subdomain
    return NextResponse.redirect(new URL("https://gavriel.circucity.com/", request.url), 301);
  }

  // Rate limiting for auth and API endpoints (20 req/min per IP)
  if (
    rateLimitedPaths.some((p) => pathname.startsWith(p)) &&
    request.method === "POST" &&
    !rateLimitExempt.some((p) => pathname.startsWith(p))
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few moments." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  const isShopifyEmbedded = searchParams.has("shop") || searchParams.has("host") || searchParams.has("embedded");
  const token = request.cookies.get("session")?.value;

  const isPublic =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    (host.includes("gavriel.circucity.com") && (pathname === "/" || pathname === "/gavriel" || pathname.startsWith("/_next")));

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuth = authRoutes.some((route) => pathname.startsWith(route));

  const session = token ? await verifyToken(token) : null;

  // Redirect authenticated users away from sign-in/sign-up
  if (isAuth && session && !isShopifyEmbedded) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign-in for protected pages
  if (isProtected && !session && !isShopifyEmbedded) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based protection: only admins can access /admin
  if (pathname.startsWith("/admin") && session && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  // Standard Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.circucity.com https://*.circucity.ai https://cdn.jsdelivr.net https://cdn.simpleicons.org https://js.stripe.com https://accounts.google.com https://*.clerk.com https://clerk.circucity.com https://cdn.shopify.com https://*.shopify.com https://*.myshopify.com",
    "connect-src 'self' https://*.circucity.com https://*.circucity.ai https://api.github.com wss://*.circucity.com ws://127.0.0.1:8000 https://api.cognitive.microsofttranslator.com https://edge.microsoft.com https://api.translate.zvo.cn https://*.shopify.com https://*.myshopify.com https://admin.shopify.com",
    "img-src 'self' data: blob: https://*.circucity.com https://*.circucity.ai https://img.clerk.com https://cdn.jsdelivr.net https://images.unsplash.com https://cdn.simpleicons.org https://utfs.io https://cdn.shopify.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'self' https://js.stripe.com https://accounts.google.com https://*.clerk.com https://*.shopify.com https://*.myshopify.com https://admin.shopify.com",
    "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com https://*.shopify.com https://*.circucity.com https://*.circucity.se https://*.woocommerce.com https://*.ebay.com https://*.etsy.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Restricted CORS
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    // Same-origin / direct browser navigation
    response.headers.set("Access-Control-Allow-Origin", "https://gavriel.circucity.com");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-Id, X-Shopify-Hmac-Sha256, X-Shopify-Topic, X-Shopify-Shop-Domain"
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}
