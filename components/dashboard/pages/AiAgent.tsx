"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Settings2, BookOpen, Zap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import CiraPlayground from "@/components/dashboard/CiraPlayground";
import Link from "next/link";

const tabs = [
  { id: "playground", label: "Playground", icon: Play },
  { id: "configure", label: "Configure", icon: Settings2 },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

export default function AiAgent() {
  const [activeTab, setActiveTab] = useState("playground");

  return (
    <Wrapper>
      <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">● Live</Badge>

      <div className="flex gap-1 bg-white rounded-xl p-1 border border-border shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap",
              activeTab === tab.id
                ? "bg-dark-navy text-white shadow-sm"
                : "text-gray-500 hover:text-dark-navy hover:bg-gray-50",
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "playground" && (
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-lemon-green" />
              <span className="font-semibold text-dark-navy text-sm">Live Cira Playground</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">
              Real API
            </Badge>
          </div>
          <CardContent className="p-0">
            <CiraPlayground />
          </CardContent>
        </Card>
      )}

      {activeTab === "configure" && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Configure Cira&apos;s tone, personality, sales rules, escalation policy, greeting, and
              knowledge base in Settings.
            </p>
            <Link href="/dashboard?tab=settings&settingTab=ai">
              <Button variant="primary" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Open Settings
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </Wrapper>
  );
}
