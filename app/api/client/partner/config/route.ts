import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const config = await prisma.partnerConfig.findFirst();
    if (!config) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
