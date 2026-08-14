import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400, headers: corsHeaders });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { sessionId },
  });

  if (!conversation) {
    return NextResponse.json({ messages: [] }, { headers: corsHeaders });
  }

  let messages: any[];
  try {
    messages = JSON.parse(conversation.messages || "[]");
  } catch {
    messages = [];
  }

  return NextResponse.json({ messages, sessionId: conversation.sessionId }, { headers: corsHeaders });
}