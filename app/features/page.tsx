import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "All Features | CircuCity AI",
  description: "Everything Cira and Gavriel do, in one place: conversations, catalogue intelligence, voice, integrations and analytics.",
  alternates: { canonical: "/features" },
};

export default function Page() {
  return <PageClient />;
}
