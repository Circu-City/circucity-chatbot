import { getAdminLogs } from "@/lib/actions/admin";
import ActivityClient from "./ActivityClient";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getAdminLogs(page, 30);
  return <ActivityClient initialData={data} />;
}