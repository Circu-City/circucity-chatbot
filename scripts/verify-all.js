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
  const store = await p.store.findUnique({ where: { id: STORE_ID } });
  console.log("=== SALES RULES SET ===", !!store?.salesRules);

  const tests = [
    {
      id: "sales-rules",
      message: "I want to buy a tote bag, what do you recommend?",
      expect: /500\s*SEK|free shipping/i,
      checkProducts: (products) => products.length <= 3,
    },
    {
      id: "relevance-bags",
      message: "show me eco-friendly bags",
      expect: /bag|tote/i,
      checkProducts: (products) => {
        if (!products.length) return false;
        const bad = products.filter(
          (p) => /bracelet|dress|shoe|jeans|shirt/i.test(p.name) && !/bag|tote/i.test(p.name),
        );
        return bad.length === 0;
      },
    },
    {
      id: "relevance-lamp",
      message: "show me desk lamps",
      expect: /lamp/i,
      checkProducts: (products) =>
        products.length > 0 && products.every((p) => /lamp/i.test(p.name)),
    },
  ];

  console.log("\n=== TESTS ===");
  let passed = 0;
  for (const test of tests) {
    const result = await chat(test.message, `verify-all-${test.id}-${Date.now()}`);
    const textOk = test.expect.test(result.reply || "");
    const prodOk = test.checkProducts ? test.checkProducts(result.products || []) : true;
    const ok = textOk && prodOk;
    if (ok) passed++;
    console.log(
      `[${ok ? "PASS" : "FAIL"}] ${test.id}`,
      (result.reply || "").substring(0, 100) + "...",
    );
    if (result.products?.length) {
      console.log("  products:", result.products.map((p) => p.name).join(", "));
    }
  }
  console.log(`\n${passed}/${tests.length} passed`);
  await p.$disconnect();
  process.exit(passed === tests.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});