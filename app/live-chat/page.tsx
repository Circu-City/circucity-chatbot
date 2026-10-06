import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Live Chat | CircuCity AI",
  description: "Real-time conversations with your customers, handled by Cira and escalated to a human the moment one is needed.",
  alternates: { canonical: "/live-chat" },
};

export default function Page() {
  return <PageClient />;
}
