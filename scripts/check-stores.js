const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

p.store
  .findMany({
    select: { id: true, name: true, websiteUrl: true, url: true, apiKey: true },
  })
  .then(async (stores) => {
    console.log(JSON.stringify(stores, null, 2));
    await p.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await p.$disconnect();
    process.exit(1);
  });