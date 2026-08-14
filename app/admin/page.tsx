import { getPlatformStats } from "@/lib/actions/admin";
import AdminOverviewClient from "./AdminOverviewClient";

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();
  return <AdminOverviewClient stats={stats} />;
}