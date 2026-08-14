import { getUsers } from "@/lib/actions/admin";
import UsersClient from "./UsersClient";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search;
  const data = await getUsers(page, 20, search);
  return <UsersClient initialData={data} />;
}