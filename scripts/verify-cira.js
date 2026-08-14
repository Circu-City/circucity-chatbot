const { PrismaClient } = require("@prisma/client");

const STORE_ID = "017875909b694543870e43a35";
const API_KEY = "cc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const CHAT_URL = "https://chatbot.circucity.com/api/chat";

async function chat(message, sessionId) {
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId, apiKey: API_KEY }),
  });
  return res.json();
}

async function main() {
  const p = new PrismaClient();

  const store = await p.store.findUnique({
    where: { id: STORE_ID },
    include: { embedSettings: true },
  });

  console.log("=== STORE SETTINGS ===");
  console.log({
    name: store?.name,
    tone: store?.tone,
    personality: store?.personality,
    botName: store?.embedSettings?.botName,
    greetingMessage: store?.greetingMessage,
    salesRules: store?.salesRules?.substring(0, 80) || "(empty)",
    escalationRules: store?.escalationRules?.substring(0, 80) || "(empty)",
    websiteUrl: store?.websiteUrl || store?.url,
    productCount: await p.product.count({ where: { storeId: STORE_ID, isActive: true } }),
  });

  let crawl = {};
  try {
    crawl = JSON.parse(store?.crawlData || "{}");
  } catch {
    crawl = {};
  }
  console.log("=== KNOWLEDGE BASE ===");
  console.log({
    faqs: crawl.faqs?.length || 0,
    pages: crawl.pages?.length || 0,
    documents: crawl.documents?.length || 0,
    unanswered: crawl.unanswered?.length || 0,
  });

  console.log("\n=== LIVE TESTS ===");

  const tests = [
    { id: "greeting", message: "Hello!", expect: /help|hi|hello|cira/i },
    { id: "product", message: "show me eco-friendly bags", expect: /bag|tote|product|SEK|kr/i },
    { id: "faq", message: "what is your return policy?", expect: /return|day|refund|policy/i },
    { id: "escalation", message: "I want to speak to a human agent please", expect: /human|team|connect|escalat|help/i },
  ];

  for (const test of tests) {
    const result = await chat(test.message, `verify-cira-${test.id}-${Date.now()}`);
    const pass = test.expect.test(result.reply || "");
    console.log(`[${pass ? "PASS" : "FAIL"}] ${test.id}: ${(result.reply || result.error || "").substring(0, 120)}...`);
    if (result.products?.length) {
      console.log(`  products: ${result.products.map((p) => p.name).join(", ")}`);
    }
  }

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});