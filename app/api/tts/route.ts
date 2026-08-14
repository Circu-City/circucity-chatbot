import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

const KOKORO_VOICES: Record<string, string> = {
  sonia: "bf_emma",
  ryan: "bm_george",
  libby: "bf_lily",
  maisy: "bf_emma",
  thomas: "bm_lewis",
  ava: "af_heart",
  emma: "af_bella",
  guy: "am_michael",
  jenny: "af_heart",
  ariana: "af_bella",
  christopher: "am_adam",
  eric: "am_michael",
  michelle: "af_heart",
  amanda: "af_bella",
  brian: "am_adam",
  davis: "am_michael",
  jane: "af_heart",
  nancy: "af_bella",
  tony: "am_adam",
  sara: "af_heart",
};

const VOICES: Record<string, string> = {
  "sonia": "en-GB-SoniaNeural",
  "ryan": "en-GB-RyanNeural",
  "libby": "en-GB-LibbyNeural",
  "maisy": "en-GB-MaisyNeural",
  "thomas": "en-GB-ThomasNeural",
  "ava": "en-US-AvaNeural",
  "emma": "en-US-EmmaMultilingualNeural",
  "guy": "en-US-GuyNeural",
  "jenny": "en-US-JennyNeural",
  "ariana": "en-US-AriaNeural",
  "christopher": "en-US-ChristopherNeural",
  "eric": "en-US-EricNeural",
  "michelle": "en-US-MichelleNeural",
  "amanda": "en-US-AmandaMultilingualNeural",
  "brian": "en-US-BrianNeural",
  "davis": "en-US-DavisNeural",
  "jane": "en-US-JaneNeural",
  "nancy": "en-US-NancyNeural",
  "tony": "en-US-TonyNeural",
  "sara": "en-US-SaraNeural",
};

const VOICE_NAMES: Record<string, string> = {
  "sonia": "Sonia (British, warm)",
  "ryan": "Ryan (British, natural)",
  "libby": "Libby (British, cheerful)",
  "maisy": "Maisy (British, friendly)",
  "thomas": "Thomas (British, calm)",
  "ava": "Ava (American, warm)",
  "emma": "Emma (American, multilingual)",
  "guy": "Guy (American, professional)",
  "jenny": "Jenny (American, friendly)",
  "ariana": "Ariana (American, energetic)",
  "christopher": "Christopher (American, confident)",
  "eric": "Eric (American, calm)",
  "michelle": "Michelle (American, warm)",
  "amanda": "Amanda (American, clear)",
  "brian": "Brian (American, professional)",
  "davis": "Davis (American, friendly)",
  "jane": "Jane (American, warm)",
  "nancy": "Nancy (American, friendly)",
  "tony": "Tony (American, confident)",
  "sara": "Sara (American, cheerful)",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json({
    voices: Object.entries(VOICES).map(([id, voice]) => ({
      id,
      name: VOICE_NAMES[id] || voice,
      voice,
    })),
  }, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice: voiceId } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400, headers: corsHeaders });
    }

    const trimmed = text.trim().substring(0, 1000);
    const selectedVoiceId = typeof voiceId === "string" ? voiceId : "jenny";
    const kokoroVoice = KOKORO_VOICES[selectedVoiceId] || "af_heart";
    const edgeVoice = VOICES[selectedVoiceId] || VOICES["jenny"];

    try {
      const kokoroPython = path.join(process.cwd(), "kokoro-env", "bin", "python3");
      const kokoroScript = path.join(process.cwd(), "scripts", "kokoro_tts.py");
      const { stdout, stderr } = await execFileAsync(
        kokoroPython,
        [kokoroScript, trimmed, kokoroVoice],
        { timeout: 30000, maxBuffer: 20 * 1024 * 1024 },
      );
      if (stderr) console.warn("Kokoro TTS stderr:", stderr);
      return new NextResponse(stdout, {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "X-Cira-Voice-Engine": "kokoro-neural",
        },
      });
    } catch (error: any) {
      console.error("Kokoro TTS failed; falling back to Edge TTS:", error?.message || error);
    }

    const scriptPath = path.join(process.cwd(), "scripts", "tts.py");
    const venvPath = path.join(process.cwd(), "tts-env", "bin", "python3");

    const { stdout, stderr } = await execFileAsync(venvPath, [scriptPath, trimmed, edgeVoice], {
      timeout: 20000,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stderr) console.warn("TTS stderr:", stderr);

    return new NextResponse(stdout, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "X-Cira-Voice-Engine": "edge-fallback",
      },
    });
  } catch (err: any) {
    console.error("TTS error:", err.message || err, err.stderr || "");
    return NextResponse.json({ error: "TTS synthesis failed" }, { status: 500, headers: corsHeaders });
  }
}
