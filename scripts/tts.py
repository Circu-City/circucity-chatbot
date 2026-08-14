import asyncio
import edge_tts
import sys
import io

async def synthesize(text: str, voice: str = "en-US-JennyNeural") -> bytes:
    communicate = edge_tts.Communicate(text, voice)
    audio = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.write(chunk["data"])
    return audio.getvalue()

if __name__ == "__main__":
    text = sys.argv[1]
    voice = sys.argv[2] if len(sys.argv) > 2 else "en-US-JennyNeural"
    audio = asyncio.run(synthesize(text, voice))
    sys.stdout.buffer.write(audio)
