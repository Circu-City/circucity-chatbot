import prisma from "@/lib/db";
import { mergeCrawlData, resolveStoreWebsiteUrl } from "@/lib/prompt-builder";

interface CrawlResult {
  pages: { url: string; title: string; content: string }[];
  products: { name: string; price?: string; description?: string; image?: string; url?: string }[];
  faqs: { question: string; answer: string }[];
  categories: string[];
  error?: string;
}

async function extractMetaTag(html: string, property: string): Promise<string | null> {
  const match = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + property + '["\'][^>]+content=["\']([^"\']+)["\']', 'i'));
  if (match) return match[1];
  const match2 = html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + property + '["\']', 'i'));
  return match2 ? match2[1] : null;
}

async function extractJsonLd(html: string): Promise<any[]> {
  const items: any[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try { items.push(JSON.parse(match[1])); } catch {}
  }
  return items;
}

async function fetchUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CircuCity-Crawler/1.0" },
    });
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTextPreservingStructure(html: string): string {
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  const parts: string[] = [];

  const headings = cleaned.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi);
  if (headings) {
    for (const h of headings) {
      const text = stripTags(h);
      if (text) parts.push(text);
    }
  }

  const paragraphs = cleaned.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (paragraphs) {
    for (const p of paragraphs) {
      const text = stripTags(p);
      if (text && text.length > 20) parts.push(text);
    }
  }

  const listItems = cleaned.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
  if (listItems) {
    for (const li of listItems) {
      const text = stripTags(li);
      if (text && text.length > 10) parts.push("- " + text);
    }
  }

  const mainContent = cleaned.match(/<main[^>]*>[\s\S]*?<\/main>/gi);
  if (mainContent) {
    for (const m of mainContent) {
      const text = stripTags(m);
      if (text && text.length > 50) parts.push(text);
    }
  }

  const sections = cleaned.match(/<section[^>]*>[\s\S]*?<\/section>/gi);
  if (sections) {
    for (const s of sections) {
      const text = stripTags(s);
      if (text && text.length > 60 && !parts.some(p => text.includes(p) || p.includes(text))) {
        parts.push(text);
      }
    }
  }

  const articles = cleaned.match(/<article[^>]*>[\s\S]*?<\/article>/gi);
  if (articles) {
    for (const a of articles) {
      const text = stripTags(a);
      if (text && text.length > 60 && !parts.some(p => text.includes(p) || p.includes(text))) {
        parts.push(text);
      }
    }
  }

  const divs = cleaned.match(/<div[^>]*>[\s\S]*?<\/div>/gi);
  if (divs) {
    for (const d of divs) {
      if (d.length > 5000) continue;
      const text = stripTags(d);
      if (text && text.length > 80 && !parts.some(p => text.includes(p) || p.includes(text))) {
        parts.push(text);
      }
    }
  }

  return parts
    .map(p => escapeHtmlEntities(p))
    .join("\n\n")
    ;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : "Untitled";
}

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    const baseOrigin = new URL(baseUrl).origin;
    if (url.origin !== baseOrigin) return null;
    const cleaned = url.origin + url.pathname.replace(/\/$/, "").toLowerCase();
    if (cleaned === url.origin) return cleaned + "/";
    return cleaned;
  } catch {
    return null;
  }
}

function shouldCrawl(path: string): boolean {
  const skipExts = [".pdf", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".css", ".js", ".xml", ".json", ".mp4", ".mp3", ".webm", ".woff", ".woff2", ".ttf", ".eot"];
  for (const ext of skipExts) {
    if (path.includes(ext)) return false;
  }
  const skipPaths = ["/cdn-cgi", "/wp-", "/wp-content", "/wp-includes", "/wp-admin", "/api/", "/feed/", "/tag/", "/author/", "/category/", "/search/",
    "/dashboard", "/admin", "/login", "/signin", "/signup", "/register", "/account", "/checkout", "/logout", "/verify", "/onboarding", "/settings", "/invite"];
  for (const sp of skipPaths) {
    if (path.includes(sp)) return false;
  }
  return true;
}

