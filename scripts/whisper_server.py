#!/usr/bin/env python3
"""
Resident speech-to-text service (faster-whisper, CPU int8).

Replaces the browser's webkitSpeechRecognition, which only exists in Chrome and
Edge and ships the caller's audio to Google -- neither acceptable for a feature
marketed as on-prem.

Model choice: `base` int8 measured FASTER and MORE accurate than `small` on this
2-vCPU box (RTF 0.15 vs 0.40, 346MB vs 877MB), so base is the default.

Audio contract: the client sends a 16kHz mono WAV. We decode with soundfile and
hand whisper a numpy array directly, which bypasses faster-whisper's PyAV decode
path -- PyAV 19 dropped the `metadata_errors` kwarg faster-whisper still passes,
and older PyAV has no wheel for py3.12 here. Keeping the decode ours avoids both
that breakage and a system ffmpeg dependency.

Binds loopback only. Serialised behind a mutex: CPU-bound, 2 vCPU.
"""
import io
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
HOST = os.environ.get("WHISPER_HOST", "127.0.0.1")
PORT = int(os.environ.get("WHISPER_PORT", "8001"))
DOWNLOAD_ROOT = "/opt/circuitcity-ai/models/whisper"
TARGET_SR = 16000
MAX_BYTES = 25 * 1024 * 1024
MAX_SECONDS = 120

# Without this the model hears "Seara from Circus City" / "Cirque du Cite".
# Biasing the decoder on the product vocabulary fixes the proper nouns outright.
VOCAB_PROMPT = (
    "Cira is the CircuCity AI shopping assistant. "
    "Brands: CircuCity, Cira, Gavriel. Swedish second-hand marketplace."
)

_lock = threading.Lock()
_model = None


def load():
    global _model
    t0 = time.time()
    _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8",
                          download_root=DOWNLOAD_ROOT)
    print(f"[whisper] loaded '{MODEL_SIZE}' int8 in {time.time()-t0:.2f}s", flush=True)


def to_mono_16k(raw: bytes):
    data, sr = sf.read(io.BytesIO(raw), dtype="float32")
    if data.ndim > 1:
        data = data.mean(axis=1)
    if sr != TARGET_SR:
        n = int(len(data) * TARGET_SR / sr)
        data = np.interp(np.linspace(0, len(data), n, endpoint=False),
                         np.arange(len(data)), data).astype("float32")
    return data, len(data) / TARGET_SR


def transcribe(audio, language):
    with _lock:
        segments, info = _model.transcribe(
            audio,
            language=language or None,
            beam_size=1,
            vad_filter=True,
            initial_prompt=VOCAB_PROMPT,
        )
        text = " ".join(s.text.strip() for s in segments).strip()
    return text, info


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/health"):
            self._json(200, {"ok": _model is not None, "model": MODEL_SIZE})
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if not self.path.startswith("/stt"):
            self._json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BYTES:
            self._json(400, {"error": "missing or oversized audio"})
            return
        raw = self.rfile.read(length)
        language = (self.headers.get("X-Language") or "en").strip() or None

        try:
            audio, dur = to_mono_16k(raw)
        except Exception as exc:
            self._json(400, {"error": f"could not decode audio: {exc}"})
            return
        if dur > MAX_SECONDS:
            self._json(400, {"error": "audio too long"})
            return
        if dur < 0.25:
            self._json(200, {"text": "", "duration": dur, "ms": 0})
            return

        try:
            t0 = time.time()
            text, _ = transcribe(audio, language)
            took = int((time.time() - t0) * 1000)
        except Exception as exc:
            print(f"[whisper] transcribe failed: {exc}", flush=True)
            self._json(500, {"error": str(exc)})
            return

        self._json(200, {"text": text, "duration": round(dur, 2), "ms": took})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    load()
    print(f"[whisper] listening on {HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
