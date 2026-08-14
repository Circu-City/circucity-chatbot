import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { sign } from 'jsonwebtoken';
import { sendEmail } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://chatbot.circucity.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nassershangwe@gmail.com';

const applySchema = z.object({
  program: z.enum(['agency', 'affiliate', 'ambassador']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().default(''),
  company: z.string().max(200).optional().default(''),
  website: z.string().url().max(500).optional().or(z.literal('')).default(''),
  country: z.string().min(1).max(100),
  experience: z.string().max(5000).optional().default(''),
  audience: z.string().max(5000).optional().default(''),
  message: z.string().max(5000).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error?.errors?.[0];
      return NextResponse.json({ success: false, error: firstError?.message || "Invalid input" }, { status: 400 });
    }

    const { program, firstName, lastName, email, phone, company, website, country, experience, audience, message } = parsed.data;

    const existingByEmail = await prisma.partner.findFirst({
      where: { email, status: { in: ['pending', 'approved', 'active'] } },
    });
    if (existingByEmail) {
      return NextResponse.json({ success: false, error: 'A partner application with this email already exists' }, { status: 409 });
    }

    const referralCode = `${firstName.toLowerCase().slice(0, 3)}-${Date.now().toString(36)}`;
    const verificationToken = sign(
      { email, type: 'partner-verify', referralCode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const existingStore = await prisma.store.findFirst({
      where: { user: { email } },
      select: { id: true, userId: true },
    });

    await prisma.partner.create({
      data: {
        storeId: existingStore?.id || null,
        type: program,
        status: 'pending',
        referralCode,
        paymentEmail: email,
        website: website || null,
        bio: experience || null,
        email,
        firstName,
        lastName,
        phone: phone || null,
        country,
        verificationToken,
      },
    });

    // Best-effort admin notification
    let adminNotified = false;
    try {
      adminNotified = await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New ${program} Partner Application - ${firstName} ${lastName}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:16px;padding:40px">
            <h1 style="color:#0A1428;font-size:22px;font-weight:800;margin:0 0 16px">New Partner Application</h1>
            <div style="background:#fff;border-radius:12px;padding:24px">
              <p style="margin:4px 0"><strong>Program:</strong> ${program}</p>
              <p style="margin:4px 0"><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
              <p style="margin:4px 0"><strong>Country:</strong> ${country}</p>
              ${company ? `<p style="margin:4px 0"><strong>Company:</strong> ${company}</p>` : ''}
              ${website ? `<p style="margin:4px 0"><strong>Website:</strong> ${website}</p>` : ''}
              ${experience ? `<p style="margin:4px 0"><strong>Experience:</strong> ${experience}</p>` : ''}
            </div>
            <p style="color:#6b7280;font-size:13px;margin:24px 0 0">Review this application in the admin dashboard at <a href="${BASE_URL}/admin/partner-applications">${BASE_URL}/admin/partner-applications</a></p>
          </div>
        `,
        text: `New ${program} partner application from ${firstName} ${lastName} (${email}, ${country}). Review at ${BASE_URL}/admin/partner-applications`,
      });
    } catch (e) {
      console.error('[Partner Apply Admin Email Error]', e);
    }

    console.log(`[Partner Apply] ${email} → ${program} (adminNotified: ${adminNotified})`);

    return NextResponse.json({
      success: true,
      message: 'Application submitted. Our team will review your application and contact you shortly.',
    });
  } catch (error) {
    console.error('[Partner Apply Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
