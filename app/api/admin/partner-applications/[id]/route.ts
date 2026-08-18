import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://chatbot.circucity.com';
const PARTNERS_URL = process.env.PARTNERS_URL || 'https://partners.circucity.com';
const PARTNERS_SYNC_SECRET = process.env.PARTNERS_SYNC_SECRET || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nassershangwe@gmail.com';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const { action } = await req.json();
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({ where: { id: params.id } });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (action === 'approve') {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { status: 'approved' },
      });

      try {
        await prisma.staffActivity.create({
          data: { userId: admin.id, action: "partner_approved", details: `${partner.firstName || ''} ${partner.lastName || ''} (${partner.email || ''}) approved` },
        });
      } catch {}

      const programLabel = partner.type ? partner.type.charAt(0).toUpperCase() + partner.type.slice(1) : 'Partner';
      const name = `${partner.firstName || ''} ${partner.lastName || ''}`.trim();

      let setupUrl = `${BASE_URL}/partner/setup?token=${partner.verificationToken}`;
      let syncedToPartners = false;
      if (PARTNERS_SYNC_SECRET && partner.email) {
        try {
          const syncRes = await fetch(`${PARTNERS_URL}/api/sync/approved-partner`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-sync-secret': PARTNERS_SYNC_SECRET,
            },
            body: JSON.stringify({
              email: partner.email,
              name,
              country: partner.country || '',
              program: partner.type || 'affiliate',
            }),
          });
          const syncData = await syncRes.json();
          if (syncRes.ok && syncData.setupUrl) {
            setupUrl = syncData.setupUrl;
            syncedToPartners = true;
          } else {
            console.error('[Partner Sync Error]', syncData);
          }
        } catch (e) {
          console.error('[Partner Sync Error]', e);
        }
      }

      let emailSent = false;
      if (partner.email) {
        try {
          emailSent = await sendEmail({
            to: partner.email,
            subject: 'You are accepted! Set up your CircuCity Partner account',
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:16px;padding:40px">
                <div style="text-align:center;margin-bottom:32px">
                  <div style="width:48px;height:48px;background:#A3E635;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#0A1428">C</div>
                </div>
                <h1 style="color:#0A1428;font-size:24px;font-weight:800;margin:0 0 8px;text-align:center">Welcome to the ${programLabel} Program!</h1>
                <p style="color:#6b7280;font-size:15px;text-align:center;margin:0 0 32px">Hi ${name}, congratulations! Your application has been approved.</p>
                <div style="background:#fff;border-radius:12px;padding:32px;text-align:center">
                  <p style="color:#374151;font-size:14px;margin:0 0 24px">Complete your onboarding — create your password and access your partner dashboard on partners.circucity.com with the button below.</p>
                  <a href="${setupUrl}" style="display:inline-block;background:#A3E635;color:#0A1428;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">Create Password & Access Dashboard</a>
                  <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">This link expires in 7 days.</p>
                </div>
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin:32px 0 0">- CircuCity Partner Team</p>
              </div>
            `,
            text: `Hi ${name}, congratulations! Your application to join the ${programLabel} program has been approved. Complete your onboarding and access your partner dashboard at ${setupUrl}`,
          });
        } catch (e) {
          console.error('[Partner Approve Email Error]', e);
        }
      }

      return NextResponse.json({ success: true, verifyUrl: setupUrl, syncedToPartners, emailSent });
    }

    await prisma.partner.update({
      where: { id: partner.id },
      data: { status: 'rejected' },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}