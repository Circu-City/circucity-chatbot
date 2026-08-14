const API_KEY = "cc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const CHAT_URL = "https://chatbot.circucity.com/api/chat";

async function chat(message, sessionId) {
  const start = Date.now();
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sessionId,
      apiKey: API_KEY,
      pageUrl: "https://circucity.com/products/test",
      pageType: "audit",
    }),
  });
  const data = await res.json();
  return { ...data, elapsed: Date.now() - start, status: res.status };
}

async function main() {
  const session = `audit-p3-${Date.now()}`;
  let passed = 0;
  let failed = 0;

  console.log("=".repeat(50));
  console.log("PHASE 3 AUDIT");
  console.log("=".repeat(50));

  // 1. Product search then add to cart
  const r1 = await chat("show me tote bags", session);
  const r2 = await chat("add the cheapest one to my cart", session);
  const cartOk =
    r2.actions?.some((a) => a.type === "add_to_cart") &&
    /added/i.test(r2.reply || "");
  console.log(`[${cartOk ? "PASS" : "FAIL"}] add_to_cart — ${r2.elapsed}ms`);
  console.log("  actions:", (r2.actions || []).map((a) => a.type).join(", "));
  cartOk ? passed++ : failed++;

  // 2. Shipping comparison
  const r3 = await chat("how much does shipping cost?", `${session}-ship`);
  const shipOk =
    r3.actions?.some((a) => a.type === "shipping_comparison") &&
    /postnord/i.test(r3.reply || "") &&
    /shipmondo/i.test(r3.reply || "");
  console.log(`[${shipOk ? "PASS" : "FAIL"}] shipping_comparison — ${r3.elapsed}ms`);
  shipOk ? passed++ : failed++;

  // 3. Carrier pick + checkout
  const shipSession = `${session}-checkout`;
  await chat("shipping options please", shipSession);
  const r4 = await chat("I'll go with Shipmondo", shipSession);
  const r5 = await chat("proceed to checkout", shipSession);
  const checkoutOk =
    r5.actions?.some((a) => a.type === "open_checkout" && a.url?.includes("shipmondo"));
  console.log(`[${checkoutOk ? "PASS" : "FAIL"}] checkout_flow — ${r5.elapsed}ms`);
  checkoutOk ? passed++ : failed++;

  // 4. Stock alert
  const stockSession = `${session}-stock`;
  await chat("notify me when gaming laptops are back in stock", stockSession);
  const r6 = await chat("restock@example.com", stockSession);
  const stockOk =
    r6.actions?.some((a) => a.type === "stock_alert_subscribed") ||
    /registered|notify/i.test(r6.reply || "");
  console.log(`[${stockOk ? "PASS" : "FAIL"}] stock_alert — ${r6.elapsed}ms`);
  stockOk ? passed++ : failed++;

  console.log("=".repeat(50));
  console.log(`SUMMARY: ${passed}/4 passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });