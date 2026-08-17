"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard-context";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";
import {
  BookOpen, 
  Search, 
  ExternalLink, 
  ChevronRight, 
  Code, 
  LifeBuoy, 
  Zap, 
  MessageCircle,
  FileText,
} from "lucide-react";

interface Article {
  title: string;
  desc: string;
  link: string;
  external?: boolean;
}

interface Category {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    title: "Getting Started",
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    articles: [
      { title: "Quick Start Guide", desc: "Get your bot live in 5 minutes", link: "/docs#quick-start" },
      { title: "Installing the Snippet", desc: "How to add the code to your store", link: "/docs#install-snippet" },
      { title: "Connecting your Store", desc: "Syncing products via CSV or API", link: "/docs#connect-store" },
    ]
  },
  {
    title: "AI Customization",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    articles: [
      { title: "Training your AI", desc: "Fine-tuning the brand voice", link: "/docs#train-ai" },
      { title: "Managing Guardrails", desc: "Preventing AI hallucinations", link: "/docs#guardrails" },
      { title: "Tone & Personality", desc: "Switching between Friendly and Professional", link: "/docs#tone" },
    ]
  },
  {
    title: "Developer API",
    icon: Code,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    articles: [
      { title: "API Reference", desc: "Full documentation of endpoints", link: "/api-docs" },
      { title: "Webhooks Guide", desc: "Automate actions on chat events", link: "/docs/developer-guide#webhooks" },
      { title: "Custom Events", desc: "Track specific user interactions", link: "/docs/developer-guide#custom-events" },
    ]
  },
  {
    title: "Support & Legal",
    icon: LifeBuoy,
    color: "text-green-500",
    bgColor: "bg-green-50",
    articles: [
      { title: "Billing & Plans", desc: "Understanding your subscription", link: "#billing", internalNav: true },
      { title: "GDPR Compliance", desc: "Ensuring user data privacy", link: "/gdpr" },
      { title: "Contact Support", desc: "Get help from our human experts", link: "/contact" },
    ]
  }
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8  max-w-full overflow-hidden">{children}</div>;
}

export default function Documentation() {
  const { t } = useDashboardI18n();
  const router = useRouter();
  const { setActivePage } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.map(cat => ({
      ...cat,
      articles: cat.articles.filter(
        art => art.title.toLowerCase().includes(q) || art.desc.toLowerCase().includes(q)
      )
    })).filter(cat => cat.articles.length > 0);
  }, [searchQuery]);

  const handleArticleClick = (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    if ((article as any).internalNav) {
      setActivePage("billing");
    } else if (article.link.startsWith("/")) {
      router.push(article.link);
    } else {
      window.open(article.link, "_blank");
    }
  };

  return (
    <Wrapper>

<div className="flex flex-col items-center text-center space-y-4 py-8 bg-dark-navy rounded-3xl text-white overflow-hidden relative"><div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl" />

<div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        <BookOpen className="w-12 h-12 text-primary mb-2" />
        <p className="text-slate-400 max-w-xl mx-auto px-6">
          Everything you need to know about CircuCity AI. Find guides, API references, and best practices to optimize your store's AI support.
        </p>
        <div className="relative w-full max-w-md px-6 pt-4">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search for articles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:ring-primary" 
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No articles found for "{searchQuery}"</p>
          <Button variant="ghost" className="mt-2" onClick={() => setSearchQuery("")}>Clear search</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category, i) => (
            <Card key={i} className="border-border shadow-sm hover:border-primary/50 transition-colors group">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", category.bgColor, category.color)}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-dark-navy">{category.title}</h3>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {category.articles.map((article, idx) => (
                    <a 
                      href={article.link} 
                      onClick={(e) => handleArticleClick(e, article)}
                      key={idx} 
                      className="p-4 block hover:bg-slate-50 transition-colors group/item cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-dark-navy group-hover/item:text-primary transition-colors">
                            {article.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {article.desc}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-primary transition-colors shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-border shadow-sm bg-primary/5 border-primary/20 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-dark-navy">{t("docs.developerGuide")}</h4>
            <p className="text-xs text-muted-foreground">{t("docs.developerDesc")}</p>
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-primary text-xs font-bold mt-2 flex items-center gap-1 hover:bg-transparent"
              onClick={() => router.push("/docs/developer-guide")}
            >
              Read more <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-border shadow-sm bg-slate-50 border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <LifeBuoy className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-dark-navy">{t("docs.communityForum")}</h4>
            <p className="text-xs text-muted-foreground">{t("docs.communityDesc")}</p>
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-blue-500 text-xs font-bold mt-2 flex items-center gap-1 hover:bg-transparent"
              onClick={() => router.push("/community-forum")}
            >
              Join Forum <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-border shadow-sm bg-dark-navy text-white flex items-center gap-4">
          <div className="p-3 bg-primary rounded-xl shadow-sm">
            <MessageCircle className="w-6 h-6 text-dark-navy" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold">{t("docs.directSupport")}</h4>
            <p className="text-xs text-slate-400">{t("docs.directDesc")}</p>
            <Button 
              className="mt-2 h-7 px-3 text-xs bg-primary text-dark-navy font-bold hover:bg-primary/90"
              onClick={() => router.push("/support")}
            >
              Open Ticket
            </Button>
          </div>
        </Card>
      </div>
    
    
    
    </Wrapper>
  );
}