function isJunkPage(html: string, title: string, contentLength: number): boolean {
  if (/just\s*a\s*moment/i.test(title) && html.includes("challenge")) return true;
  if (html.includes("challenge-platform") || html.includes("cf-marker") || html.includes("cf_chl") || html.includes("cf-browser-verification")) return true;
  if (/404|page\s*not\s*found/i.test(title) && contentLength < 200) return true;
  if (contentLength < 80) return true;
  return false;
}

async function crawlPages(baseUrl: string, maxPages: number = 50): Promise<CrawlResult["pages"]> {
  const pages: CrawlResult["pages"] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  const rootUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  queue.push(rootUrl);

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    try {
      console.log("[Crawler] Fetching: " + current);
      const html = await fetchUrl(current);
      const title = extractTitle(html);
      const content = extractTextPreservingStructure(html);
      // Skip Cloudflare challenge screens, 404 shells and near-empty pages —
      // they contain no usable knowledge and pollute the page index.
      if (isJunkPage(html, title, content.length)) {
        console.log("[Crawler] Skipped junk page: " + current + " (" + title + ", " + content.length + " chars)");
      } else {
        pages.push({ url: current, title, content });
        console.log("[Crawler] Done: " + current + " (" + title + ")");
      }

      const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        const normalized = normalizeUrl(href, baseUrl);
        if (normalized && !visited.has(normalized) && !queue.includes(normalized) && shouldCrawl(normalized)) {
          queue.push(normalized);
        }
      }
    } catch (e: any) {
      console.log("[Crawler] Failed: " + current + " - " + e.message);
    }
  }

  // Deduplicate pages that render identical content under different URLs
  // (e.g. "/", "/index", "/home" all serving the home page). Key on the
  // normalized content — NOT the title, because unrelated pages routinely
  // share a generic site-wide title (e.g. "CircuCity - Your Destination for
  // Sustainable Living" on the home, about, policy and leaderboard pages)
  // and title-keyed dedup was collapsing them all into the homepage.
  const unique: CrawlResult["pages"] = [];
  const seenContent = new Set<string>();
  for (const p of pages) {
    const key = p.content.replace(/\s+/g, " ").trim();
    if (seenContent.has(key)) continue;
    seenContent.add(key);
    unique.push(p);
  }
  pages.splice(0, pages.length, ...unique);

  pages.sort((a, b) => {
    const aIsRoot = a.url === rootUrl;
    const bIsRoot = b.url === rootUrl;
    if (aIsRoot && !bIsRoot) return -1;
    if (!aIsRoot && bIsRoot) return 1;
    return a.url.length - b.url.length;
  });

  console.log("[Crawler] Crawled " + pages.length + " pages");
  return pages;
}



