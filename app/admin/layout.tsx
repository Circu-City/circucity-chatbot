import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminLayout from "./AdminLayout";

export const metadata = {
  title: "Admin Dashboard - CircuCity AI",
  description: "CircuCity AI Admin Management Dashboard",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }
  return <AdminLayout>{children}</AdminLayout>;
}