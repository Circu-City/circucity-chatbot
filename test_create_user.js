const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const p = new PrismaClient();
  
  // Check existing users
  const users = await p.user.findMany();
  console.log('Existing users:', users.length);
  
  // Create test user
  const hash = await bcrypt.hash('test1234', 12);
  try {
    const user = await p.user.upsert({
      where: { email: 'admin@circucity.com' },
      update: {},
      create: {
        email: 'admin@circucity.com',
        name: 'Admin',
        passwordHash: hash,
        role: 'admin',
      },
    });
    console.log('User created/found:', user.email, user.role);
    
    // Create store for user
    const store = await p.store.upsert({
      where: { id: user.id + '_store' },
      update: {},
      create: {
        id: user.id + '_store',
        userId: user.id,
        name: 'CircuCity Store',
        subscriptions: {
          create: { plan: 'free', status: 'active' }
        }
      },
    });
    console.log('Store created:', store.name);
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await p.$disconnect();
}

main();
