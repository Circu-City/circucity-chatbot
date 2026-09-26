import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { sign } from 'jsonwebtoken';
import { sendEmail, partnerApprovedEmail, buildConsentUrls } from '@/lib/email';

// process.env.JWT_SECRET is string | undefined, and sign() throws on undefined -- an
// unset secret produced an unhandled 500 rather than anything diagnosable.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://ai.circucity.com';
const PARTNERS_PORTAL_URL = process.env.PARTNERS_PORTAL_URL || 'https://partners.circucity.com';
const PARTNERS_SYNC_SECRET = process.env.PARTNERS_SYNC_SECRET || '';

const applySchema = z.object({
  program: z.enum(['agency', 'affiliate', 'ambassador', 'global_partner']).optional().default('affiliate'),
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

// Helper to gather all admin recipient emails
async function getAdminEmails(): Promise<string[]> {
  const envAdmin = process.env.ADMIN_EMAIL || '';
  const list = new Set<string>();

  // Configured env emails
  for (const em of envAdmin.split(',')) {
    const trimmed = em.trim().toLowerCase();
    if (trimmed && trimmed.includes('@')) list.add(trimmed);
  }

  // Known primary admins
  list.add('nassershangwe29@gmail.com');
  list.add('nassershangwe@gmail.com');
  list.add('admin@circucity.com');

  // Query DB admin users
  try {
    const dbAdmins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true },
    });
    for (const a of dbAdmins) {
      if (a.email && a.email.includes('@')) {
        list.add(a.email.toLowerCase().trim());
      }
    }
  } catch (e) {
    console.error('[Admin Emails DB Error]', e);
  }

  return Array.from(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error?.issues?.[0];
      return NextResponse.json({ success: false, error: firstError?.message || "Invalid input" }, { status: 400 });
    }

    if (!JWT_SECRET) {
      console.error('[partner/apply] JWT_SECRET is not set');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const { program, firstName, lastName, email, phone, company, website, country, experience, audience, message } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const fullName = `${firstName} ${lastName}`.trim();

    // Any prior application for this address, whatever its status. Rows created before
    // email normalisation landed can carry mixed case, so match insensitively.
    const existingPartner = await prisma.partner.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPartner && ['approved', 'active'].includes(existingPartner.status)) {
      return NextResponse.json({ success: false, error: 'A partner account with this email is already active' }, { status: 409 });
    }

    // The referral code is the partner's actual referral link. If they already have one
    // it may be in circulation, so re-applying must not mint a new one and silently
    // orphan the old link's attribution.
    const referralCode =
      existingPartner?.referralCode ||
      `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 3) || 'pt'}-${Date.now().toString(36)}`;
    const verificationToken = sign(
      { email: normalizedEmail, type: 'partner-verify', referralCode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const existingStore = await prisma.store.findFirst({
      where: { user: { email: normalizedEmail } },
      select: { id: true, userId: true },
    });

    // upsert keyed on `referralCode` could never match: the code was generated fresh on
    // every request, so the update branch was dead and each re-application inserted a
    // duplicate Partner row, orphaning the previous one. Resolve the row by identity and
    // branch explicitly.
    const partnerData = {
        type: program,
        status: 'approved',
        paymentEmail: normalizedEmail,
        website: website || null,
        bio: experience || null,
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone || null,
        country,
        verificationToken,
    };

    const partnerApplication = existingPartner
      ? await prisma.partner.update({
          where: { id: existingPartner.id },
          // storeId is only set on create: an existing partner may already be linked to a
          // store, and re-applying should not silently relink them to a different one.
          data: partnerData,
        })
      : await prisma.partner.create({
          data: { ...partnerData, storeId: existingStore?.id || null, referralCode },
        });

    // Generate secure setup URL on the Partner Portal (partners.circucity.com)
    let setupUrl = `${PARTNERS_PORTAL_URL}/setup?token=${verificationToken}`;

    if (PARTNERS_SYNC_SECRET) {
      try {
        const syncResponse = await fetch(`${PARTNERS_PORTAL_URL}/api/sync/approved-partner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-secret': PARTNERS_SYNC_SECRET,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: fullName,
            country: country || '',
            program: program || 'affiliate',
          }),
          signal: AbortSignal.timeout(8_000),
        });
        const syncData = await syncResponse.json();
        if (syncResponse.ok && syncData.setupUrl) {
          setupUrl = syncData.setupUrl;
        }
      } catch (syncError) {
        console.error('[Partner Apply Portal Sync Error]', syncError);
      }
    }

    // Record staff activity
    try {
      const sys = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
      if (sys) {
        await prisma.staffActivity.create({
          data: { userId: sys.id, action: "partner_applied", details: `${fullName} (${normalizedEmail}) applied and auto-approved as ${program}` },
        });
      }
    } catch {}

    // 1. Send Applicant Instant Welcome & Account Setup Email
    let applicantNotified = false;
    try {
      const consent = buildConsentUrls(normalizedEmail);
      applicantNotified = await partnerApprovedEmail({
        email: normalizedEmail,
        name: firstName,
        program,
        setupUrl,
        consentUrlYes: consent.consentUrlYes,
        consentUrlNo: consent.consentUrlNo,
      });
    } catch (e) {
      console.error('[Partner Apply Applicant Email Error]', e);
    }

    // 2. Notify ALL Admins
    const adminEmails = await getAdminEmails();
    for (const adminEmail of adminEmails) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `New Partner Application: ${fullName} (${program.toUpperCase()})`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
              <div style="background:#0A1428;padding:16px 20px;border-radius:10px;margin-bottom:20px">
                <span style="color:#ffffff;font-size:16px;font-weight:700">CircuCity <span style="color:#A3E635">AI</span> Partner Alert</span>
              </div>
              <h2 style="color:#0A1428;font-size:20px;margin:0 0 12px">New Partner Registered</h2>
              <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #e2e8f0;font-size:14px;color:#334155">
                <p style="margin:6px 0"><strong>Name:</strong> ${fullName}</p>
                <p style="margin:6px 0"><strong>Email:</strong> <a href="mailto:${normalizedEmail}">${normalizedEmail}</a></p>
                <p style="margin:6px 0"><strong>Program:</strong> ${program}</p>
                <p style="margin:6px 0"><strong>Country:</strong> ${country}</p>
                ${company ? `<p style="margin:6px 0"><strong>Company:</strong> ${company}</p>` : ''}
                ${website ? `<p style="margin:6px 0"><strong>Website:</strong> <a href="${website}">${website}</a></p>` : ''}
                ${phone ? `<p style="margin:6px 0"><strong>Phone:</strong> ${phone}</p>` : ''}
                ${experience ? `<p style="margin:6px 0"><strong>Experience:</strong> ${experience}</p>` : ''}
                ${message ? `<p style="margin:6px 0"><strong>Message:</strong> ${message}</p>` : ''}
              </div>
              <p style="color:#64748b;font-size:12px;margin:20px 0 0">
                Setup link automatically dispatched to applicant: <a href="${setupUrl}">${setupUrl}</a>
              </p>
            </div>
          `,
          text: `New ${program} partner application from ${fullName} (${normalizedEmail}, ${country}). Setup link: ${setupUrl}`,
        });
      } catch (err) {
        console.error(`[Admin Email Error for ${adminEmail}]`, err);
      }
    }

    console.log(`[Partner Apply] ${normalizedEmail} -> ${program} (setupUrl: ${setupUrl}, applicantNotified: ${applicantNotified})`);

    return NextResponse.json({
      success: true,
      message: 'Application approved! Your account setup link has been sent to your email address.',
      setupUrl,
    });
  } catch (error) {
    console.error('[Partner Apply Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
