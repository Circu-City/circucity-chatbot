import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { teamInviteEmail } from "@/lib/email";

export async function GET() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const orgMembers = store.orgId
      ? await prisma.teamMember.findMany({
          where: { orgId: store.orgId },
          include: { user: { select: { id: true, email: true, name: true, image: true, role: true } } },
        })
      : [];

    return NextResponse.json({ success: true, data: orgMembers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store || !store.orgId) return NextResponse.json({ success: false, error: "No organization" }, { status: 400 });
    const { email, role } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: "email required" }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    const existing = await prisma.teamMember.findUnique({ where: { orgId_userId: { orgId: store.orgId, userId: targetUser.id } } });
    if (existing) return NextResponse.json({ success: false, error: "Already a member" }, { status: 409 });

    const member = await prisma.teamMember.create({ data: { orgId: store.orgId, userId: targetUser.id, role: role || "member" } });

    // Send invite email to the new member
    await teamInviteEmail({
      email: targetUser.email,
      inviterName: user.name || user.email || "A team member",
      storeName: store.name || "Your Store",
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://chatbot.circucity.com"}/dashboard`,
    });

    return NextResponse.json({ success: true, data: member });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store || !store.orgId) return NextResponse.json({ success: false, error: "No organization" }, { status: 400 });
    const { id, role } = await req.json();
    if (!id || !role) return NextResponse.json({ success: false, error: "id and role required" }, { status: 400 });
    const member = await prisma.teamMember.update({ where: { id }, data: { role } });
    return NextResponse.json({ success: true, data: member });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store || !store.orgId) return NextResponse.json({ success: false, error: "No organization" }, { status: 400 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

