import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const flows = await prisma.flow.findMany({ where: { storeId: store.id }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ success: true, data: flows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const { name, description, trigger, triggerConfig, steps } = await req.json();
    if (!name) return NextResponse.json({ success: false, error: "name required" }, { status: 400 });
    const flow = await prisma.flow.create({
      data: { storeId: store.id, name, description, trigger: trigger || "page_visit", triggerConfig, steps: Array.isArray(steps) ? JSON.stringify(steps) : (steps || "[]") },
    });
    return NextResponse.json({ success: true, data: flow });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    const flow = await prisma.flow.update({ where: { id, storeId: store.id }, data });
    return NextResponse.json({ success: true, data: flow });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    await prisma.flow.delete({ where: { id, storeId: store.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
