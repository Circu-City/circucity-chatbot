import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await requireAdmin();

    const response = NextResponse.json({ success: true });

    // Clear impersonation cookie
    response.cookies.set("impersonate", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
