import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Speech-to-text now runs on this box (scripts/whisper_server.py, pm2: cira-stt).
// It replaces the browser's webkitSpeechRecognition, which existed only in
// Chrome/Edge and sent the caller's audio to Google.
const STT_SERVICE = process.env.STT_SERVICE_URL || "http://127.0.0.1:8001";
const MAX_BYTES = 25 * 1024 * 1024;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Language",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: Request) {
  try {
    const audio = await request.arrayBuffer();
    if (!audio.byteLength) {
      return NextResponse.json({ error: "No audio supplied" }, { status: 400, headers: cors });
    }
    if (audio.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Audio too large" }, { status: 413, headers: cors });
    }

    const language = request.headers.get("x-language") || "en";
    const res = await fetch(`${STT_SERVICE}/stt`, {
      method: "POST",
      headers: { "Content-Type": "audio/wav", "X-Language": language },
      body: audio,
      signal: AbortSignal.timeout(60000),
    });

    const payload = await res.json().catch(() => ({ error: "Bad response from STT service" }));
    return NextResponse.json(payload, { status: res.status, headers: cors });
  } catch (error: any) {
    // Service down or restarting: tell the client plainly so it can fall back to
    // the browser recogniser rather than silently dropping the caller's turn.
    console.error("[STT] service unreachable:", error?.message || error);
    return NextResponse.json(
      { error: "Speech recognition is temporarily unavailable" },
      { status: 503, headers: cors },
    );
  }
}
