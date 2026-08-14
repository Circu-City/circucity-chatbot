const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const storeId = "017875909b694543870e43a35";

p.product
  .findMany({
    where: { storeId, isActive: true },
    select: { name: true, price: true, url: true, lastSynced: true },
    take: 10,
    orderBy: { lastSynced: "desc" },
  })
  .then(async (products) => {
    console.log("active products:", products.length);
    console.log(JSON.stringify(products, null, 2));
    await p.$disconnect();
  });