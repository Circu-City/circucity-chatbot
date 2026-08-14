import type { CrawlData } from "@/lib/prompt-builder";
import { selectRelevantFaqs, selectRelevantPages } from "@/lib/prompt-builder";

const FETCH_TIMEOUT_MS = 3500;
const MAX_PAGES = 2;

export function crawlHasRelevantContent(message: string, crawl: CrawlData | null): boolean {
  if (!crawl) return false;
  const pages = selectRelevantPages(message, crawl.pages, 2);
  const faqs = selectRelevantFaqs(message, crawl.faqs, 2);
  const pageScore = pages.some((p) => p.content.length > 80);
  const faqScore = faqs.some((f) => f.answer.length > 40);
  return pageScore || faqScore;
}

const GENERIC_POLICY_PATHS = [
  "/faq",
  "/help",
  "/support",
  "/return-policy",
  "/returns",
  "/shipping-policy",
  "/shipping",
  "/privacy-policy",
  "/privacy",
  "/terms-of-service",
  "/terms",
  "/about",
  "/about-us",
  "/contact",
];

function keywordPaths(message: string): string[] {
  const ql = message.toLowerCase();
  const paths: string[] = [];

  if (ql.includes("return") || ql.includes("refund")) {
    paths.push("/return-policy", "/returns", "/policy");
  }
  if (ql.includes("ship") || ql.includes("deliver")) {
    paths.push("/shipping-policy", "/shipping", "/policy");
  }
  if (ql.includes("privacy") || ql.includes("data")) {
    paths.push("/privacy-policy", "/privacy", "/policy");
  }
  if (ql.includes("terms") || ql.includes("legal")) {
    paths.push("/terms-of-service", "/terms", "/policy");
  }
  if (ql.includes("about") || ql.includes("mission") || ql.includes("who are you")) {
    paths.push("/about", "/about-us");
  }
  if (ql.includes("contact") || ql.includes("email") || ql.includes("phone") || ql.includes("support")) {
    paths.push("/contact", "/support", "/help");
  }
  if (ql.includes("faq") || ql.includes("help") || ql.includes("how")) {
    paths.push("/faq", "/help");
  }
  if (ql.includes("swap") || ql.includes("exchange") || ql.includes("trade")) {
    paths.push("/swap");
  }
  if (ql.includes("token") || ql.includes("points") || ql.includes("eco")) {
    paths.push("/eco-tokens", "/redeem-tokens");
  }

  return paths;
}

function pathsFromCrawl(message: string, crawl: CrawlData | null): string[] {
  if (!crawl?.pages?.length) return [];

  const msg = message.toLowerCase();
  return crawl.pages
    .filter((page) => {
      const title = page.title.toLowerCase();
      const content = page.content.toLowerCase();
      const path = new URL(page.url).pathname.toLowerCase();
      return msg.split(/\s+/).some((word) => {
        if (word.length < 4) return false;
        return title.includes(word) || content.includes(word) || path.includes(word);
      });
    })
    .slice(0, 3)
    .map((page) => {
      try {
        return new URL(page.url).pathname;
      } catch {
        return page.url;
      }
    });
}

export async function fetchLivePageContent(
  websiteUrl: string,
  message: string,
  crawl?: CrawlData | null,
): Promise<string> {
  const base = websiteUrl.replace(/\/+$/, "");
  const paths = [
    ...new Set([
      ...keywordPaths(message),
      ...pathsFromCrawl(message, crawl || null),
      ...GENERIC_POLICY_PATHS.filter((p) => keywordPaths(message).length === 0).slice(0, 0),
    ]),
  ].slice(0, MAX_PAGES);

  async function fetchOne(page: string): Promise<string> {
    try {
      const url = base + page;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "CircuCity-Chatbot/1.0" },
      });
      clearTimeout(timeout);
      if (!res.ok) return "";

      const html = await res.text();
      const cleaned = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
      const text = cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 1200);
      if (text.length > 50) return "\n\n## Live page (" + page + ")\n" + text;
    } catch {
      // skip failed fetches
    }
    return "";
  }

  const chunks = await Promise.all(paths.map(fetchOne));
  return chunks.join("");
}