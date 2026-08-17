import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { securityAlertEmail } from "@/lib/email";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const SALT_ROUNDS = 12;
const COOKIE_NAME = "session";
const IMPERSONATE_COOKIE = "impersonate";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "customer" | "admin";
  image: string | null;
  isImpersonating?: boolean;
  impersonatedBy?: string;
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

export function createToken(user: SessionUser): string {
  return sign({ ...user }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export function createPasswordResetToken(userId: string): string {
  return sign({ sub: userId, type: "password-reset" }, JWT_SECRET, { expiresIn: "30m" });
}

export function verifyPasswordResetToken(token: string): string | null {
  try {
    const payload = verify(token, JWT_SECRET) as { sub?: string; type?: string };
    if (payload.type !== "password-reset" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();

  // Check for active impersonation (only admins can impersonate)
  const impersonateToken = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (impersonateToken) {
    const impersonation = verifyImpersonationToken(impersonateToken);
    if (impersonation) {
      // Verify the real user is still an admin
      const realToken = cookieStore.get(COOKIE_NAME)?.value;
      const realUser = realToken ? verifyToken(realToken) : null;

      if (realUser?.role === "admin") {
        // Return the impersonated user's data
        const impersonatedUser = await getUserByIdForSession(impersonation.userId);
        if (impersonatedUser) {
          return {
            ...impersonatedUser,
            isImpersonating: true,
            impersonatedBy: impersonation.impersonatedBy,
          };
        }
      } else {
        // Invalid impersonation - clear it
        clearImpersonationCookie();
      }
    }
  }

  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  // Return a Response-like object to set the cookie
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");
  return token ?? null;
}

// ==================== IMPERSONATION HELPERS ====================

type ImpersonationPayload = {
  userId: string;
  impersonatedBy: string;
};

export function createImpersonationToken(payload: ImpersonationPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: "4h" }); // Shorter expiry for security
}

export function verifyImpersonationToken(token: string): ImpersonationPayload | null {
  try {
    return verify(token, JWT_SECRET) as ImpersonationPayload;
  } catch {
    return null;
  }
}

export async function getUserByIdForSession(userId: string): Promise<SessionUser | null> {
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, image: true },
  });
  return user as SessionUser | null;
}

export function setImpersonationCookie(token: string) {
  const cookieStore = cookies();
  return {
    name: IMPERSONATE_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 4 * 60 * 60, // 4 hours
    path: "/",
  };
}

export function clearImpersonationCookie() {
  const cookieStore = cookies();
  return {
    name: IMPERSONATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}