import prisma from "@/lib/db";
import type { ProductResult } from "@/lib/product-search";

export async function resolvePageProduct(
  storeId: string,
  pageUrl?: string | null,
): Promise<ProductResult | null> {
  if (!pageUrl) return null;

  const match = pageUrl.match(/\/products\/([^/?#]+)/i);
  if (!match) return null;

  const token = decodeURIComponent(match[1]);

  const product = await prisma.product.findFirst({
    where: {
      storeId,
      isActive: true,
      OR: [
        { id: token },
        { slug: token },
        { url: { contains: token } },
      ],
    },
    select: {
      id: true,
      name: true,
      price: true,
      url: true,
      image: true,
      description: true,
      category: true,
      stock: true,
      currency: true,
    },
  });

  if (!product) return null;

  return {
    ...product,
    relevance: 100,
  };
}

export function isPageProductQuery(message: string): boolean {
  return /this product|tell me about|more about|about this|is this|details on|info on|what is this/i.test(
    message,
  );
}