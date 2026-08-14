import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const ALLOWED = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json({ success: false, error: "Unsupported file type. Use PDF, DOC, DOCX, TXT, RTF or ODT." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }
    const name = randomUUID() + ext;
    const dir = path.join(process.cwd(), "data", "uploads", "resumes");
    fs.mkdirSync(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, name), buf);
    return NextResponse.json({ success: true, data: { url: "/api/jobs/resumes/" + name } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
