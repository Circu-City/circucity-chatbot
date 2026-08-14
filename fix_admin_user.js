const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const p = new PrismaClient();

async function main() {
  const email = 'admin@circucity.com';
  const password = 'CircuCityAdmin2026!';
  const hash = await bcrypt.hash(password, 12);

  const existing = await p.user.findUnique({ where: { email } });
  if (existing) {
    await p.user.update({
      where: { email },
      data: { passwordHash: hash, role: 'admin', name: 'Admin' },
    });
    console.log('Updated admin user');
  } else {
    await p.user.create({
      data: { email, name: 'Admin', passwordHash: hash, role: 'admin' },
    });
    await p.store.create({
      data: {
        userId: (await p.user.findUnique({ where: { email } })).id,
        name: 'CircuCity Admin',
        subscriptions: { create: { plan: 'enterprise', status: 'active' } },
        embedSettings: { create: {} },
      },
    });
    console.log('Created admin user');
  }
  console.log('Email:', email);
  console.log('Password:', password);
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
