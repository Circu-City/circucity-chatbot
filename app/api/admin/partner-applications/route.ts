import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const applications = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        type: true,
        country: true,
        website: true,
        bio: true,
        phone: true,
        status: true,
        referralCode: true,
        verificationToken: true,
        createdAt: true,
        approvedAt: true,
      },
    });
    return NextResponse.json({ success: true, applications });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
