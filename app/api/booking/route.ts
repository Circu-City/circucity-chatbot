import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { date, slot, duration, platform, meetingLink, name, email, notes } = await req.json();

    let meetingUrl = meetingLink || null;

    // For Google Meet, create a unique meeting code
    if (platform === "google-meet" && !meetingLink) {
      const code = Array.from({ length: 3 }, () =>
        Math.random().toString(36).substring(2, 6)
      ).join("-");
      meetingUrl = `https://meet.google.com/${code}`;
    }

    console.log('[Booking]', { date, slot, duration, platform, meetingUrl, name, email, notes });

    return NextResponse.json({
      success: true,
      message: 'Booking received',
      meetingUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
