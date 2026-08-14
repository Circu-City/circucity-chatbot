import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const now = new Date().toISOString().split('T')[0];

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}
