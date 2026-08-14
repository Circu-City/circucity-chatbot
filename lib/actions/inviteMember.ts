"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { teamInviteEmail } from "@/lib/email";

export async function inviteTeamMember(orgId: string, email: string, role: string = "member") {
  const session = await requireAuth();

  const org = await prisma.organization.findFirst({ where: { id: orgId, userId: session.id } });
  if (!org) throw new Error("Organization not found");

  // Check member limit based on plan
  const memberCount = await prisma.teamMember.count({ where: { orgId } });
  const maxMembers = org.plan === "enterprise" ? 999 : org.plan === "growth" ? 10 : 3;
  if (memberCount >= maxMembers) {
    throw new Error(`Your ${org.plan} plan allows up to ${maxMembers} team members. Upgrade to add more.`);
  }

  // Find or create user by email
  let invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    const tempPassword = await bcrypt.hash("changeme_" + Date.now(), 10);
    invitee = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        password: tempPassword,
      },
    });
  }

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { orgId_userId: { orgId, userId: invitee.id } },
  });
  if (existing) throw new Error("User is already a team member");

  // Can't invite yourself
  if (invitee.id === session.id) throw new Error("You cannot invite yourself");

  const member = await prisma.teamMember.create({
    data: { orgId, userId: invitee.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  // Send invite email to the new member
  await teamInviteEmail({
    email: invitee.email,
    inviterName: session.name || session.email || "A team member",
    storeName: org.name || "Your Store",
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://chatbot.circucity.com"}/dashboard`,
  });

  revalidatePath("/dashboard");
  return member;
}

export async function removeTeamMember(orgId: string, memberId: string) {
  const session = await requireAuth();

  const org = await prisma.organization.findFirst({ where: { id: orgId, userId: session.id } });
  if (!org) throw new Error("Organization not found");

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Member not found");
  if (member.userId === org.userId) throw new Error("Cannot remove the organization owner");

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMemberRole(orgId: string, memberId: string, role: string) {
  const session = await requireAuth();

  const org = await prisma.organization.findFirst({ where: { id: orgId, userId: session.id } });
  if (!org) throw new Error("Organization not found");

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Member not found");
  if (member.userId === org.userId) throw new Error("Cannot change the owner's role");

  await prisma.teamMember.update({ where: { id: memberId }, data: { role } });
  revalidatePath("/dashboard");
  return { success: true };
}
