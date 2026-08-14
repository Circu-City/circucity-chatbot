import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Backend service is not available" }, { status: 503 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Backend service is not available" }, { status: 503 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: "Backend service is not available" }, { status: 503 });
}
