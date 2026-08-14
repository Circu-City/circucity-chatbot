import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  
  return NextResponse.json({
    success: true,
    data: session ? {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      isImpersonating: session.isImpersonating || false,
      impersonatedBy: session.impersonatedBy || null,
    } : null,
  });
}
