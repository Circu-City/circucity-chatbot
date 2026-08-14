import { NextRequest, NextResponse } from 'next/server';

const RAG_API_KEY = process.env.RAG_API_KEY || '';

async function proxy(req: NextRequest) {
  return NextResponse.json({ error: "Backend service is not available" }, { status: 503 });
}

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }
export async function PUT(req: NextRequest) { return proxy(req); }
export async function DELETE(req: NextRequest) { return proxy(req); }
