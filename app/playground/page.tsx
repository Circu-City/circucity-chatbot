"use client";

import { Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CiraPlayground from "@/components/dashboard/CiraPlayground";

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-dark-navy flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lemon-gradient rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-dark-navy" />
          </div>
          <span className="text-lg font-bold text-white">
            CircuCity<span className="text-lemon-green">AI</span>
          </span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Test Cira</h1>
            <p className="text-gray-400 text-sm">
              Live playground — real catalog, tone, and sales rules from your workspace.
            </p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            <CiraPlayground compact />
          </div>
        </div>
      </main>
    </div>
  );
}