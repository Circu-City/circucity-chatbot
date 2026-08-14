import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const conversations = await prisma.conversation.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, sessionId: true, customerName: true, customerEmail: true, messages: true, sentiment: true, escalated: true, resolved: true, metadata: true, createdAt: true },
    });

    if (format === "csv") {
      const esc = (v: any) => { const s = String(v || ""); return /[,"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const header = "ID,Customer,Email,Sentiment,Escalated,Resolved,Messages,Date";
      const rows = conversations.map(function(c) {
        const count = Array.isArray(c.messages) ? c.messages.length : 0;
        return [esc(c.id), esc(c.customerName), esc(c.customerEmail), esc(c.sentiment), c.escalated ? "Yes" : "No", c.resolved ? "Yes" : "No", count, esc(new Date(c.createdAt).toISOString())].join(",");
      });
      const csv = "\uFEFF" + header + "\n" + rows.join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=conversations.csv" },
      });
    }

    return NextResponse.json({ success: true, data: conversations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
