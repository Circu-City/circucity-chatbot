import { NextRequest, NextResponse } from "next/server";
import { getWebhookVerifyToken } from "@/lib/channels/oauth";
import { handleIncomingMessage } from "@/lib/channels/whatsapp";
import { handleIgIncoming } from "@/lib/channels/instagram";
import { handleMessengerIncoming } from "@/lib/channels/messenger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = await getWebhookVerifyToken();
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const entry = payload.entry?.[0];

    if (!entry) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const object = payload.object;

    if (object === "whatsapp_business_account") {
      await handleIncomingMessage(payload);
    } else if (object === "instagram") {
      await handleIgIncoming(payload);
    } else if (object === "page") {
      await handleMessengerIncoming(payload);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

