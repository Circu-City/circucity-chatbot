import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gavriel AI — Autonomous AI Commerce Operating System",
  description: "Transform raw product photos into high-converting e-commerce listings with multimodal vision inspection, generative studio staging, and multi-channel synchronization.",
};

export default function GavrielLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#07090E] min-h-screen text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
      {children}
    </div>
  );
}
