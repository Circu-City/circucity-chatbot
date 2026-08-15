import OpenAI from "openai";
import prisma from "@/lib/db";
import { semanticSearchProducts, searchProducts } from "@/lib/product-search";
import { semanticSearchDocuments } from "@/lib/rag";
import { buildStoreInfo, selectRelevantFaqs } from "@/lib/prompt-builder";
import { buildCiraVoiceRules } from "@/lib/cira-voice";
import { getStoreCatalog } from "@/lib/product-catalog-cache";
import { ASSISTANT_NAME } from "@/lib/assistant";
import { getComplementCategories } from "@/lib/complementary-pairings";
import { detectLanguage, languageInstruction, languageName } from "@/lib/language";

let _openai: OpenAI | null = null;

function getLLMClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
    if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY or OPENAI_API_KEY");
    _openai = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return _openai;
}

const MODEL = process.env.REPLY_MODEL || process.env.LLM_MODEL || "anthropic/claude-opus-5";
const AGENT_MODEL = process.env.AGENT_MODEL || process.env.AGENT_FREE_MODEL || "llama-3.1-8b-instant";
const FREE_MODEL = process.env.AGENT_FREE_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

const FOUND_SUMMARIES: Record<string, string[]> = {
  en: ["I found {n} products that might work — take a look below."],
  sv: [
    "Jag hittade {n} produkter som kan fungera — ta en titt nedan.",
    "Jag hittade {n} produkter som matchar — kika nedan!",
  ],
  de: [
    "Ich habe {n} Produkte gefunden, die passen könnten — sehen Sie sich diese unten an.",
    "Ich habe {n} passende Produkte gefunden — schauen Sie unten vorbei!",
  ],
  fr: [
    "J'ai trouvé {n} produits qui pourraient convenir — jetez un œil ci-dessous.",
    "J'ai trouvé {n} produits correspondants — regardez ci-dessous !",
  ],
  es: [
    "Encontré {n} productos que podrían funcionar — míralos a continuación.",
    "Encontré {n} productos que coinciden — ¡échales un vistazo!",
  ],
  nl: [
    "Ik heb {n} producten gevonden die kunnen werken — bekijk ze hieronder.",
    "Ik vond {n} passende producten — kijk hieronder!",
  ],
  it: [
    "Ho trovato {n} prodotti che potrebbero andare bene — dai un'occhiata qui sotto.",
    "Ho trovato {n} prodotti corrispondenti — guarda qui sotto!",
  ],
  pt: [
    "Encontrei {n} produtos que podem funcionar — veja abaixo.",
    "Encontrei {n} produtos correspondentes — confira abaixo!",
  ],
  da: [
    "Jeg fandt {n} produkter, der kan fungere — se dem herunder.",
    "Jeg fandt {n} matchende produkter — kig herunder!",
  ],
  no: [
    "Jeg fant {n} produkter som kan passe — se dem nedenfor.",
    "Jeg fant {n} matchende produkter — sjekk nedenfor!",
  ],
  fi: [
    "Löysin {n} tuotetta, jotka saattavat sopia — katso alta.",
    "Löysin {n} tuotetta — katso alta!",
  ],
  pl: [
    "Znalazłem {n} produktów, które mogą pasować — zobacz poniżej.",
    "Znalazłem {n} pasujących produktów — sprawdź poniżej!",
  ],
};

function buildFoundSummary(count: number, lang: string): string {
  const variants = FOUND_SUMMARIES[lang] || FOUND_SUMMARIES.en;
  const variant = variants[Math.min(count - 1, variants.length - 1)];
  return variant.replace("{n}", String(count));
}

export interface AgentContext {
  store: any;
  conversation: any;
  messages: any[];
  userId: string;
  storeId: string;
  catalog: any[];
  crawlData: any;
}

interface AgentResult {
  reply: string;
  actions: any[];
  products: any[];
}

const TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products in the store catalog by name, description, or category",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query for products" },
          maxResults: { type: "number", description: "Maximum results to return" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get detailed information about a specific product by name",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string", description: "The exact product name" },
        },
        required: ["productName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_documents",
      description: "Search the store's knowledge base (FAQs, policies, documents) for information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_store_info",
      description: "Get store information including about, contact, hours, shipping, return policy",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", enum: ["about", "contact", "hours", "shipping", "returns", "privacy", "faq"], description: "The topic to look up" },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Add a product to the customer's shopping cart",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string", description: "The product name" },
          quantity: { type: "number", description: "Quantity to add" },
        },
        required: ["productName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipping_rates",
      description: "Get available shipping rates and costs",
      parameters: {
        type: "object",
        properties: {
          country: { type: "string", description: "Destination country code" },
        },
      },
    },
  },
];

// Llama-family models (including llama-3.3-70b-versatile on Groq) sometimes emit
// their native text-based tool-call format — <function=name>{...json...}</function>
// inline in message content — instead of using the structured OpenAI-style
// `tool_calls` field, even when given a `tools` schema with tool_choice:"auto".
// When that happens finish_reason is "stop", not "tool_calls", so the normal loop
// below never fires and the raw tag leaks straight into the user-visible reply.
// This parses that fallback format so it still gets executed like a real tool call.
// The ">" after the function name is sometimes dropped by the model
// (observed live: "<function=search_products{...}</function>" instead of
// "<function=search_products>{...}</function>") — kept optional to catch both.
const PSEUDO_FUNCTION_RE = /<function=([a-zA-Z0-9_]+)>?([\s\S]*?)<\/function>/g;

// The plain (non-tool-calling) "Reply model" completion in app/api/chat/route.ts
// has no `tools` schema registered, but the underlying Llama model can still
// hallucinate this same pseudo-function-call text from its training data — so
// that path needs this same stripping applied to its output too.
export function stripPseudoFunctionCalls(text: string): string {
  if (!text) return text;
  let out = text.replace(PSEUDO_FUNCTION_RE, "").trim();
  // Models sometimes emit a self-closing pseudo-call with NO closing tag:
  // "<function=get_store_info>{"topic": "about"}" — strip those too, including
  // any JSON payload that trails them (single-level objects).
  out = out.replace(/<function=[a-zA-Z0-9_]+>?\{[^{}]*\}/g, "").trim();
  // If the message is only a dangling opener (no payload), drop it as well.
  out = out.replace(/<function=[a-zA-Z0-9_]+>?\s*$/, "").trim();
  // Llama models sometimes emit a bare <function> tag (no name, no payload).
  out = out.replace(/<function>\s*$/, "").trim();
  out = out.replace(/<function><\/function>/g, "").trim();
  return out;
}

function parsePseudoToolCalls(content: string | null | undefined): any[] {
  if (!content) return [];
  const calls: any[] = [];
  let match: RegExpExecArray | null;
  let i = 0;
  PSEUDO_FUNCTION_RE.lastIndex = 0;
  while ((match = PSEUDO_FUNCTION_RE.exec(content)) !== null) {
    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(match[2]);
    } catch {
      continue;
    }
    calls.push({
      id: "pseudo_" + Date.now() + "_" + i++,
      type: "function",
      function: { name: match[1], arguments: JSON.stringify(parsedArgs) },
    });
  }
  return calls;
}

// Looks up up-to-2 products that pair well with the top search match (e.g. shoes
// for a pair of jeans), using the store's category-pairing table. Duplicates the
// pairing config from circucity_eco's lib/complementary-pairings.ts rather than
// sharing code across the two separate apps/databases — see that file's header.
async function getComplementaryResults(topMatch: any, storeId: string, excludeNames: string[]): Promise<any[]> {
  const complementCategories = getComplementCategories(topMatch?.category);
  if (complementCategories.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: {
      storeId,
      isActive: true,
      category: { in: complementCategories },
      name: { notIn: excludeNames },
    },
    select: { id: true, name: true, price: true, image: true, description: true, category: true, currency: true, url: true, slug: true },
    take: 2,
  });
  return rows.map((r) => ({ ...r, isComplementary: true }));
}

