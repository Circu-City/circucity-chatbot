const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.product.findMany({
  where: { storeId: "017875909b694543870e43a35" },
  take: 3,
  select: { id: true, name: true, url: true, price: true, stock: true },
})
  .then((r) => { console.log(JSON.stringify(r, null, 2)); return p.$disconnect(); })
  .catch((e) => { console.error(e); process.exit(1); });