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

// European-market Edge voices: used automatically when the text is not
// English (Kokoro on-prem only supports English phonetics).
const EDGE_LANG_VOICES: Record<string, string> = {
  sv: "sv-SE-SofieNeural",
  de: "de-DE-KatjaNeural",
  fr: "fr-FR-DeniseNeural",
  es: "es-ES-ElviraNeural",
  nl: "nl-NL-ColetteNeural",
  it: "it-IT-ElsaNeural",
  pt: "pt-PT-RaquelNeural",
  da: "da-DK-ChristelNeural",
  no: "nb-NO-PernilleNeural",
  fi: "fi-FI-NooraNeural",
  pl: "pl-PL-ZofiaNeural",
};

function detectLang(text: string): string {
  const t = " " + text.toLowerCase().replace(/[^a-zåäöæøüßàâçéèêëîïôùûÿñ]/g, " ") + " ";
  const markers: Record<string, string[]> = {
    sv: ["hej", "jag", "är", "och", "leverans", "retur", "köpa", "beställa", "finns", "vad", "hur", "frakt", "pris", "tack", "tröja", "skor", "mig", "vill"],
    de: ["guten", "hallo", "ich", "wie", "was", "kann", "nicht", "und", "lieferung", "kaufen", "bestellen", "danke", "versand", "preis"],
    fr: ["bonjour", "je", "comment", "quelle", "livraison", "retour", "acheter", "commander", "merci", "délai", "prix", "moi"],
    es: ["hola", "cómo", "qué", "entrega", "devolución", "comprar", "pedido", "gracias", "envío", "precio", "quiero"],
    nl: ["hallo", "ik", "hoe", "wat", "kan", "niet", "levering", "retour", "kopen", "bestellen", "dank", "verzending", "prijs"],
    it: ["ciao", "buongiorno", "io", "che", "cosa", "non", "consegna", "resa", "comprare", "grazie", "spedizione", "prezzo"],
    pt: ["olá", "ola", "eu", "como", "que", "não", "nao", "entrega", "comprar", "obrigado", "envio", "preço", "preco"],
    da: ["hej", "jeg", "og", "ikke", "til", "kan", "levering", "retur", "købe", "bestille", "findes", "hvad", "hvordan", "tak"],
    no: ["hei", "jeg", "og", "ikke", "til", "kan", "levering", "retur", "kjøpe", "bestille", "finnes", "hva", "hvordan", "takk"],
    fi: ["hei", "moi", "minä", "ja", "ei", "voiko", "toimitus", "palautus", "ostaa", "tilata", "mitä", "miten", "kiitos"],
    pl: ["cześć", "czesc", "witam", "ja", "jak", "co", "nie", "dostawa", "zwrot", "kupić", "zamówić", "dziękuję", "cena"],
  };
  const scores: Record<string, number> = {};
  for (const [lang, words] of Object.entries(markers)) {
    let s = 0;
    for (const w of words) if (t.includes(" " + w + " ") || t.includes(" " + w + "s ")) s++;
    if (s > 0) scores[lang] = s;
  }
  if (/[åäö]/i.test(t)) scores.sv = (scores.sv || 0) + 2;
  if (/[äöüß]/i.test(t)) scores.de = (scores.de || 0) + 2;
  if (/[æøå]/i.test(t)) { scores.da = (scores.da || 0) + 2; scores.no = (scores.no || 0) + 1; }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return top.length ? top[0][0] : "en";
}

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
    marketVoices: EDGE_LANG_VOICES,
  }, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice: voiceId, lang } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400, headers: corsHeaders });
    }

    const trimmed = text.trim().substring(0, 1000);
    const selectedVoiceId = typeof voiceId === "string" ? voiceId : "jenny";
    const textLang = typeof lang === "string" && /^[a-z]{2}$/.test(lang) ? lang : detectLang(trimmed);
    const kokoroVoice = KOKORO_VOICES[selectedVoiceId] || "af_heart";
    const edgeVoice = textLang !== "en" && EDGE_LANG_VOICES[textLang]
      ? EDGE_LANG_VOICES[textLang]
      : (VOICES[selectedVoiceId] || VOICES["jenny"]);

    // Kokoro (on-prem) only synthesizes English phonetics correctly; route
    // non-English text straight to Edge TTS so European languages are
    // spoken natively instead of with mangled English sounds.
    if (textLang === "en") {
      try {
        const kokoroPython = path.join(process.cwd(), "kokoro-env", "bin", "python3");
        const kokoroScript = path.join(process.cwd(), "scripts", "kokoro_tts.py");
        const { stdout, stderr } = await execFileAsync(
          kokoroPython,
          [kokoroScript, trimmed, kokoroVoice],
          { timeout: 30000, maxBuffer: 20 * 1024 * 1024, encoding: "buffer" },
        );
                if (stderr) console.warn("Kokoro TTS stderr:", stderr);
                // Pass the buffer as Uint8Array — NextResponse otherwise coerces
        // binary buffers to a UTF-8 string and corrupts the WAV bytes.
        return new NextResponse(new Blob([stdout]), {
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
    }

    const scriptPath = path.join(process.cwd(), "scripts", "tts.py");
    const venvPath = path.join(process.cwd(), "tts-env", "bin", "python3");

    const { stdout, stderr } = await execFileAsync(venvPath, [scriptPath, trimmed, edgeVoice], {
      timeout: 20000,
      maxBuffer: 10 * 1024 * 1024,
      encoding: "buffer",
    });
        if (stderr) console.warn("TTS stderr:", stderr);

    return new NextResponse(new Blob([stdout]), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "X-Cira-Voice-Engine": textLang !== "en" ? "edge-market-" + textLang : "edge-fallback",
      },
    });
  } catch (err: any) {
    console.error("TTS error:", err.message || err, err.stderr || "");
    return NextResponse.json({ error: "TTS synthesis failed" }, { status: 500, headers: corsHeaders });
  }
}