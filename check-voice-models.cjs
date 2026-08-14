const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  for (const model of ["gpt-4o-mini-tts", "tts-1"]) {
    try {
      const response = await client.audio.speech.create({
        model,
        voice: "nova",
        input: "Cira voice test.",
        response_format: "mp3",
      });
      const audio = Buffer.from(await response.arrayBuffer());
      console.log(`${model}: AVAILABLE (${audio.length} bytes)`);
    } catch (error) {
      console.log(
        `${model}: UNAVAILABLE status=${error.status || "unknown"} code=${error.code || "unknown"}`,
      );
    }
  }
})();
