import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Cira — AI Commerce Agent | CircuCity AI",
  description: "Cira answers product, stock and order questions instantly, recovers abandoned carts, and hands off to your team when it matters.",
  alternates: { canonical: "/ai-agent" },
};

export default function Page() {
  return <PageClient />;
}