async function extractProductsFromListing(html, baseUrl, existing) {
  const found = [];
  
  // Strategy: Find product card containers by looking for divs that contain
  // both a product link and a price pattern within a reasonable distance
  
  // First, find all product URLs and their positions
  const productEntries = [];
  const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const fullUrl = normalizeUrl(href, baseUrl);
    if (!fullUrl) continue;
    const productPattern = /\/(product|item|p|products)\/[^/]+$/i;
    if (!productPattern.test(fullUrl)) continue;
    if (existing.some(p => p.url === fullUrl) || found.some(p => p.url === fullUrl)) continue;
    productEntries.push({ url: fullUrl, pos: linkMatch.index });
  }
  
  // Group nearby product entries (within 200 chars = same product card)
  const grouped = [];
  for (const entry of productEntries) {
    const existingGroup = grouped.find(g => Math.abs(g.pos - entry.pos) < 200);
    if (existingGroup) {
      if (existingGroup.pos > entry.pos) existingGroup.pos = entry.pos;
    } else {
      grouped.push({ url: entry.url, pos: entry.pos });
    }
  }
  
  for (const {url, pos} of grouped) {
    // Use a wide context window around the first product link in the card
    const ctxStart = Math.max(0, pos - 600);
    const ctxEnd = Math.min(html.length, pos + 800);
    const ctx = html.substring(ctxStart, ctxEnd);
    
    // Extract name
    let name;
    const hMatch = ctx.match(/<h[1-6][^>]*>([\s\S]{0,200}?)<\/h[1-6]>/i);
    if (hMatch) {
      const candidate = stripTags(hMatch[1]).trim();
      if (candidate && candidate.length > 2 && candidate.length < 100) name = candidate;
    }
    if (!name) {
      // Look for name in any element with font-bold near the product link
      const nameMatch = ctx.match(/font-bold[^>]*>[\s\S]{0,200}?<\/(?:h[1-6]|div|span)>/i);
      if (nameMatch) {
        const candidate = stripTags(nameMatch[0].replace(/^font-bold[^>]*>/, "")).trim();
        if (candidate && candidate.length > 2 && candidate.length < 100) name = candidate;
      }
    }
    
    // Extract price - handle regular space and &nbsp;
    let price;
    const priceMatch = ctx.match(/(\d+[\.,]?\d*)(?:\s|&nbsp;)*(?:SEK|USD|EUR|GBP|kr|\$|€|£)/i);
    if (priceMatch) {
      price = priceMatch[0].replace(/&nbsp;/g, " ");
    }
    
    // Extract image
    let image;
    const imgs = ctx.match(/<img[^>]+src\s*=\s*["']([^"']+.(?:jpg|jpeg|png|webp|avif)[^"']*)["'][^>]*>/gi);
    if (!imgs || imgs.length === 0) {
      // Fallback: any http img src that's not logo/favicon/icon
      const allImgs = ctx.match(/<img[^>]+src\s*=\s*["'](https?:[^"']+)["'][^>]*>/gi);
      if (allImgs) {
        for (const img of allImgs) {
          const s = img.match(/src\s*=\s*["']([^"']+)["']/i);
          if (!s) continue;
          const src = s[1];
          if (src.includes("logo") || src.includes("favicon") || src.includes("icon") || src.includes("avatar") || src.includes("data:image")) continue;
          image = src; break;
        }
      }
    } else {
      for (const img of imgs) {
        const s = img.match(/src\s*=\s*["']([^"']+)["']/i);
        if (!s) continue;
        const src = s[1];
        if (src.includes("logo") || src.includes("favicon") || src.includes("icon") || src.includes("avatar") || src.includes("data:image")) continue;
        image = src; break;
      }
    }
    
    if (name && name.length > 2 && name.length < 100 && !name.toLowerCase().includes("image") && !name.toLowerCase().includes("loading") && name.length > 2) {
      found.push({ name, price: price || undefined, image: image || undefined, url });
      console.log("[Crawler] Product from listing: " + name + " - " + url + " - " + (price || "no price") + " - " + (image || "no image"));
    }
  }
  return found;
}
async function crawlProducts(baseUrl) {
  const products = [];
  const productPaths = ["/products", "/shop", "/store", "/catalog", "/collections/all", "/"];
  for (const path of productPaths) {
    try {
      const listingUrl = new URL(path, baseUrl).href;
      const html = await fetchUrl(listingUrl);
      const listingProducts = await extractProductsFromListing(html, baseUrl, products);
      for (const p of listingProducts) products.push(p);
      if (products.length > 0) {
        console.log("[Crawler] Found " + products.length + " products from listing " + listingUrl);
        break;
      }
      const visitedProductUrls = new Set(products.filter(p => p.url).map(p => p.url));
      const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const href = linkMatch[1];
        const fullUrl = normalizeUrl(href, baseUrl);
        if (!fullUrl) continue;
        const productPattern = /\/(product|item|p|products)\/[^/]+$/i;
        if (!productPattern.test(fullUrl)) continue;
        if (visitedProductUrls.has(fullUrl)) continue;
        visitedProductUrls.add(fullUrl);
        try {
          const productHtml = await fetchUrl(fullUrl);
          let productName = await extractMetaTag(productHtml, "og:title");
          if (!productName) productName = extractTitle(productHtml);
          let image = await extractMetaTag(productHtml, "og:image");
          if (image && (image.includes("logo") || image.includes("favicon") || image.includes("icon") || image.includes("avatar") || image.includes("data:image") || image === "https://circucity.com/logo-white.png")) image = undefined;
          let price;
          const jsonld = await extractJsonLd(productHtml);
          for (const item of jsonld) {
            if (item["@type"] === "Product") {
              if (item.name) productName = item.name;
              if (item.offers && item.offers.price) {
                price = String(item.offers.price) + (item.offers.priceCurrency ? " " + item.offers.priceCurrency : "");
              }
              if (!image && item.image) {
                image = Array.isArray(item.image) ? item.image[0] : item.image;
              }
            }
          }
          if ((!productName || productName.length < 3) && !productName.startsWith(baseUrl)) {
            const h1Match = productHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (h1Match) productName = stripTags(h1Match[1]);
          }
          const siteName = new URL(baseUrl).hostname.replace(/^www\./, "").split(".")[0];
          const cleanedTitle = (productName || "").replace(/\s*[\-?|].*$/, "").trim();
          if (cleanedTitle.toLowerCase() === siteName.toLowerCase() || cleanedTitle.length < 3) {
            productName = undefined;
          } else {
            productName = cleanedTitle;
          }
          if (!productName) continue;
          if (products.some(p => p.url === fullUrl)) continue;
          if (!price) {
            const priceMeta = await extractMetaTag(productHtml, "product:price:amount");
            if (priceMeta) {
              const currency = await extractMetaTag(productHtml, "product:price:currency");
              price = priceMeta + (currency ? " " + currency : "");
            }
          }
          if (!price) {
            const bodyText = extractTextPreservingStructure(productHtml);
            const priceText = bodyText.match(/(\d+[.,]$|€|£\d*)\s*($|€|£:SEK|USD|EUR|GBP|kr|\$|€|£|€|£)/i);
            if (priceText) price = priceText[0];
          }
          let description = await extractMetaTag(productHtml, "og:description") || await extractMetaTag(productHtml, "description") || undefined;
          products.push({ name: productName, price, description, image: image || undefined, url: fullUrl });
          console.log("[Crawler] Product from page: " + productName + " - " + fullUrl);
        } catch { continue; }
      }
      if (products.length === 0) {
        const c2 = extractTextPreservingStructure(html);
        const n = c2.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/g);
        const p2 = c2.match(/(\d+[\.,]$|€|£\d*\s*($|€|£:SEK|USD|EUR|GBP|kr|\$|€|£|$|€|£|$|€|£))/gi);
        if (n && p2) {
          for (let k = 0; k < Math.min(n.length, 20); k++) {
            if (n[k].length > 50 || n[k].length < 3) continue;
            if (products.some(x => x.name === n[k])) continue;
            products.push({ name: n[k], price: p2[k] || undefined, description: "Product from " + baseUrl });
          }
        }
      }
      break;
    } catch { continue; }
  }
  return products;
}
async function crawlFaqs(baseUrl: string): Promise<CrawlResult["faqs"]> {
  const faqs: CrawlResult["faqs"] = [];
  const faqPaths = ["/faq", "/faqs", "/help", "/support", "/customer-service"];

  for (const path of faqPaths) {
    try {
      const url = new URL(path, baseUrl).href;
      const html = await fetchUrl(url);
      const content = extractTextPreservingStructure(html);

      const pushFaq = (question: string, answer: string) => {
        const q = question.trim().replace(/\s+/g, " ").replace(/[?.!]+\s*$/, "") + "?";
        const a = answer.trim().replace(/\s+/g, " ").substring(0, 500);
        if (q.length > 10 && a.length > 10 && !faqs.some(f => f.question === q)) {
          faqs.push({ question: q, answer: a });
        }
      };

      // Strategy 1: labeled Q:/A: pairs
      const labeled = content.match(/(?:^|\n)\s*Q[:.]\s*(.+?)(?=\n\s*A[:.]\s*)/gi) || [];
      if (labeled.length >= 2) {
        const blocks = content.split(/(?=\n\s*Q[:.])/i);
        for (const block of blocks) {
          const qm = block.match(/Q[:.]\s*([^\n]+)/i);
          const am = block.match(/A[:.]\s*([\s\S]+?)(?=\n\s*Q[:.]|$)/i);
          if (qm && am) pushFaq(qm[1], am[1]);
        }
      }

      // Strategy 2: heading followed by paragraph (What is.../How do I... headings)
      if (faqs.length < 8) {
        const headingPairs = content.match(/(?:^|\n)((?:What|How|Do|Can|When|Where|Why|Is|Are)\b[^\n]{10,100}\?)\s*\n([\s\S]{40,600}?)(?=(?:\n(?:What|How|Do|Can|When|Where|Why|Is|Are)\b[^\n]{10,100}\?)|$)/g);
        if (headingPairs) {
          for (const pair of headingPairs.slice(0, 20)) {
            const parts = pair.split("\n");
            if (parts.length >= 2) pushFaq(parts[0], parts.slice(1).join(" "));
          }
        }
      }

      // Strategy 3: question-sentence followed by answer-sentence pairs
      if (faqs.length < 4) {
        const qaPairs = content.match(/([^.!?]+\?)\s*([^?]+?)(?=[^.!?]+\?|$)/g);
        if (qaPairs) {
          for (const pair of qaPairs.slice(0, 20)) {
            const idx = pair.indexOf("?");
            if (idx > 0) pushFaq(pair.substring(0, idx + 1), pair.substring(idx + 1));
          }
        }
      }

      if (faqs.length > 0) break;
    } catch {
      continue;
    }
  }

  return faqs;
}

