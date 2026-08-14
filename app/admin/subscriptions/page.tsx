import { getSubscriptions } from "@/lib/actions/admin";
import SubscriptionsClient from "./SubscriptionsClient";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; plan?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getSubscriptions(page, 20, params.plan, params.status);
  return <SubscriptionsClient initialData={data} />;
}