async function executeTool(name: string, args: any, ctx: AgentContext): Promise<string> {
  switch (name) {
    case "search_products": {
      const semantic = await semanticSearchProducts(args.query, ctx.storeId, args.maxResults || 5);
      let results: any[];
      if (semantic.length > 0) {
        results = semantic;
      } else {
        // searchProducts(storeId, query, intent?, store?) — the previous call
        // passed (query, storeId, catalog), shifting every argument and making
        // the tool search with the query text as the storeId (always empty).
        const keyword = await searchProducts(ctx.storeId, args.query);
        results = keyword.slice(0, args.maxResults || 5).map((r) => ({ ...r, score: r.score }));
      }

      if (results.length > 0) {
        const complements = await getComplementaryResults(
          results[0],
          ctx.storeId,
          results.map((r) => r.name),
        );
        results = [...results, ...complements];
      }

      return JSON.stringify(results);
    }
    case "get_product_details": {
      const product = ctx.catalog.find(
        (p: any) => p.name.toLowerCase().includes((args.productName || "").toLowerCase())
      );
      if (!product) return JSON.stringify({ error: "Product not found" });
      return JSON.stringify(product);
    }
    case "search_documents": {
      const docs = await semanticSearchDocuments(args.query, ctx.storeId);
      if (docs.length > 0) return JSON.stringify(docs);
      const faqs = selectRelevantFaqs(args.query, ctx.crawlData);
      return JSON.stringify(faqs);
    }
    case "get_store_info": {
      if (!ctx.crawlData) return JSON.stringify({ error: "No store info available" });
      const pages = ctx.crawlData.pages || [];
      const faqs = ctx.crawlData.faqs || [];
      const topic = args.topic || "about";
      const relevant = [
        ...pages.filter((p: any) => p.title?.toLowerCase().includes(topic) || p.content?.toLowerCase().includes(topic)),
        ...faqs.filter((f: any) => f.question?.toLowerCase().includes(topic) || f.answer?.toLowerCase().includes(topic)),
      ];
      return JSON.stringify(relevant.slice(0, 3));
    }
    case "add_to_cart": {
      const product = ctx.catalog.find(
        (p: any) => p.name.toLowerCase().includes((args.productName || "").toLowerCase())
      );
      if (!product) return JSON.stringify({ error: "Product not found" });
      return JSON.stringify({ success: true, type: "add_to_cart", productId: product.id, productName: product.name, price: product.price, image: product.image, quantity: args.quantity || 1 });
    }
    case "get_shipping_rates": {
      return JSON.stringify([
        { carrier: "PostNord", price: 85.36, currency: "SEK", estimatedDays: "2-4" },
        { carrier: "Shipmondo", price: 81.09, currency: "SEK", estimatedDays: "2-5" },
      ]);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export async function runAgent(userMessage: string, ctx: AgentContext): Promise<AgentResult> {
  const storeInfo = buildStoreInfo(ctx.store, ctx.crawlData, userMessage) || "";
  const voiceRules = buildCiraVoiceRules();
  const userLang = detectLanguage(userMessage);
  const langRule = languageInstruction(userLang);

  const systemPrompt = `You are ${ASSISTANT_NAME}, an AI shopping assistant for ${ctx.store.name || "this store"}.

${voiceRules}

${langRule}

STORE INFORMATION:
${storeInfo.substring(0, 2000) || "No store information available."}

CAPABILITIES:
You have access to tools for:
- Searching products with semantic understanding
- Getting product details
- Searching the store's knowledge base (FAQs, policies, documents)
- Getting store information (hours, contact, shipping, returns)
- Adding products to cart
- Getting shipping rates

RULES:
- Always search for products before recommending them
- For policy questions (shipping, returns, etc.), search documents first
- If you cannot find relevant information, be honest and suggest escalation
- Keep responses concise and helpful
- Do NOT make up product information - only use tool results
- Format prices with currency
- Suggest relevant follow-up products when appropriate
- Some product search results are tagged "isComplementary": true — these pair well with the main match (e.g. shoes suggested alongside jeans), they are not additional direct matches for the query. Mention them naturally as a pairing suggestion (e.g. "this would also go well with...") rather than listing them as equally-relevant results.
- TOOL LANGUAGE: the store catalog, FAQs, and documents are in English. When searching with tools, translate your tool query into ENGLISH keywords (e.g. a Swedish customer asking about "skrivbordslampa" should search "desk lamp"). Your chat reply to the customer must always be in their language (${languageName(userLang)}).`;

  const historyMsgs = ctx.messages.slice(-6).map((m: any) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const llmMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...historyMsgs,
    { role: "user", content: userMessage },
  ];

  let response = await callLLM(llmMessages, TOOLS);
  let actions: any[] = [];
  let products: any[] = [];
  let maxTurns = 5;

  while (maxTurns > 0) {
    maxTurns--;
    const toolCalls = response.choices[0]?.message?.tool_calls || [];
    const rawContent: string = response.choices[0]?.message?.content || "";

    if (!toolCalls.length) {
      const pseudo = parsePseudoToolCalls(rawContent);
      if (!pseudo.length) break;

      // Groq's llama-3.3-70b-versatile doesn't reliably use a hand-synthesized
      // tool-call turn to produce a coherent follow-up (observed: it tends to
      // repeat its pre-search narration instead of summarizing real results),
      // so this path is deliberately single-shot — execute the tool(s) and
      // build the reply deterministically from the actual results rather than
      // trusting another LLM round-trip.
      for (const tc of pseudo) {
        let args: any = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {}
        const result = await executeTool(tc.function.name, args, ctx);

        let parsed: any = {};
        try {
          parsed = JSON.parse(result);
        } catch {}
        if (tc.function.name === "search_products" && Array.isArray(parsed)) products = parsed;
        if (tc.function.name === "add_to_cart" && parsed.success) actions.push(parsed);
      }

      const intro = rawContent.replace(PSEUDO_FUNCTION_RE, "").trim();
      let summary: string;
      if (products.length > 0) {
        summary = buildFoundSummary(products.length, userLang);
      } else if (actions.length > 0) {
        summary = intro || "Done.";
      } else {
        summary = intro || "I couldn't find anything matching that — could you tell me a bit more about what you're looking for?";
      }
      response = { choices: [{ finish_reason: "stop", message: { content: summary } }] } as any;
      break;
    }

    llmMessages.push(response.choices[0].message);

    for (const tc of toolCalls) {
      let args: any = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {}
      const result = await executeTool(tc.function.name, args, ctx);
      llmMessages.push({ role: "tool", tool_call_id: tc.id, content: result });

      let parsed: any = {};
      try {
        parsed = JSON.parse(result);
      } catch {}
      if (tc.function.name === "search_products" && Array.isArray(parsed)) products = parsed;
      if (tc.function.name === "add_to_cart" && parsed.success) actions.push(parsed);
    }

    try {
      response = await callLLM(llmMessages, TOOLS);
    } catch (e) {
      // The tool(s) already ran successfully at this point — a transient
      // failure on the follow-up summary call shouldn't discard those
      // results, so fall back to a deterministic summary instead of
      // throwing (which would otherwise lose `products`/`actions` entirely
      // once this bubbles up to the route handler's own fallback pipeline).
      let summary: string;
      if (products.length > 0) {
        summary = buildFoundSummary(products.length, userLang);
      } else if (actions.length > 0) {
        summary = "Done.";
      } else {
        summary = "I couldn't find anything matching that — could you tell me a bit more about what you're looking for?";
      }
      response = { choices: [{ finish_reason: "stop", message: { content: summary } }] } as any;
      break;
    }
  }

  const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
  return { reply, actions, products };
}

async function callLLM(messages: any[], tools?: any[]) {
  const client = getLLMClient();
  try {
    return await client.chat.completions.create({
      model: AGENT_MODEL,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 2048,
      temperature: 0.7,
    });
  } catch (e: any) {
    const code = e?.status ?? e?.statusCode ?? 0;
    if (code === 402 || code === 429 || /402|429/.test(String(e?.message || ""))) {
      console.warn("Agent model out of credits (" + AGENT_MODEL + "), falling back to " + FREE_MODEL);
      return await client.chat.completions.create({
        model: FREE_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 2048,
        temperature: 0.7,
      });
    }
    throw e;
  }
}
