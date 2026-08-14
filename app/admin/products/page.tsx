import { getProducts } from "@/lib/actions/admin";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getProducts(page, 20, params.search, params.category);
  return <ProductsClient initialData={data} />;
}