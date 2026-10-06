import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Docs and Help Center | CircuCity AI",
  description: "Guides, setup walkthroughs and API reference for Cira, Gavriel and the CircuCity widget.",
  alternates: { canonical: "/docs" },
};

export default function Page() {
  return <PageClient />;
}
