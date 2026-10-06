#!/usr/bin/env python3
"""
Resident Kokoro TTS service.

The previous design shelled out to scripts/kokoro_tts.py per request, which
reconstructed Kokoro() -- and therefore re-read the 311MB ONNX graph -- every
single time, costing ~1.4s before a syllable was produced. This keeps the model
resident and pays that once at boot.

Deliberately stdlib-only: no FastAPI/uvicorn. Synthesis is CPU-bound and the
ONNX session is not safe to drive concurrently, so requests are serialised
behind a mutex. On a 2-vCPU box that is also what we want -- parallel synthesis
would only thrash the scheduler and make every caller slower.

Binds loopback only; nginx/Next talks to it over 127.0.0.1.
"""
import io
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_PATH = "/opt/circuitcity-ai/models/kokoro/kokoro-v1.0.onnx"
VOICES_PATH = "/opt/circuitcity-ai/models/kokoro/voices-v1.0.bin"
HOST = os.environ.get("KOKORO_HOST", "127.0.0.1")
PORT = int(os.environ.get("KOKORO_PORT", "8000"))
DEFAULT_VOICE = "af_heart"
MAX_CHARS = 2000

_lock = threading.Lock()
_kokoro = None
_voices = []


def load():
    global _kokoro, _voices
    t0 = time.time()
    _kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
    _voices = sorted(_kokoro.get_voices())
    # First synthesis warms the graph; without it the first real caller pays it.
    _kokoro.create("Ready.", voice=DEFAULT_VOICE, speed=1.0, lang="en-us")
    print(f"[kokoro] loaded {len(_voices)} voices in {time.time() - t0:.2f}s", flush=True)


def synth(text: str, voice: str, speed: float) -> bytes:
    with _lock:
        samples, rate = _kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    buf = io.BytesIO()
    sf.write(buf, samples, rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send(self, code, body: bytes, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/health"):
            self._send(200, json.dumps({"ok": _kokoro is not None, "voices": len(_voices)}).encode())
        elif self.path.startswith("/voices"):
            self._send(200, json.dumps({"voices": _voices}).encode())
        else:
            self._send(404, b'{"error":"not found"}')

    def do_POST(self):
        if not self.path.startswith("/tts"):
            self._send(404, b'{"error":"not found"}')
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._send(400, b'{"error":"invalid json"}')
            return

        text = (payload.get("text") or "").strip()[:MAX_CHARS]
        if not text:
            self._send(400, b'{"error":"missing text"}')
            return
        voice = payload.get("voice") or DEFAULT_VOICE
        if voice not in _voices:
            voice = DEFAULT_VOICE
        try:
            speed = float(payload.get("speed") or 0.96)
        except (TypeError, ValueError):
            speed = 0.96

        try:
            t0 = time.time()
            wav = synth(text, voice, speed)
            took = time.time() - t0
        except Exception as exc:
            print(f"[kokoro] synth failed: {exc}", flush=True)
            self._send(500, json.dumps({"error": str(exc)}).encode())
            return

        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(wav)))
        self.send_header("X-Kokoro-Voice", voice)
        self.send_header("X-Kokoro-Synth-Ms", str(int(took * 1000)))
        self.end_headers()
        self.wfile.write(wav)

    def log_message(self, *args):
        pass  # pm2 captures stdout; default logging is per-request noise


if __name__ == "__main__":
    load()
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[kokoro] listening on {HOST}:{PORT}", flush=True)
    srv.serve_forever()
