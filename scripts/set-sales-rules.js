const { PrismaClient } = require("@prisma/client");

const STORE_ID = "017875909b694543870e43a35";

const SALES_RULES = `Always mention free shipping on orders over 500 SEK when discussing purchases.
Highlight CO2 savings or eco benefits when recommending products that have them.
Use SEK for all prices — never invent discount codes or promotions.
Suggest 1-3 products maximum per reply, only from the live catalog.
If a product is out of stock, say so and suggest a similar in-stock alternative.`;

const ESCALATION_RULES = `Escalate to a human agent when the customer explicitly asks for a person.
Escalate when the customer expresses anger about a damaged or wrong order.
After 2 unanswered product requests, offer to connect with the support team.`;

async function main() {
  const p = new PrismaClient();
  const updated = await p.store.update({
    where: { id: STORE_ID },
    data: { salesRules: SALES_RULES, escalationRules: ESCALATION_RULES },
    select: { name: true, salesRules: true, escalationRules: true },
  });
  console.log("Updated:", updated.name);
  console.log("salesRules length:", updated.salesRules?.length);
  console.log("escalationRules length:", updated.escalationRules?.length);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});