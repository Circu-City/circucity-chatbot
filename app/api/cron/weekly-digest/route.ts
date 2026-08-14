import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigests } from "@/lib/notifications";

const CRON_API_KEY = process.env.CRON_API_KEY || "circucity-cron-key-2024";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== CRON_API_KEY) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  try {
    await sendWeeklyDigests();
    return NextResponse.json({ success: true, message: "Weekly digests sent" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
