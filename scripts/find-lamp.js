const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const storeId = "017875909b694543870e43a35";

p.product
  .findMany({
    where: { storeId, name: { contains: "lamp" } },
    select: { name: true, isActive: true, lastSynced: true },
  })
  .then(async (products) => {
    console.log(JSON.stringify(products, null, 2));
    const count = await p.product.count({ where: { storeId, isActive: true } });
    console.log("total active:", count);
    await p.$disconnect();
  });