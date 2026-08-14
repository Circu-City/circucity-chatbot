import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { metadata: true },
    });

    let settings = {};
    try { settings = JSON.parse(store?.metadata || '{}'); } catch {}

    return NextResponse.json({ success: true, data: settings });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const store = await prisma.store.findFirst({
      where: { userId: session.id },
    });
    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });

    let metadata: any = {};
    try { metadata = JSON.parse(store.metadata || '{}'); } catch {}

    metadata.booking = {
      bookingEnabled: body.bookingEnabled ?? false,
      meetingPlatform: body.meetingPlatform || 'google-meet',
      meetingLink: body.meetingLink || '',
      bufferTime: body.bufferTime || '15',
      maxBookingsPerDay: body.maxBookingsPerDay || '5',
      availableDays: body.availableDays || ['mon','tue','wed','thu','fri'],
      workingHours: body.workingHours || { start: '09:00', end: '17:00' },
      greeting: body.greeting || 'Would you like to book a call with us?',
    };

    await prisma.store.update({
      where: { id: store.id },
      data: { metadata: JSON.stringify(metadata) },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
