import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ user: null });
  }
}
