const { PrismaClient } = require("@prisma/client");

const STORE_ID = "017875909b694543870e43a35";
const API_KEY = "cc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const MSG = "I want to buy a tote bag, what do you recommend?";

async function main() {
  const res = await fetch("https://chatbot.circucity.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: MSG,
      sessionId: "debug-tote-" + Date.now(),
      apiKey: API_KEY,
      pageType: "audit",
      pageUrl: "https://circucity.com/products/test",
    }),
  });
  const data = await res.json();
  console.log("status", res.status);
  console.log("products", (data.products || []).length, (data.products || []).map((p) => p.name));
  console.log("reply", (data.reply || "").substring(0, 200));
}

main().catch(console.error);