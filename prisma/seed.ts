import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@circucity.com" },
    update: {},
    create: {
      email: "admin@circucity.com",
      name: "Admin",
      passwordHash: adminHash,
      role: "admin",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create demo store for admin
  const adminStore = await prisma.store.upsert({
    where: { id: "demo-admin" },
    update: {},
    create: {
      id: "demo-admin",
      userId: admin.id,
      name: "CircuitCity Store",
      url: "https://circucity.com",
      industry: "ecommerce",
      apiKey: "cc_demo_admin_key_1234567890",
      embedCode: '<script src="https://chatbot.circucity.com/api/widget?apiKey=cc_demo_admin_key_1234567890" async></script>',
      subscriptions: {
        create: { plan: "enterprise", status: "active" },
      },
      embedSettings: {
        create: {
          primaryColor: "#9EF01A",
          botName: "CircuitCity AI Assistant",
          welcomeMessage: "Hi! How can I help you today?",
        },
      },
    },
  });

  // Add demo products
  const products = [
    { name: "Wireless Headphones Pro", price: 299.99, category: "Electronics", stock: 45 },
    { name: "Organic Coffee Beans", price: 24.99, category: "Food & Drink", stock: 120 },
    { name: "Yoga Mat Premium", price: 49.99, category: "Sports", stock: 78 },
    { name: "Smart Water Bottle", price: 34.99, category: "Lifestyle", stock: 200 },
    { name: "Bluetooth Speaker", price: 79.99, category: "Electronics", stock: 33 },
    { name: "Desk Organizer", price: 29.99, category: "Office", stock: 150 },
    { name: "Running Shoes Ultra", price: 129.99, category: "Sports", stock: 60 },
    { name: "LED Desk Lamp", price: 44.99, category: "Office", stock: 85 },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        storeId: adminStore.id,
        ...product,
        description: `High-quality ${product.name.toLowerCase()} for your daily needs.`,
        image: `/products/${product.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
        currency: "USD",
      },
    });
  }
  console.log(`${products.length} products created`);

  // Add demo conversations
  const conversations = [
    { sessionId: "sess_001", customerName: "Alice Johnson", sentiment: "positive", messages: [{ role: "user", content: "Hi, I'm looking for a gift for my husband" }, { role: "assistant", content: "Great! What does he enjoy?" }] },
    { sessionId: "sess_002", customerName: "Bob Smith", sentiment: "neutral", messages: [{ role: "user", content: "Do you ship internationally?" }, { role: "assistant", content: "Yes, we ship to over 50 countries!" }] },
    { sessionId: "sess_003", customerName: "Carol Davis", sentiment: "negative", escalated: true, messages: [{ role: "user", content: "My order hasn't arrived yet" }, { role: "assistant", content: "I'm sorry to hear that. Let me check..." }] },
  ];

  for (const conv of conversations) {
    await prisma.conversation.create({
      data: {
        storeId: adminStore.id,
        ...conv,
      },
    });
  }
  console.log(`${conversations.length} conversations created`);

  console.log("\n✅ Seed complete!");
  console.log("Admin login: admin@circucity.com / Admin123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());