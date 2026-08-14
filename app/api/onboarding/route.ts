import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/middleware-auth';

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const session = verifyToken(token);
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, url, industry, tone, personality, goal, channels, greetingMessage } = await req.json();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        name: name || store.name,
        url: url || store.url,
        industry: industry || store.industry,
        tone: tone || store.tone,
        personality: personality || store.personality,
        greetingMessage: greetingMessage || store.greetingMessage,
        aboutBusiness: goal ? JSON.stringify(goal) : store.aboutBusiness,
        contactInfo: channels ? JSON.stringify(channels) : store.contactInfo,
        apiKey: store.apiKey || 'cc_live_' + Math.random().toString(36).slice(2, 18),
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        apiKey: updated.apiKey,
        url: updated.url,
        industry: updated.industry,
        tone: updated.tone,
        personality: updated.personality,
        greetingMessage: updated.greetingMessage,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
