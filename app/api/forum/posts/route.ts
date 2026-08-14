import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/middleware-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const posts = await prisma.forumPost.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Forum GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, authorName, authorEmail } = body;

    if (!title || !content || !authorName) {
      return NextResponse.json({ error: "Title, content, and name are required" }, { status: 400 });
    }

    // Check for logged-in user via session cookie
    let authorId: string | undefined;
    const token = request.cookies.get("session")?.value;
    if (token) {
      try {
        const { verifyToken } = await import("@/lib/middleware-auth");
        const session = verifyToken(token);
        if (session) authorId = session.id;
      } catch {}
    }

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        category: category || "General",
        authorName,
        authorEmail: authorEmail || null,
        authorId: authorId || null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Forum POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
