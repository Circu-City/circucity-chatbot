const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
async function main() {
  const p = new PrismaClient();
  const u = await p.user.findUnique({ where: { email: 'admin@circucity.com' } });
  if (!u) {
    const hash = await bcrypt.hash('CircuCityAdmin2026!', 12);
    const nu = await p.user.create({ data: { email: 'admin@circucity.com', name: 'Admin', passwordHash: hash, role: 'admin' } });
    await p.store.create({ data: { userId: nu.id, name: 'CircuCity Admin', subscriptions: { create: { plan: 'enterprise', status: 'active' } }, embedSettings: { create: {} } } });
    console.log('Created admin in chatbot schema');
  } else {
    const hash = await bcrypt.hash('CircuCityAdmin2026!', 12);
    await p.user.update({ where: { email: u.email }, data: { passwordHash: hash, role: 'admin' } });
    console.log('Updated admin. Role:', u.role, 'Email:', u.email);
  }
  await p.$disconnect();
}
main().catch(e => { console.error(e); try { require('@prisma/client').PrismaClient.prototype.$disconnect() } catch {} });
