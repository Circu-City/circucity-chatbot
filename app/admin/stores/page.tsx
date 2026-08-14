import { getStores } from "@/lib/actions/admin";
import StoresClient from "./StoresClient";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getStores(page, 20, params.search, params.status);
  return <StoresClient initialData={data} />;
}