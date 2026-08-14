const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const STORE_ID = "017875909b694543870e43a35";

p.product
  .findMany({
    where: {
      storeId: STORE_ID,
      isActive: true,
      OR: [{ name: { contains: "laptop" } }, { name: { contains: "Laptop" } }, { price: { lte: 150 } }],
    },
    select: { name: true, price: true, url: true, category: true },
    orderBy: { price: "asc" },
  })
  .then(async (r) => {
    console.log("Laptop matches:", r.filter((x) => /laptop/i.test(x.name)));
    console.log("Under 150 SEK:", r.filter((x) => x.price <= 150).slice(0, 8));
    await p.$disconnect();
  });