import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Voice Calling | CircuCity AI",
  description: "Talk to Cira in your browser. Speech recognition and speech synthesis both run on CircuCity's own servers.",
  alternates: { canonical: "/call" },
};

export default function Page() {
  return <PageClient />;
}
