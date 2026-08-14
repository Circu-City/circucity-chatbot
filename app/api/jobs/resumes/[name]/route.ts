import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".rtf": "application/rtf",
  ".odt": "application/vnd.oasis.opendocument.text",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const name = (await params).name;
    if (!/^[0-9a-f-]+\.(pdf|doc|docx|txt|rtf|odt)$/.test(name)) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const ext = path.extname(name).toLowerCase();
    const dir = path.join(process.cwd(), "data", "uploads", "resumes");
    const filePath = path.join(dir, name);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const buf = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Content-Disposition": 'attachment; filename="cv' + ext + '"',
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
}
