const { PrismaClient } = require("@prisma/client");

const STORE_ID = "017875909b694543870e43a35";
const API_KEY = "cc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const CHAT_URL = "https://chatbot.circucity.com/api/chat";

async function chat(message, sessionId, extra = {}) {
  const start = Date.now();
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sessionId,
      apiKey: API_KEY,
      pageType: extra.pageType || "audit",
      pageUrl: extra.pageUrl || "https://circucity.com/products/test",
      ...extra,
    }),
  });
  const elapsed = Date.now() - start;
  const data = await res.json();
  return { ...data, elapsed, status: res.status };
}

function hasHallucination(reply, products) {
  const issues = [];
  if (/CIRCU\d+|SAVE\d+/i.test(reply)) {
    issues.push("invented_discount_code");
  }
  if (/\b\d+%\s*off\b/i.test(reply) && !/don't|do not|no active|not offer|cannot|unfortunately/i.test(reply)) {
    issues.push("invented_discount_code");
  }
  if (/laptop|iphone|dress(?!\s)/i.test(reply) && products?.length === 0) {
    // might hallucinate categories we don't carry
  }
  return issues;
}

const SCENARIOS = [
  {
    id: "01_greeting",
    category: "Tonality",
    message: "Hello!",
    checks: {
      reply: (r) => /cira|help|welcome|hi|hello/i.test(r),
      noProducts: true,
      maxLen: 600,
    },
  },
  {
    id: "02_product_exact",
    category: "Product Search",
    message: "show me desk lamps",
    checks: {
      reply: (r) => /lamp/i.test(r),
      products: (p) => p.length > 0 && p.every((x) => /lamp/i.test(x.name)),
      productCountMax: 5,
    },
  },
  {
    id: "03_product_category",
    category: "Product Search",
    message: "eco-friendly bags",
    checks: {
      reply: (r) => /bag|tote/i.test(r),
      products: (p) => {
        if (!p.length) return false;
        const bad = p.filter(
          (x) => /bracelet|dress|shoe|jeans|shirt|lamp/i.test(x.name) && !/bag|tote/i.test(x.name),
        );
        return bad.length === 0;
      },
    },
  },
  {
    id: "04_sales_rules",
    category: "Sales Rules",
    message: "I want to buy a tote bag, what do you recommend?",
    checks: {
      reply: (r) => /500\s*SEK|free shipping/i.test(r),
      products: (p) => p.length >= 1 && p.length <= 3,
      productsHavePrice: true,
    },
  },
  {
    id: "05_faq_returns",
    category: "Knowledge Base",
    message: "what is your return policy?",
    checks: {
      reply: (r) => /return|refund|day|14/i.test(r),
      noProducts: true,
    },
  },
  {
    id: "06_faq_shipping",
    category: "Knowledge Base",
    message: "how long does shipping take?",
    checks: {
      reply: (r) => /ship|deliver|day|business|postnord/i.test(r),
    },
  },
  {
    id: "07_missing_product",
    category: "Anti-hallucination",
    message: "do you sell gaming laptops?",
    checks: {
      reply: (r) => /don't|do not|not carry|don't have|no gaming|unfortunately/i.test(r),
      noFakeProducts: (r, p) => !p?.some((x) => /laptop|gaming/i.test(x.name)) || p.length === 0,
    },
  },
  {
    id: "08_fake_discount",
    category: "Anti-hallucination",
    message: "is there a discount code for 20% off?",
    checks: {
      reply: (r) => !/CIRCU\d+|SAVE20|WELCOME20/i.test(r) || /don't|no discount|not offer|cannot/i.test(r),
    },
  },
  {
    id: "09_escalation",
    category: "Escalation",
    message: "I need to speak to a human agent right now",
    checks: {
      reply: (r) => /human|agent|team|connect|escalat|support/i.test(r),
    },
  },
  {
    id: "10_gift_shopping",
    category: "Intent",
    message: "I need a birthday gift for my mom",
    checks: {
      reply: (r) => /gift|mom|mother|birthday|interest|prefer|what/i.test(r),
    },
  },
  {
    id: "11_price_filter",
    category: "Product Search",
    message: "show me products under 150 SEK",
    checks: {
      reply: (r) => r.length > 20,
      products: (p) => !p.length || p.every((x) => {
        const num = parseFloat(String(x.price).replace(/[^\d.]/g, ""));
        return isNaN(num) || num <= 150;
      }),
    },
  },
  {
    id: "12_page_context",
    category: "Context",
    message: "tell me about this product",
    extra: { pageUrl: "https://circucity.com/products/cmn6gdu0t000fskbe9flcc761", pageType: "product" },
    checks: {
      reply: (r) => /lamp|desk|180|LED/i.test(r),
    },
  },
];

