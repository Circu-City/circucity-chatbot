import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Revenue Map | CircuCity AI",
  description: "See your store as a commerce graph: where customers drop off, which products stall, and where revenue is leaking.",
  alternates: { canonical: "/revenue-map" },
};

export default function Page() {
  return <PageClient />;
}
