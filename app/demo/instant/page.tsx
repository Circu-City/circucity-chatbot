import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Instant 30-Second Demo | CircuCity AI",
  description: "Scan any store and talk to Cira in under a minute. No signup and no credit card.",
  alternates: { canonical: "/demo/instant" },
};

export default function Page() {
  return <PageClient />;
}
