import prisma from "@/lib/db";

export async function subscribeStockAlert(params: {
  storeId: string;
  email: string;
  productId: string;
  productName: string;
  marketplaceProductId?: string;
}) {
  const email = params.email.toLowerCase().trim();
  return prisma.stockAlert.upsert({
    where: {
      storeId_email_productId: {
        storeId: params.storeId,
        email,
        productId: params.productId,
      },
    },
    create: {
      storeId: params.storeId,
      email,
      productId: params.productId,
      productName: params.productName,
      marketplaceProductId: params.marketplaceProductId,
      notified: false,
    },
    update: {
      productName: params.productName,
      marketplaceProductId: params.marketplaceProductId,
      notified: false,
      notifiedAt: null,
    },
  });
}

export async function processStockAlertsForProduct(
  storeId: string,
  productId: string,
  stock: number | null | undefined,
) {
  if (!stock || stock <= 0) return [];

  const pending = await prisma.stockAlert.findMany({
    where: { storeId, productId, notified: false },
  });

  if (!pending.length) return [];

  const now = new Date();
  await prisma.stockAlert.updateMany({
    where: { id: { in: pending.map((a) => a.id) } },
    data: { notified: true, notifiedAt: now },
  });

  return pending;
}