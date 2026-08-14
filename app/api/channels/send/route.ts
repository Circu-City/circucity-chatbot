import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendTextMessage } from "@/lib/channels/whatsapp";
import { sendIgTextMessage } from "@/lib/channels/instagram";
import { sendMessengerText } from "@/lib/channels/messenger";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const { channelId, to, text } = await req.json();
    if (!channelId || !to || !text) {
      return NextResponse.json({ success: false, error: "channelId, to, and text required" }, { status: 400 });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, storeId: store.id, status: "connected" },
    });
    if (!channel) return NextResponse.json({ success: false, error: "Channel not found or not connected" }, { status: 404 });

    const creds = JSON.parse(channel.credentials || "{}");

    let result;
    switch (channel.type) {
      case "whatsapp":
        result = await sendTextMessage(creds.accessToken, creds.phoneNumberId, to, text);
        break;
      case "instagram":
        result = await sendIgTextMessage(creds.accessToken, creds.igUserId, to, text);
        break;
      case "messenger":
        result = await sendMessengerText(creds.accessToken, creds.pageId || creds.accessToken, to, text);
        break;
      default:
        return NextResponse.json({ success: false, error: "Unsupported channel type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