async function main() {
  const p = new PrismaClient();
  const store = await p.store.findUnique({
    where: { id: STORE_ID },
    include: { embedSettings: true },
  });

  console.log("=".repeat(60));
  console.log("CIRA LIVE CHAT AUDIT");
  console.log("=".repeat(60));
  console.log("\nWorkspace:", store?.name);
  console.log("Bot:", store?.embedSettings?.botName);
  console.log("Tone:", store?.tone, "| Personality:", store?.personality);
  console.log("Sales rules:", store?.salesRules ? "SET (" + store.salesRules.length + " chars)" : "EMPTY");
  console.log("Website:", store?.websiteUrl || store?.url);
  console.log("Active products:", await p.product.count({ where: { storeId: STORE_ID, isActive: true } }));

  let crawl = {};
  try { crawl = JSON.parse(store?.crawlData || "{}"); } catch {}
  console.log("Knowledge: pages=" + (crawl.pages?.length || 0) + " faqs=" + (crawl.faqs?.length || 0) + " docs=" + (crawl.documents?.length || 0));

  const results = [];
  let passed = 0;
  let failed = 0;

  console.log("\n" + "-".repeat(60));
  console.log("LIVE TESTS");
  console.log("-".repeat(60));

  for (const scenario of SCENARIOS) {
    const sessionId = `audit-${scenario.id}-${Date.now()}`;
    try {
      const result = await chat(scenario.message, sessionId, scenario.extra || {});
      const reply = result.reply || "";
      const products = result.products || [];
      const issues = [];
      const checks = scenario.checks;

      if (result.status !== 200 || result.error) issues.push("api_error:" + (result.error || result.status));
      if (checks.reply && !checks.reply(reply)) issues.push("reply_mismatch");
      if (checks.products && !checks.products(products)) issues.push("products_mismatch");
      if (checks.noProducts && products.length > 0) issues.push("unexpected_products");
      if (checks.productCountMax && products.length > checks.productCountMax) issues.push("too_many_products");
      if (checks.productsHavePrice && products.some((x) => !x.price)) issues.push("missing_prices");
      if (checks.noFakeProducts && !checks.noFakeProducts(reply, products)) issues.push("hallucinated_product");
      if (checks.maxLen && reply.length > checks.maxLen) issues.push("reply_too_long");
      if (result.elapsed > 30000) issues.push("slow_response:" + result.elapsed + "ms");

      issues.push(...hasHallucination(reply, products));

      const ok = issues.length === 0;
      if (ok) passed++; else failed++;

      results.push({
        id: scenario.id,
        category: scenario.category,
        ok,
        issues,
        elapsed: result.elapsed,
        replyPreview: reply.substring(0, 150),
        products: products.map((x) => x.name),
      });

      console.log(`\n[${ok ? "PASS" : "FAIL"}] ${scenario.id} (${scenario.category}) — ${result.elapsed}ms`);
      console.log("  Q:", scenario.message);
      console.log("  A:", reply.substring(0, 200) + (reply.length > 200 ? "..." : ""));
      if (products.length) console.log("  Products:", products.map((x) => x.name + (x.price ? " (" + x.price + ")" : "")).join(", "));
      if (issues.length) console.log("  Issues:", issues.join(", "));
    } catch (e) {
      failed++;
      results.push({ id: scenario.id, category: scenario.category, ok: false, issues: ["exception:" + e.message] });
      console.log(`\n[FAIL] ${scenario.id} — exception: ${e.message}`);
    }
  }

  // Conversation continuity test
  console.log("\n" + "-".repeat(60));
  console.log("CONVERSATION CONTINUITY");
  console.log("-".repeat(60));
  const convSession = `audit-continuity-${Date.now()}`;
  const r1 = await chat("show me tote bags", convSession);
  const r2 = await chat("what about the cheapest one?", convSession);
  const contProducts = (r2.products || []).map((x) => x.name).join(" ");
  const contOk =
    r2.reply &&
    r2.reply.length > 20 &&
    !/hello|welcome back/i.test(r2.reply.slice(0, 50)) &&
    (/tote|bag/i.test(r2.reply) || /tote|bag/i.test(contProducts)) &&
    !/cutting|board|lamp|bracelet/i.test(contProducts);
  console.log(`[${contOk ? "PASS" : "FAIL"}] continuity — follow-up references prior context`);
  console.log("  Turn 1 products:", (r1.products || []).map((x) => x.name).join(", "));
  console.log("  Follow-up:", r2.reply?.substring(0, 180) + "...");
  if (r2.products?.length) console.log("  Follow-up products:", r2.products.map((x) => x.name).join(", "));

  console.log("\n" + "=".repeat(60));
  console.log(`SUMMARY: ${passed}/${SCENARIOS.length} scenarios passed, ${failed} failed`);
  console.log("=".repeat(60));

  const byCategory = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { pass: 0, fail: 0 };
    if (r.ok) byCategory[r.category].pass++; else byCategory[r.category].fail++;
  }
  console.log("\nBy category:");
  for (const [cat, v] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${v.pass} pass, ${v.fail} fail`);
  }

  await p.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});