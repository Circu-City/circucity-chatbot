import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const channel = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!channel) return NextResponse.json({ success: false, error: "Channel not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: channel });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const body = await req.json();
    const channel = await prisma.channel.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ success: true, data: channel });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    await prisma.channel.update({ where: { id: params.id }, data: { status: "disconnected", isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

