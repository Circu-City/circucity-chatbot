import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Store Integrations | CircuCity AI",
  description: "Connect Shopify, WooCommerce, Etsy and eBay so Cira works from your real catalogue, stock levels and orders.",
  alternates: { canonical: "/integrations" },
};

export default function Page() {
  return <PageClient />;
}
