"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: { name: string; price?: string | null; url?: string | null }[];
};

type StoreInfo = {
  apiKey?: string | null;
  name?: string | null;
  embedSettings?: { botName?: string | null; welcomeMessage?: string | null } | null;
  greetingMessage?: string | null;
};

export default function CiraPlayground({ compact = false }: { compact?: boolean }) {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => `playground-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const botName = store?.embedSettings?.botName || "Cira";
  const greeting =
    store?.greetingMessage ||
    store?.embedSettings?.welcomeMessage ||
    `Hi! I'm ${botName}. How can I help you today?`;

  useEffect(() => {
    fetch("/api/client/store")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setStore(d.data);
          setMessages([{ role: "assistant", content: greeting }]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [greeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !store?.apiKey) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          apiKey: store.apiKey,
          pageType: "playground",
          pageUrl: "https://chatbot.circucity.com/dashboard?tab=playground",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text2 = await res.text();
      let data: any;
      try { data = JSON.parse(text2); } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Server error (" + res.status + "). Please try again." }]);
        setSending(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error || "Sorry, I couldn't respond right now.",
          products: data.products,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e?.name === "AbortError" ? "Request timed out. Please try a simpler question." : "Connection lost. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center", compact ? "h-64" : "h-96")}>
        <Loader2 className="w-6 h-6 animate-spin text-lemon-green" />
      </div>
    );
  }

  if (!store?.apiKey) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Generate an API key in Settings before testing Cira.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", compact ? "h-[420px]" : "h-[500px]")}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white"
      >
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "assistant" ? "justify-start" : "justify-end")}>
            <div className="max-w-[85%] space-y-2">
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "assistant"
                    ? "bg-white border border-gray-200 text-gray-700 shadow-sm"
                    : "bg-lemon-gradient text-dark-navy font-medium",
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase">
                    <Bot className="w-3 h-3" /> {botName}
                  </div>
                )}
                {msg.content}
              </div>
              {msg.products && msg.products.length > 0 && (
                <div className="space-y-1.5">
                  {msg.products.map((p, j) => (
                    <a
                      key={j}
                      href={p.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl text-xs hover:border-lemon-green/50 transition"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-lemon-green shrink-0" />
                      <span className="font-medium text-dark-navy truncate">{p.name}</span>
                      {p.price && <span className="text-gray-500 shrink-0">{p.price}</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {botName} is typing...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-white flex gap-3">
        <input
          type="text"
          placeholder="Type a customer message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={sending}
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none text-gray-700 placeholder-gray-400 disabled:opacity-50"
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="bg-lemon-gradient text-dark-navy p-2.5 rounded-xl"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}