export async function crawlWebsite(workspaceId: string): Promise<CrawlResult> {
  const workspace = await prisma.store.findUnique({
    where: { id: workspaceId },
    select: { id: true, websiteUrl: true, url: true, name: true, crawlData: true },
  });

  const siteUrl = workspace ? resolveStoreWebsiteUrl(workspace) : null;
  if (!workspace || !siteUrl) {
    return { pages: [], products: [], faqs: [], categories: [], error: "No website URL configured" };
  }

  const baseUrl = siteUrl;

  console.log("[Crawler] Starting crawl for " + workspace.name + " (" + baseUrl + ")");

  await prisma.store.update({
    where: { id: workspaceId },
    data: { crawlStatus: "crawling" },
  });

  try {
    // Stores with an externally-synced catalog (live catalog sync marks
    // lastSynced) get their products from their own site — scraping them here
    // is slow and risks clobbering authoritative data. Only crawl pages/FAQs.
    const hasExternalCatalog = (await prisma.product.count({
      where: { storeId: workspaceId, isActive: true, lastSynced: { not: null } },
    })) > 0;

    let products: CrawlResult["products"] = [];
    let categories: string[] = [];
    const [pages, crawledProducts, faqs] = await Promise.all([
      crawlPages(baseUrl),
      hasExternalCatalog ? Promise.resolve([] as CrawlResult["products"]) : crawlProducts(baseUrl),
      crawlFaqs(baseUrl),
    ]);
    if (!hasExternalCatalog) {
      products = crawledProducts;
      categories = [...new Set(products.flatMap(p => {
        const cats = p.description?.match(/(?:category|type|for):\s*(\w+)/gi) || [];
        return cats.map(c => c.replace(/(?:category|type|for):\s*/i, ""));
      }))];
    }

    const result: CrawlResult = { pages, products, faqs, categories };

    // Save products to Product table (use URL as unique key, not name).
    // Externally-synced products (live catalog sync marks lastSynced) are the
    // store's own authoritative catalog — the crawler never overwrites or
    // deactivates those, only products it created itself (lastSynced IS NULL).
    if (!hasExternalCatalog) {
      for (const p of products) {
        const priceFloat = p.price ? parseFloat(p.price.replace(/[^0-9.,]/g, "").replace(",", ".")) : 0;
        const currency = p.price?.match(/(SEK|USD|EUR|GBP|kr|\$|€|£)/)?.[1] || "SEK";

        try {
          // Use URL as primary dedup key
          const existing = p.url ? await prisma.product.findFirst({
            where: { storeId: workspaceId, url: p.url },
            select: { id: true, lastSynced: true },
          }) : null;

          if (existing && existing.lastSynced) {
            continue;
          }

          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: {
                price: priceFloat,
                image: p.image || null,
                description: p.description || null,
                name: p.name || "Product",
                isActive: true,
              },
            });
          } else {
            const slug = p.url ? p.url.split("/").pop()?.replace(/\.html$/, "") : (p.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            await prisma.product.create({
              data: {
                storeId: workspaceId,
                name: p.name || "Product",
                price: priceFloat,
                image: p.image || null,
                description: p.description || null,
                url: p.url || null,
                slug,
                currency,
                isActive: true,
              },
            });
          }
        } catch (e: any) {
          console.error("[Crawler] Failed to save product " + (p.name || p.url) + ":", e.message);
        }
      }

      // Deactivate crawler-owned products not found in latest crawl — never
      // externally-synced products (lastSynced IS NULL guards crawler ownership).
      if (products.length > 0) {
        const urls = products.filter(p => p.url).map(p => p.url).filter(Boolean);
        if (urls.length > 0) {
          await prisma.product.updateMany({
            where: { storeId: workspaceId, isActive: true, lastSynced: null, NOT: { url: { in: urls } } },
            data: { isActive: false },
          });
        }
      }
    }

    const merged = mergeCrawlData(workspace.crawlData, result);

    await prisma.store.update({
      where: { id: workspaceId },
      data: {
        crawlStatus: "completed",
        lastCrawl: new Date(),
        crawlData: JSON.stringify(merged),
      },
    });

    // Index crawled knowledge into the vector store for semantic RAG retrieval
    try {
      const { indexCrawlKnowledge } = await import("@/lib/rag");
      await indexCrawlKnowledge(workspaceId, merged);
    } catch (e: any) {
      console.error("[Crawler] Knowledge indexing failed:", e.message || e);
    }

    console.log("[Crawler] Crawl complete: " + pages.length + " pages, " + products.length + " products, " + faqs.length + " FAQs");
    return result;
  } catch (error: any) {
    console.error("[Crawler] Crawl failed:", error.message);
    await prisma.store.update({
      where: { id: workspaceId },
      data: { crawlStatus: "failed" },
    });
    return { pages: [], products: [], faqs: [], categories: [], error: error.message };
  }
}

