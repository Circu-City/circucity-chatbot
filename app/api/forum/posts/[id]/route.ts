import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: params.id },
      include: { replies: { orderBy: { createdAt: "asc" } }, author: { select: { id: true, name: true, email: true } } },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Increment view count
    await prisma.forumPost.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { content, authorName, authorEmail } = body;
    if (!content || !authorName) return NextResponse.json({ error: "Content and name required" }, { status: 400 });

    let authorId: string | undefined;
    const token = request.cookies.get("session")?.value;
    if (token) {
      try {
        const { verifyToken } = await import("@/lib/middleware-auth");
        const session = verifyToken(token);
        if (session) authorId = session.id;
      } catch {}
    }

    const reply = await prisma.forumReply.create({
      data: { postId: params.id, content, authorName, authorEmail: authorEmail || null, authorId: authorId || null },
    });

    await prisma.forumPost.update({ where: { id: params.id }, data: { replyCount: { increment: 1 } } });

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
