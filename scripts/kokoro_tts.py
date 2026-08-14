import io
import sys

import soundfile as sf
from kokoro_onnx import Kokoro


MODEL_PATH = "/opt/circuitcity-ai/models/kokoro/kokoro-v1.0.onnx"
VOICES_PATH = "/opt/circuitcity-ai/models/kokoro/voices-v1.0.bin"


def synthesize(text: str, voice: str) -> bytes:
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
    samples, sample_rate = kokoro.create(
        text,
        voice=voice,
        speed=0.96,
        lang="en-us",
    )
    output = io.BytesIO()
    sf.write(output, samples, sample_rate, format="WAV", subtype="PCM_16")
    return output.getvalue()


if __name__ == "__main__":
    input_text = sys.argv[1]
    selected_voice = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
    sys.stdout.buffer.write(synthesize(input_text, selected_voice))