export async function crawlAllWorkspaces() {
  const workspaces = await prisma.store.findMany({
    where: {
      status: "active",
      // Not gated on ownershipVerified — that flag is only set on the
      // marketplace's own store, which starved every other workspace
      // (vendoura, venhub, ecostore, ...) of scheduled re-crawls.
      crawlStatus: { not: "crawling" },
      OR: [{ websiteUrl: { not: null } }, { url: { not: null } }],
    },
    select: { id: true, name: true, websiteUrl: true, url: true },
  });

  console.log("[Crawler] Running crawl for " + workspaces.length + " workspaces");

  for (const ws of workspaces) {
    try {
      await crawlWebsite(ws.id);
      // Offline enrichment — cheap LLM tier (Groq llama-3.1-8b-instant) turns
      // each fresh crawl into summary + Q&A chunks. Runs detached so it can't
      // block the cron response; it re-reads the stored crawlData and replaces
      // any previous enrich: chunks, so it's idempotent per crawl.
      try {
        const { spawn } = await import("child_process");
        const child = spawn("node", ["--env-file=.env", "scripts/enrich-knowledge.js", ws.id], {
          cwd: process.cwd(),
          detached: true,
          stdio: "ignore",
        });
        child.unref();
        console.log("[Crawler] Enrichment scheduled for workspace " + ws.name);
      } catch (enrichErr: any) {
        console.error("[Crawler] Failed to schedule enrichment for " + ws.name + ":", enrichErr.message);
      }
    } catch (e: any) {
      console.error("[Crawler] Error crawling workspace " + ws.name + ":", e.message);
    }
  }

  console.log("[Crawler] Batch crawl complete");
}
