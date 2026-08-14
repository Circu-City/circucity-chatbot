"use client";

import { useState } from "react";
import MarketingShell from '@/components/marketing/MarketingShell';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, Zap, ShoppingBag, Globe, Send, Bot, CheckCircle2, ArrowRight, 
  User, Star, Shield, Loader2 
} from "lucide-react";

const DEMO_MESSAGES = [
  { role: "bot", text: "Hi! I'm the CircuCity AI assistant. Ask me anything about our products!" },
  { role: "user", text: "Do you have eco-friendly t-shirts?" },
  { role: "bot", text: "Yes! We have 12 organic cotton t-shirts in stock. Our best-seller is the 'Green Essential Tee' at 299 SEK. It comes in sizes XS-XXL and 6 colors. Want to see them?" },
  { role: "user", text: "What's your return policy?" },
  { role: "bot", text: "We offer free returns within 30 days of delivery. Items must be unworn with tags attached. You can initiate a return from your account or email support@circucity.com. Refunds are processed within 3-5 business days." },
  { role: "user", text: "Do you ship internationally?" },
  { role: "bot", text: "Yes! We ship worldwide. Delivery to Sweden takes 2-3 days (free over 500 SEK). EU delivery is 4-7 days (50 SEK). International delivery is 7-14 days (100 SEK). All orders are tracked." },
];

export default function DemoPage() {
  const [chatMessages, setChatMessages] = useState<{role: string; text: string}[]>(DEMO_MESSAGES);
  const [userInput, setUserInput] = useState("");
  const [typing, setTyping] = useState(false);

  const demoResponses: Record<string, string> = {
    "price": "Our products range from 99 SEK for accessories to 1,999 SEK for premium jackets. Most items are between 199-599 SEK. We offer free shipping on orders over 500 SEK!",
    "size": "We offer sizes from XS to XXL across all our products. Each product page has a detailed size guide with measurements. If you're between sizes, we recommend sizing up for a comfortable fit.",
    "shipping": "We ship worldwide! Sweden: 2-3 days (free over 500 SEK). EU: 4-7 days (50 SEK). International: 7-14 days (100 SEK). Express shipping available for an additional fee.",
    "return": "30-day free returns on all items. Items must be unworn with tags attached. Start a return from your account page. Refunds processed within 3-5 business days.",
    "payment": "We accept Visa, Mastercard, American Express, PayPal, Klarna, and Swish. All payments are processed securely through Stripe.",
    "contact": "You can reach us at support@circucity.com or call +46 70 123 45 67. Our support team is available Monday-Friday 9:00-17:00 CET.",
    "sustainable": "Sustainability is at our core! All our products use organic or recycled materials. We're Climate Neutral Certified and plant a tree for every order. Our packaging is 100% plastic-free.",
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    const msg = userInput.trim();
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setUserInput("");
    setTyping(true);

    setTimeout(() => {
      let reply = "That's a great question! I'm a demo version showing how CircuCity AI responds to customer inquiries. In production, the AI accesses your full product catalog, knowledge base, and order system to provide accurate, personalized answers.";

      const lower = msg.toLowerCase();
      for (const [key, response] of Object.entries(demoResponses)) {
        if (lower.includes(key)) { reply = response; break; }
      }

      setChatMessages(prev => [...prev, { role: "bot", text: reply }]);
      setTyping(false);
    }, 1000);
  };

  return (
    <MarketingShell>
      <section className="py-20 bg-dark-navy text-white text-center px-6">
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">
          See <span className="text-lemon-green">CircuCity AI</span> in Action
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Try our AI chatbot demo. Ask about products, shipping, returns, or sustainability — just like your customers would.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Demo */}
          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 500 }}>
            <div className="bg-dark-navy text-white p-4 flex items-center gap-3">
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-sm">CircuCity AI Assistant</p>
                <p className="text-xs text-slate-400">Demo mode · Try asking a question</p>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-primary text-dark-navy rounded-br-md" 
                      : "bg-white border shadow-sm rounded-bl-md text-gray-700"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-4 bg-white flex gap-3">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about products, shipping, returns..."
                className="flex-1 h-11"
              />
              <Button onClick={handleSend} className="bg-primary text-dark-navy font-bold">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Features Sidebar */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-dark-navy text-lg mb-3">What Makes It Smart?</h3>
              <div className="space-y-3">
                {[
                  { icon: ShoppingBag, title: "Product Knowledge", desc: "AI knows your entire catalog — prices, stock, variants, and descriptions." },
                  { icon: Globe, title: "Multilingual", desc: "Replies in the customer's language. English, Swedish, German, French, and more." },
                  { icon: Shield, title: "Guardrails", desc: "Prevents hallucinations. Only answers from your approved knowledge base." },
                  { icon: Star, title: "Personalized", desc: "Learns from each conversation to give better recommendations over time." },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-navy">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-dark-navy rounded-2xl p-6 text-white text-center">
              <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-bold mb-2">Ready to add this to your store?</h4>
              <p className="text-sm text-slate-400 mb-4">Free 14-day trial. No credit card required.</p>
              <a href="/sign-up" className="inline-block bg-primary text-dark-navy font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
