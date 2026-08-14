import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: true, data: [] });

    let templates: any[] = [];
    try {
      const meta = JSON.parse(store.metadata || '{}');
      templates = meta.templates || [];
    } catch {}

    return NextResponse.json({ success: true, data: templates });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });

    let meta: any = {};
    try { meta = JSON.parse(store.metadata || '{}'); } catch {}
    const templates = meta.templates || [];

    const t = {
      id: 'tpl_' + Date.now().toString(36),
      name: body.name,
      category: body.category || 'support',
      content: body.content,
      variables: body.variables || [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    templates.push(t);
    meta.templates = templates;

    await prisma.store.update({ where: { id: store.id }, data: { metadata: JSON.stringify(meta) } });
    return NextResponse.json({ success: true, data: t });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });

    let meta: any = {};
    try { meta = JSON.parse(store.metadata || '{}'); } catch {}
    const templates = meta.templates || [];
    const idx = templates.findIndex((t: any) => t.id === body.id);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    templates[idx] = { ...templates[idx], name: body.name, category: body.category, content: body.content, variables: body.variables || [] };
    meta.templates = templates;

    await prisma.store.update({ where: { id: store.id }, data: { metadata: JSON.stringify(meta) } });
    return NextResponse.json({ success: true, data: templates[idx] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });

    let meta: any = {};
    try { meta = JSON.parse(store.metadata || '{}'); } catch {}
    meta.templates = (meta.templates || []).filter((t: any) => t.id !== body.id);

    await prisma.store.update({ where: { id: store.id }, data: { metadata: JSON.stringify(meta) } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
