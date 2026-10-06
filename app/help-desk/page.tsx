import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Help Desk and Ticketing | CircuCity AI",
  description: "Organised support: tickets, workflows and resolution tracking, with Cira handling the repetitive questions first.",
  alternates: { canonical: "/help-desk" },
};

export default function Page() {
  return <PageClient />;
}
