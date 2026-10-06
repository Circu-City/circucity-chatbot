import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "About CircuCity AI",
  description: "Why we are building AI that makes second-hand commerce easier to run, and easier to buy from.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <PageClient />;
}
