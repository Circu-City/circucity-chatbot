import { getApiKeys } from "@/lib/actions/admin";
import ApiKeysClient from "./ApiKeysClient";

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getApiKeys(page, 20);
  return <ApiKeysClient initialData={data} />;
}