import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { verify } from 'jsonwebtoken';
import { hash } from 'bcryptjs';

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
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired verification link' }, { status: 400 });
    }

    if (payload.type !== 'partner-verify') {
      return NextResponse.json({ success: false, error: 'Invalid token type' }, { status: 400 });
    }

    const partner = await prisma.partner.findFirst({
      where: { email: payload.email, verificationToken: token, status: 'approved' },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Your application has not been approved yet or the link is invalid.' }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
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
          email: payload.email,
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
