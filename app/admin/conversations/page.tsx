import { getConversations } from "@/lib/actions/admin";
import ConversationsClient from "./ConversationsClient";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; resolved?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getConversations(page, 20, params.search, params.resolved);
  return <ConversationsClient initialData={data} />;
}