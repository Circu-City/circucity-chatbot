import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Pricing | CircuCity AI",
  description: "Simple, transparent pricing for Cira and Gavriel. Start free, no credit card required.",
  alternates: { canonical: "/pricing" },
};

export default function Page() {
  return <PageClient />;
}
