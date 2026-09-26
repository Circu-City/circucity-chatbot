import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { verify } from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import { partnerAccountActivatedEmail } from '@/lib/email';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://ai.circucity.com';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const SALT_ROUNDS = 12;

const verifySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json({ success: false, error: firstError.message }, { status: 400 });
    }

    const { token, password } = parsed.data;

    let payload: { email: string; type: string; referralCode: string };
    try {
      payload = verify(token, JWT_SECRET) as any;
    } catch (e: any) {
      // An expired link is recoverable -- the partner just needs a new one. A bad
      // signature is not. Collapsing both into one message left partners staring at
      // "Apply Again" with no way forward, which is how seven of them got stuck.
      const expired = e?.name === 'TokenExpiredError';
      return NextResponse.json(
        {
          success: false,
          code: expired ? 'expired' : 'invalid',
          error: expired
            ? 'This setup link has expired. Request a new one below.'
            : 'This setup link is not valid. Please request a new one.',
        },
        { status: 400 }
      );
    }

    if (payload.type !== 'partner-verify') {
      return NextResponse.json({ success: false, error: 'Invalid token type' }, { status: 400 });
    }

    const partner = await prisma.partner.findFirst({
      // Rows created before email normalisation landed (0ee6b586, 2026-09-10) can carry
      // mixed case, while the token always carries the lowercased address. An exact match
      // silently fails for those partners, so their link never works.
      where: {
        email: { equals: payload.email, mode: 'insensitive' },
        verificationToken: token,
        status: 'approved',
      },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Your application has not been approved yet or the link is invalid.' }, { status: 404 });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    const passwordHash = await hash(password, SALT_ROUNDS);
    let userId: string;

    if (existingUser) {
      // Link partner to existing user account and set the new password
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash, emailVerified: new Date() },
      });
      userId = existingUser.id;
    } else {
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: `${partner.firstName} ${partner.lastName}`,
          passwordHash,
          emailVerified: new Date(),
          role: 'customer',
        },
      });
      userId = user.id;
    }

    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        status: 'active',
        userId,
        emailVerified: true,
        verificationToken: null,
        approvedAt: new Date(),
      },
    });

    const { sign } = await import('jsonwebtoken');
    const sessionToken = sign(
      { id: userId, email: payload.email, name: `${partner.firstName} ${partner.lastName}`, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Welcome / activation email (best effort)
    try {
      await partnerAccountActivatedEmail({
        email: payload.email,
        name: `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || payload.email,
        program: partner.type || '',
        dashboardUrl: `${BASE_URL}/partner/dashboard`,
      });
    } catch (e) {
      console.error('[Partner Activated Email Error]', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      redirect: '/partner/dashboard',
    });
  } catch (error) {
    console.error('[Partner Verify Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
