import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body || {};

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing message or sessionId" }, { status: 400 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com"}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId, stream: false }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
