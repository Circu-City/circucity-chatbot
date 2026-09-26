import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import prisma from '@/lib/db';
import { partnerApprovedEmail, buildConsentUrls } from '@/lib/email';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
const BASE = process.env.NEXT_PUBLIC_URL || 'https://ai.circucity.com';

// Partner setup tokens expire after 7 days and there was no way to issue a new one.
// When outbound mail was failing Gmail's authentication checks (dsn=5.7.26, fixed
// 2026-09-22), seven approved partners never received their link at all and were
// permanently locked out: their token aged out while they were waiting for an email
// that had already bounced. This endpoint re-issues a link on request.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  // Always answer the same way. Telling an anonymous caller whether an address is a
  // registered partner would turn this into an account-enumeration oracle.
  const generic = NextResponse.json({
    success: true,
    message: 'If that email belongs to an approved partner, a new setup link is on its way.',
  });

  try {
    if (!JWT_SECRET) {
      console.error('[partner/resend] JWT_SECRET is not set');
      return generic;
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return generic;

    if (rateLimited(`${ip}:${email}`)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    // Not every row was stored normalised -- at least one has a capital first letter --
    // so an exact match on the lowercased input silently finds nothing.
    const partner = await prisma.partner.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        status: { in: ['approved', 'pending'] },
        emailVerified: false,
      },
    });

    // Already-active partners sign in normally; saying so here would leak membership.
    if (!partner) return generic;

    const referralCode = partner.referralCode;
    const token = sign({ email, type: 'partner-verify', referralCode }, JWT_SECRET, { expiresIn: '7d' });

    await prisma.partner.update({
      where: { id: partner.id },
      data: { verificationToken: token },
    });

    // Partner.email is nullable in the schema. We matched on it, so it is present --
    // but fall back to the submitted address rather than passing null downstream.
    const partnerEmail = partner.email ?? email;

    const setupUrl = `${BASE}/partner/setup?token=${token}`;
    const { consentUrlYes, consentUrlNo } = buildConsentUrls(partnerEmail);
    const name = `${partner.firstName ?? ''} ${partner.lastName ?? ''}`.trim() || 'there';

    // partnerApprovedEmail builds the message AND sends it, returning the send result.
    // Treating it as a template that returns {subject,text,html} sends the mail once and
    // then throws on the second call, logging a failure for a message that did go out.
    const sent = await partnerApprovedEmail({
      email: partnerEmail,
      name,
      program: partner.type || 'partner',
      setupUrl,
      consentUrlYes,
      consentUrlNo,
    });

    if (!sent) console.error(`[partner/resend] send failed for partner ${partner.id}`);

    return generic;
  } catch (e: any) {
    console.error('[partner/resend] error:', e?.message);
    return generic;
  }
}
