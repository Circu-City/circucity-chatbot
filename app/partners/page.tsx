import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Partner Programme | CircuCity AI",
  description: "Become a CircuCity partner: refer merchants, earn recurring commission, and get listed in our partner directory.",
  alternates: { canonical: "/partners" },
};

export default function Page() {
  return <PageClient />;
}
