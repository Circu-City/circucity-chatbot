import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/db";
import { getBearerToken, verifyWidgetSessionToken } from "@/lib/widget-session";
import { understandQuery } from "@/lib/query-understanding";
import { searchProducts, formatProductsForPrompt } from "@/lib/product-search";
import {
  buildStoreInfo,
  buildSystemPrompt,
  buildEscalationGuidance,
  resolveStoreWebsiteUrl,
  type CrawlData,
} from "@/lib/prompt-builder";
import { crawlHasRelevantContent, fetchLivePageContent } from "@/lib/live-page-fetch";
import { retrieveKnowledge, formatKnowledgeForPrompt } from "@/lib/rag";
import {
  formatCatalogCompact,
  formatCatalogNamesOnly,
  getStoreCatalog,
} from "@/lib/product-catalog-cache";
import { resolvePageProduct, isPageProductQuery } from "@/lib/page-product";
import { chatCompletionStream, chatCompletionWithRetry, sseEncode } from "@/lib/llm";
import { notifyNewConversation, notifyEscalation } from "@/lib/notifications";
import { buildFollowUpIntentInstructions } from "@/lib/cira-voice";
import {
  parseConversationContext,
  detectFollowUp,
  resolveFollowUpProducts,
  buildEnrichedQuery,
  buildConversationContext,
  shouldPreserveContext,
} from "@/lib/conversation-context";
import { processChatActions, type ChatAction } from "@/lib/chat-actions";
import { runAgent, stripPseudoFunctionCalls } from "@/lib/agent-engine";
import { detectLanguage, languageInstruction, languageName } from "@/lib/language";
import {
  parseSessionMetadata,
  serializeSessionMetadata,
  type FlowState,
} from "@/lib/session-metadata";
import { checkChatMessageForFlows } from "@/lib/flows/engine";
import {
  checkRateLimit,
  extractPdfText,
  isDuplicateRequest,
  trackWidgetEvent,
} from "@/lib/widget-api";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1" }) 
  : null;

// Strongest-available model client (OpenRouter) used for final grounded replies
const replyClient = process.env.OPENROUTER_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" })
  : openai;

// Google Gemini client used as the final fallback tier (separate endpoint + key).
const GEMINI_MODEL_ENV = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const geminiClient = process.env.GEMINI_API_KEY
  ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" })
  : null;

const clientForModel = (model: string) => (geminiClient && model === GEMINI_MODEL_ENV ? geminiClient : replyClient);

// Localized fallback strings used when the pipeline short-circuits before the
// LLM gets a chance to translate (direct product matches, zero-match lists,
// free-shipping notes). Keyed by detectLanguage() codes.
const LOCALIZED_FALLBACKS: Record<string, Record<string, string>> = {
  en: {
    foundOne: "I found a product that matches your search — take a look below.",
    foundMany: "I found {count} products that match your search — here are the best options.",
    noExactMatch: "We couldn't find an exact match, but here's what's available: {topCats}. Would you like me to compare options, check policies, or narrow this down to your budget and use case?",
    freeShipping: "Orders over 500 SEK qualify for free shipping.",
  },
  sv: {
    foundOne: "Jag hittade en produkt som matchar din sökning — ta en titt nedan.",
    foundMany: "Jag hittade {count} produkter som matchar din sökning — här är de bästa alternativen.",
    noExactMatch: "Vi hittade ingen exakt matchning, men här är vad som finns: {topCats}. Vill du att jag jämför alternativen, kollar villkor eller begränsar sökningen utifrån din budget och ditt användningsområde?",
    freeShipping: "Beställningar över 500 SEK berättigar till fri frakt.",
  },
  de: {
    foundOne: "Ich habe ein Produkt gefunden, das zu Ihrer Suche passt — schauen Sie sich das unten an.",
    foundMany: "Ich habe {count} Produkte gefunden, die zu Ihrer Suche passen — hier sind die besten Optionen.",
    noExactMatch: "Wir konnten keinen exakten Treffer finden, aber das ist verfügbar: {topCats}. Soll ich Optionen vergleichen, Richtlinien prüfen oder die Suche auf Ihr Budget und Ihren Verwendungszweck eingrenzen?",
    freeShipping: "Bestellungen über 500 SEK sind versandkostenfrei.",
  },
  fr: {
    foundOne: "J'ai trouvé un produit correspondant à votre recherche — jetez un œil ci-dessous.",
    foundMany: "J'ai trouvé {count} produits correspondant à votre recherche — voici les meilleures options.",
    noExactMatch: "Nous n'avons pas trouvé de correspondance exacte, mais voici ce qui est disponible : {topCats}. Voulez-vous que je compare les options, vérifie les conditions ou affine la recherche selon votre budget et votre besoin ?",
    freeShipping: "Les commandes de plus de 500 SEK bénéficient de la livraison gratuite.",
  },
  es: {
    foundOne: "Encontré un producto que coincide con tu búsqueda — míralo a continuación.",
    foundMany: "Encontré {count} productos que coinciden con tu búsqueda — aquí están las mejores opciones.",
    noExactMatch: "No encontramos una coincidencia exacta, pero esto es lo que hay disponible: {topCats}. ¿Quieres que compare opciones, revise políticas o acote la búsqueda según tu presupuesto y tu caso de uso?",
    freeShipping: "Los pedidos superiores a 500 SEK tienen envío gratuito.",
  },
  nl: {
    foundOne: "Ik heb een product gevonden dat bij je zoekopdracht past — bekijk het hieronder.",
    foundMany: "Ik heb {count} producten gevonden die bij je zoekopdracht passen — hier zijn de beste opties.",
    noExactMatch: "We konden geen exacte match vinden, maar dit is er beschikbaar: {topCats}. Wil je dat ik opties vergelijk, voorwaarden controleer of de zoekopdracht verfijn op basis van je budget en gebruikssituatie?",
    freeShipping: "Bestellingen boven 500 SEK komen in aanmerking voor gratis verzending.",
  },
  it: {
    foundOne: "Ho trovato un prodotto che corrisponde alla tua ricerca — dai un'occhiata qui sotto.",
    foundMany: "Ho trovato {count} prodotti che corrispondono alla tua ricerca — ecco le migliori opzioni.",
    noExactMatch: "Non abbiamo trovato una corrispondenza esatta, ma ecco cosa è disponibile: {topCats}. Vuoi che confronti le opzioni, verifichi le policy o restringa la ricerca in base al tuo budget e alle tue esigenze?",
    freeShipping: "Gli ordini superiori a 500 SEK hanno diritto alla spedizione gratuita.",
  },
  pt: {
    foundOne: "Encontrei um produto que corresponde à sua pesquisa — veja abaixo.",
    foundMany: "Encontrei {count} produtos que correspondem à sua pesquisa — aqui estão as melhores opções.",
    noExactMatch: "Não encontramos uma correspondência exata, mas aqui está o que está disponível: {topCats}. Quer que eu compare opções, verifique as políticas ou refine a pesquisa com base no seu orçamento e na sua necessidade?",
    freeShipping: "Pedidos acima de 500 SEK têm frete grátis.",
  },
  da: {
    foundOne: "Jeg fandt et produkt, der matcher din søgning — se det herunder.",
    foundMany: "Jeg fandt {count} produkter, der matcher din søgning — her er de bedste muligheder.",
    noExactMatch: "Vi kunne ikke finde et præcist match, men her er hvad der er tilgængeligt: {topCats}. Vil du have, at jeg sammenligner muligheder, tjekker politikker eller indsnævrer søgningen til dit budget og dit behov?",
    freeShipping: "Ordrer over 500 SEK er berettiget til gratis forsendelse.",
  },
  no: {
    foundOne: "Jeg fant et produkt som matcher søket ditt — se det nedenfor.",
    foundMany: "Jeg fant {count} produkter som matcher søket ditt — her er de beste alternativene.",
    noExactMatch: "Vi fant ingen eksakt match, men her er hva som er tilgjengelig: {topCats}. Vil du at jeg sammenligner alternativer, sjekker vilkår eller begrenser søket til budsjettet ditt og bruksområdet?",
    freeShipping: "Ordrer over 500 SEK kvalifiserer for gratis frakt.",
  },
  fi: {
    foundOne: "Löysin tuotteen, joka vastaa hakua — katso alta.",
    foundMany: "Löysin {count} tuotetta, jotka vastaavat hakuasi — tässä parhaat vaihtoehdot.",
    noExactMatch: "Emme löytäneet tarkkaa osumaa, mutta tässä on mitä on saatavilla: {topCats}. Haluatko, että vertailen vaihtoehtoja, tarkistan ehdot tai rajaan haun budjettisi ja käyttötarkoituksesi mukaan?",
    freeShipping: "Yli 500 SEK:n tilaukset oikeuttavat ilmaiseen toimitukseen.",
  },
  pl: {
    foundOne: "Znalazłem produkt pasujący do Twojego wyszukiwania — zobacz poniżej.",
    foundMany: "Znalazłem {count} produktów pasujących do Twojego wyszukiwania — oto najlepsze opcje.",
    noExactMatch: "Nie znaleźliśmy dokładnego dopasowania, ale oto co jest dostępne: {topCats}. Czy chcesz, abym porównał opcje, sprawdził zasady lub zawęził wyszukiwanie do Twojego budżetu i potrzeb?",
    freeShipping: "Zamówienia powyżej 500 SEK kwalifikują się do darmowej dostawy.",
  },
};

// General "what does this store sell" questions — answer with the catalog overview,
// never the "couldn't find an exact match" replacement.
const isStoreOverviewQuery = (msg: string) =>
  /what do you (sell|have|offer|carry|stock)|what does this store sell|what products do you (sell|have|offer|carry)|what kinds? of products|categories do you|tell me about your (store|shop|products|catalog)|what is this store|about your store|what is your store about|what can i (buy|find|get) here|what do you (guys|all) sell|whats? on (the|your) site|what do you sell here/i.test(msg);

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin || "https://chatbot.circucity.com";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request.headers.get("origin")) });
}

function normalizeRole(role: string | null | undefined): "user" | "assistant" | "system" | "tool" {
  if (role === "tool") return "tool";
  if (role === "bot" || role === "assistant") return "assistant";
  if (role === "system") return "system";
  return "user";
}

function buildConversationState(
  intent: Awaited<ReturnType<typeof understandQuery>> | null,
  isFollowUp: boolean,
  productCount: number,
) {
  if (!intent) return undefined;
  const isProductIntent =
    intent.intent === "product_search" ||
    intent.intent === "gift_shopping" ||
    !!intent.category ||
    intent.priceMin != null ||
    intent.priceMax != null;
  if (!isProductIntent) return undefined;
  return {
    category: intent.category || null,
    priceMin: intent.priceMin ?? null,
    priceMax: intent.priceMax ?? null,
    keywords: Array.isArray(intent.keywords) ? intent.keywords.slice(0, 3) : null,
    giftFor: intent.giftFor || null,
    giftOccasion: intent.giftOccasion || null,
    productCount,
    message: isFollowUp ? "updating your search" : "finding products",
  };
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let storeIdForErrors: string | null = null;
  let knowledgeContext = "";
  let responseSources: { title: string; url: string }[] = [];
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: getCorsHeaders(request.headers.get("origin")) });
    }

    let { message, sessionId, visitorId, apiKey, pageUrl, pageType, attachments, customerName, customerEmail, requestId, stream: wantStream } = body || {};
    const useStream = wantStream === true || wantStream === "true";

    if (isDuplicateRequest(requestId)) {
      return NextResponse.json(
        { success: true, duplicate: true, reply: null, products: [], actions: [] },
        { headers: getCorsHeaders(request.headers.get("origin")) },
      );
    }

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 120) {
      return NextResponse.json({ error: "Missing or invalid sessionId" }, { status: 400, headers: getCorsHeaders(request.headers.get("origin")) });
    }

    if (typeof message === "string") {
      message = message.slice(0, 4000);
    }

    // Detect the customer's language once per request (used for reply language
    // enforcement, localized fallback strings, and TTS voice selection).
    const userLang = detectLanguage(typeof message === "string" ? message : "");
    const userLangRule = languageInstruction(userLang);

    // Attachment handling
    const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
    const MAX_TOTAL_ATTACHMENT_SIZE = 15 * 1024 * 1024;
    let pendingUploads: { name: string; text: string }[] = [];

    if (Array.isArray(attachments) && attachments.length > 4) {
      return NextResponse.json({ error: "Too many attachments (max 4)." }, { status: 413, headers: getCorsHeaders(request.headers.get("origin")) });
    }

    if (attachments?.length > 0) {
      let totalSize = 0;
      for (const att of attachments) {
        if (att.data) {
          const rawSize = Math.ceil((att.data.length * 3) / 4);
          if (rawSize > MAX_ATTACHMENT_SIZE) {
            return NextResponse.json({ error: 'File too large: ' + (att.name || 'unknown') + '. Max 5MB per file.' }, { status: 413, headers: getCorsHeaders(request.headers.get("origin")) });
          }
          totalSize += rawSize;
        }
      }
      if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
        return NextResponse.json({ error: 'Total attachment size exceeds 15MB limit.' }, { status: 413, headers: getCorsHeaders(request.headers.get("origin")) });
      }

      const ctxParts: string[] = [];
      const indexableTypes = ["text/plain", "text/markdown", "text/csv", "text/tab-separated-values", "application/json", "application/xml", "text/xml", "text/yaml", "application/x-yaml"];
      for (const att of attachments) {
        if (indexableTypes.includes(att.type) && att.data) {
          try {
            const b64 = att.data.includes(",") ? att.data.split(",")[1] : att.data;
            const text = Buffer.from(b64, "base64").toString("utf-8");
            ctxParts.push("[File: " + att.name + "]\n" + text.substring(0, 5000));
            pendingUploads.push({ name: att.name, text });
          } catch {
            ctxParts.push("[File: " + att.name + " (text file)]");
          }
        } else if (att.type === "text/plain" && att.data) {
          try {
            const b64 = att.data.includes(",") ? att.data.split(",")[1] : att.data;
            const text = Buffer.from(b64, "base64").toString("utf-8");
            ctxParts.push("[File: " + att.name + "]\n" + text.substring(0, 5000));
          } catch {
            ctxParts.push("[File: " + att.name + " (text file)]");
          }
        } else if (att.type?.startsWith("image/")) {
          ctxParts.push("[Image: " + att.name + "]");
        } else if (att.type === "application/pdf" && att.data) {
          const pdfText = extractPdfText(att.data);
          if (pdfText) {
            ctxParts.push("[File: " + att.name + " (PDF)]\n" + pdfText);
          } else {
            ctxParts.push("[File: " + att.name + " (PDF attached — text could not be extracted)]");
          }
        } else if ((att.type?.includes("officedocument") || att.type?.includes("msword") || att.type?.includes("application/vnd.openxmlformats-officedocument")) && att.data) {
          ctxParts.push("[File: " + att.name + " (document)]");
        } else if (att.data && att.type) {
          ctxParts.push("[File: " + att.name + " (" + att.type + ")]");
        } else if (att.data) {
          ctxParts.push("[File: " + att.name + "]");
        }
      }
      if (ctxParts.length > 0) {
        message = "[Attached files]\n" + ctxParts.join("\n\n") + "\n\n" + (message || "");
      }
    }

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing message or sessionId" }, { status: 400, headers: getCorsHeaders(request.headers.get("origin")) });
    }

    const authToken = getBearerToken(request);
    const sessionClaims = verifyWidgetSessionToken(authToken);
    const reqOrigin = request.headers.get("origin") || "";

    let store = null;
    if (sessionClaims) {
      if (sessionClaims.origin && reqOrigin && sessionClaims.origin !== reqOrigin) {
        return NextResponse.json(
          { error: "Origin mismatch" },
          { status: 403, headers: getCorsHeaders(reqOrigin) },
        );
      }
      store = await prisma.store.findFirst({
        where: { id: sessionClaims.tenant, status: "active" },
        include: { embedSettings: true },
      });
    } else if (apiKey) {
      store = await prisma.store.findFirst({
        where: { apiKey, status: "active" },
        include: { embedSettings: true },
      });
    }

    if (!store) {
      return NextResponse.json({ error: "Invalid API key or inactive workspace" }, { status: 401, headers: getCorsHeaders(request.headers.get("origin")) });
    }

    storeIdForErrors = store.id;

    if (!checkRateLimit(`chat:${store.id}`, 40, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly.", reply: "Chat is busy right now. Please try again shortly." },
        { status: 429, headers: getCorsHeaders(request.headers.get("origin")) },
      );
    }

    if (!checkRateLimit(`chat-session:${sessionId}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many messages in this session.", reply: "You're sending messages too quickly. Please wait a moment." },
        { status: 429, headers: getCorsHeaders(request.headers.get("origin")) },
      );
    }

    if (pendingUploads.length > 0) {
      import("@/lib/rag").then(({ indexWidgetUpload }) =>
        Promise.all(
          pendingUploads.map(u =>
            indexWidgetUpload(store.id, u.name, u.text)
              .then(n => console.log("[RAG] Widget upload indexed " + n + " chunks (" + u.name + ")"))
              .catch(e => console.warn("[RAG] Upload index failed:", e))
          )
        )
      );
    }

    // Conversation management
    let conversation = await prisma.conversation.findUnique({ where: { sessionId } });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { sessionId, storeId: store.id, visitorId: typeof visitorId === "string" ? visitorId.slice(0, 120) : null, messages: "[]", customerName: customerName, customerEmail: customerEmail },
      });
      notifyNewConversation(store.id, customerName || "Anonymous", message).catch(() => {});
    } else if (conversation.storeId !== store.id) {
      return NextResponse.json({ error: "Session belongs to different workspace" }, { status: 403, headers: getCorsHeaders(request.headers.get("origin")) });
    }

    let messages: any[];
    try {
      messages = JSON.parse(conversation.messages || "[]");
    } catch {
      messages = [];
    }

    const userMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
    messages.push(userMessage);

    let assistantReply = "Let me help you with that.";
    let responseProducts: any[] = [];
    let responseActions: ChatAction[] = [];
    let responseCart: { count: number; total: number } | undefined;
    let matchedProducts: Awaited<ReturnType<typeof searchProducts>> = [];
    let intent: Awaited<ReturnType<typeof understandQuery>> = null;
    const sessionMeta = parseSessionMetadata(conversation.metadata);
    let priorContext = sessionMeta.search;
    let flowState: FlowState | null = sessionMeta.flow;
    let followUpType = detectFollowUp(message, priorContext);
    let isFollowUp = followUpType !== null && priorContext !== null;
    let metadataUpdate: string | undefined;
    let skipLlm = false;
    let llmTokens = 0;
    let offerHandoff = false;

    if (openai) {
      try {
        // Conversation continuity — reuse prior search context for follow-ups
        const freshMeta = parseSessionMetadata(conversation.metadata);
        priorContext = freshMeta.search;
        flowState = freshMeta.flow;
        followUpType = detectFollowUp(message, priorContext);
        isFollowUp = followUpType !== null && priorContext !== null;

        // Step 1: Parallel — intent, page product, catalog (fast intent skips LLM for most queries)
        const queryForIntent = isFollowUp && priorContext
          ? buildEnrichedQuery(message, priorContext, followUpType)
          : message;

        const [resolvedIntent, pageProduct, allProducts] = await Promise.all([
          understandQuery(queryForIntent),
          resolvePageProduct(store.id, pageUrl),
          getStoreCatalog(store.id),
        ]);
        intent = resolvedIntent;
        const isPageQuery = pageProduct && isPageProductQuery(message) && !isFollowUp;

        const isShoppingIntent =
          isFollowUp ||
          intent?.intent === "product_search" ||
          intent?.intent === "gift_shopping" ||
          (intent?.priceMax !== undefined || intent?.priceMin !== undefined) ||
          /under|below|less than|cheaper|products under/i.test(message);

        // Step 2: Search products — follow-ups reuse prior results; new searches run fresh
        matchedProducts = [];
        if (isPageQuery && pageProduct) {
          matchedProducts = [pageProduct];
        } else if (isFollowUp && priorContext) {
          matchedProducts = await resolveFollowUpProducts(store.id, message, followUpType, priorContext);
        } else if (isShoppingIntent) {
          matchedProducts = await searchProducts(store.id, message, intent, store);
        }

        const websiteUrl = resolveStoreWebsiteUrl(store);
        const pageProductEarly = pageProduct;
        const isPageQueryEarly = !!(pageProductEarly && isPageProductQuery(message) && !isFollowUp);

        const actionResult = await processChatActions({
          message,
          products: matchedProducts,
          flow: flowState,
          storeId: store.id,
          websiteUrl,
          customerEmail: customerEmail || conversation.customerEmail,
          isPageProductQuery: isPageQueryEarly,
        });
        if (actionResult.flowUpdate) flowState = actionResult.flowUpdate;
        if (actionResult.customerEmail) customerEmail = actionResult.customerEmail;
        if (actionResult.actions.length) responseActions = actionResult.actions;
        if (actionResult.replyOverride) {
          assistantReply = actionResult.replyOverride;
          skipLlm = true;
        }

        // Persist cart items to database
        const cartAddActions = actionResult.actions.filter(a => a.type === "add_to_cart");
        if (cartAddActions.length > 0) {
          await Promise.all(cartAddActions.map(async (a) => {
            if (a.type !== "add_to_cart") return;
            try {
              await prisma.cartItem.upsert({
                where: { sessionId_productId: { sessionId, productId: a.productId } },
                update: { quantity: { increment: 1 } },
                create: {
                  storeId: store.id,
                  sessionId,
                  productId: a.productId,
                  name: a.name,
                  price: a.price,
                  currency: "SEK",
                  image: a.image || null,
                  url: a.url || null,
                  weight: a.weight || null,
                  quantity: 1,
                },
              });
            } catch (e) {
              console.error("Cart persist error:", e);
            }
          }));
          // Fetch updated cart state
          const cartItems = await prisma.cartItem.findMany({ where: { sessionId } });
          const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
          const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
          responseCart = { count: cartCount, total: cartTotal };
        }

        // Step 3: Build context sections
        let crawl: CrawlData | null = null;
        if (store.crawlData) {
          try {
            crawl = JSON.parse(store.crawlData);
          } catch {
            crawl = null;
          }
        }

        const storeInfo = buildStoreInfo(store, crawl, message);
        const escalationGuidance = buildEscalationGuidance(
          store.escalationRules,
          intent?.intent,
          message,
        );

        // Intent-specific handling instructions
        let intentInstructions = "";
        if (isFollowUp && priorContext && followUpType) {
          intentInstructions = buildFollowUpIntentInstructions(
            followUpType,
            priorContext.topic,
            matchedProducts.map((p) => p.name),
          );
        } else if (intent?.intent === "greeting") {
          intentInstructions = "The customer is greeting you. Respond warmly in 1-2 sentences and ask how you can help. Do not suggest products.";
        } else if (isPageQuery && pageProduct) {
          intentInstructions = `The customer is asking about the product they are currently viewing: "${pageProduct.name}". Describe THIS product only using the page product details provided. Do not mention other products unless they ask for alternatives.`;
        } else if (isStoreOverviewQuery(message)) {
          intentInstructions = `The customer is asking what the store sells. Give a brief overview of the store and its main product categories from the catalog below, naming 1-2 example products per category with prices. Keep it concise (3-5 sentences) and only mention products that exist in the catalog. Answer directly from the provided catalog and store information — you have no tools and must NOT emit function calls or tool syntax.`;
        } else if (intent?.intent === "product_search") {
          const salesHint = store.salesRules?.trim()
            ? " When recommending a purchase, mention relevant merchant sales rules (e.g. free shipping thresholds) if they apply."
            : "";
          intentInstructions = `The customer wants to find products. They said: "${message}". Implied meaning: "${intent?.impliedMeaning || message}". Recommend the most relevant products with prices. If nothing directly matches, suggest the closest category alternatives from the catalog. Never recommend unrelated products. If they asked for a specific variant (e.g. gaming laptop) and you only have a generic version without that feature, say you don't carry that specific type.${salesHint}`;
        } else if (intent?.intent === "gift_shopping") {
          intentInstructions = `The customer is gift shopping for ${intent.giftFor || "someone"}${intent.giftOccasion ? " (" + intent.giftOccasion + ")" : ""}. Do NOT recommend products immediately. First ask 1-2 questions about their interests. Then suggest products.`;
        } else if (intent?.intent === "faq") {
          intentInstructions = `The customer has an informational question: "${message}". The answer is in the STORE INFORMATION and Website Knowledge sections below — read them and answer directly from what they say. NEVER tell the customer to check the website, knowledge base, or contact support themselves; quote or paraphrase the actual answer from the provided knowledge. No apology needed for neutral policy questions. Do not suggest products unless they ask. If the knowledge section contains no matching answer, say plainly that you don't have that specific information and offer to connect them with the team.`;
        } else if (intent?.intent === "support" || intent?.intent === "complaint") {
          intentInstructions = `The customer needs support or has a complaint: "${message}". Respond empathetically, address their concern from the available information, and follow the escalation guidance below.`;
        }

        // Product context for the prompt
        const productContext = matchedProducts.length > 0
          ? formatProductsForPrompt(matchedProducts)
          : "";

        // Compact catalog — full detail only when shopping without matches
        const needsFullCatalog =
          isShoppingIntent && matchedProducts.length === 0 && intent?.intent !== "greeting";
        const allProductNames = needsFullCatalog
          ? formatCatalogCompact(allProducts)
          : formatCatalogNamesOnly(allProducts);

        // Semantic retrieval from the store's OWN crawled website knowledge (RAG) — never the live internet
        let hasGroundedKnowledge = false;
        try {
          const knowledgeChunks = await retrieveKnowledge(message, store.id, 6);
          knowledgeContext = formatKnowledgeForPrompt(knowledgeChunks);
          hasGroundedKnowledge = (knowledgeChunks || []).some(
            (c) => c.metadata?.kind === "faq" || c.metadata?.kind === "page-summary" || c.metadata?.kind === "doc",
          );
          responseSources = (knowledgeChunks || [])
            .slice(0, 3)
            .map(c => {
              const md = c.metadata || {};
              const raw = String(c.source || "");
              const title = String(md.title || raw.split(":").pop() || "").trim();
              // FAQ-sourced chunks (as opposed to crawled pages) have no page URL of
              // their own — fall back to the merchant's own site so the citation is
              // still a real, clickable link instead of dead unclickable text.
              return { title, url: String(md.url || websiteUrl || "") };
            })
            .filter(s => s.title && s.title.length > 1);
        } catch (e) {
          console.error("Knowledge retrieval failed:", e);
        }

        // Deterministic FAQ answers — when the customer asks an informational
        // question that one of the merchant's FAQs covers, answer directly from
        // the stored FAQ text: fast, accurate, zero tokens. The LLM is only a
        // fallback for questions the FAQs don't already answer.
        let faqDirectAnswer: string | null = null;
        if (intent?.intent === "faq" && crawl?.faqs?.length) {
          const msgWords = message.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          if (msgWords.length > 0) {
            let best: { faq: { question: string; answer: string }; score: number } | null = null;
            for (const faq of crawl.faqs) {
              const q = faq.question.toLowerCase();
              const hits = msgWords.filter((w) => q.includes(w)).length;
              const overlap = hits / msgWords.length;
              if (overlap >= 0.5 && (!best || overlap > best.score)) {
                best = { faq, score: overlap };
              }
            }
            if (best) {
              faqDirectAnswer = best.faq.answer;
              assistantReply = best.faq.answer;
              skipLlm = true;
              if (!responseSources.some((s) => s.title === best!.faq.question)) {
                responseSources = [
                  { title: best.faq.question, url: websiteUrl || "" },
                  ...responseSources,
                ];
              }
            }
          }
        }

        // Build system prompt
        const systemPrompt = buildSystemPrompt({
          store,
          intentInstructions: intentInstructions || "Respond helpfully based on the context.",
          productContext,
          storeInfo,
          pageType,
          pageUrl,
          pageProduct,
          escalationGuidance,
        });

        const dataSection = `
## Full Product Catalog (for reference, do NOT invent products outside this list)
${allProductNames}
## Website Knowledge (retrieved from the merchant's own crawled website — your ONLY source for factual answers)
${knowledgeContext || "No matching website knowledge found for this query."}`;

        const langSection = `
## LANGUAGE REQUIREMENT
${userLangRule}
- The customer's message may be in any European language. Always mirror it.
- Tool calls and internal reasoning may stay in English; the reply text you send back to the customer must be in the customer's language.
- If you are not sure of the language, use the customer's own words as a guide.`;

        const fullPrompt = systemPrompt + langSection + dataSection;

        // Shared product-card formatting (name/price+currency/url/image/description),
        // used for both the direct-search pipeline's matches and the agent's own
        // search_products results (which may include isComplementary-tagged items).
        const formatProductsForCards = (products: any[]) =>
          products.slice(0, 3).map((p) => {
            let desc = p.description || '';
            if (!desc || desc.length < 20 || desc.includes('Shop conscious') || desc.includes('eco-friendly products that make a difference')) {
              const cat = p.category || '';
              if (p.name && cat) desc = 'A ' + cat.toLowerCase().replace(/_/g, ' ') + ' product: ' + p.name;
              else if (p.name) desc = p.name + ' - available now';
              else desc = 'Available product';
            }
            return {
              name: p.name,
              price: p.price ? String(p.price) + ' ' + (p.currency || '') : null,
              url: p.url,
              image: p.image,
              description: desc,
              ...(p.isComplementary ? { isComplementary: true } : {}),
            };
          });

        // Direct catalog searches already have grounded matches at this point.
        // Return them immediately instead of running a multi-turn tool-calling
        // agent over the same catalog, which can add close to a minute of latency.
        if (
          !skipLlm &&
          !isFollowUp &&
          !isPageQuery &&
          intent?.intent === "product_search" &&
          matchedProducts.length > 0
        ) {
          const matchCount = matchedProducts.length;
          assistantReply =
            matchCount === 1
              ? (LOCALIZED_FALLBACKS[userLang]?.foundOne || "I found a product that matches your search — take a look below.")
              : (LOCALIZED_FALLBACKS[userLang]?.foundMany || "I found {count} products that match your search — here are the best options.").replace("{count}", String(matchCount));
          responseProducts = formatProductsForCards(matchedProducts);
          skipLlm = true;
        }

        // ─── Agent Engine Integration ─────────────────────────────────────────
        // The agent runs tool-calling round trips — pointless (and slow) for
        // informational FAQ/greeting queries, which the pipeline answers
        // directly from knowledge with a single grounded completion.
        let agentUsed = false;
        const agentEligible = intent?.intent !== "faq" && intent?.intent !== "greeting";
        if (!skipLlm && agentEligible) {
          try {
            const agentResult = await runAgent(message, {
              store,
              conversation,
              messages: messages.slice(0, -1),
              userId: store.id,
              storeId: store.id,
              catalog: allProducts,
              crawlData: crawl || undefined,
            });
            if (agentResult.reply && !agentResult.reply.startsWith("I'm sorry, I couldn't process")) {
              assistantReply = agentResult.reply;
              responseProducts = formatProductsForCards(agentResult.products || []);
              responseActions = [...responseActions, ...agentResult.actions.filter(a => a.type)];
              agentUsed = true;
              skipLlm = true;
            }
          } catch (e) {
            console.warn("Agent failed, falling back to pipeline:", e);
          }
        }

        let contextHint = "";
        // Build API messages
        const apiMessages: any[] = [
          { role: "system", content: fullPrompt + contextHint },
          ...messages.slice(-4).map((m: any) => ({
            role: normalizeRole(m.role),
            content: typeof m.content === "string" ? m.content : "",
          })),
        ];

        // Prepare product cards early (available for both stream + JSON paths)
        const productsForContext = [...matchedProducts];
        // Only hide product cards when the search is overly broad (not specific noun queries)
        const hasSpecificNoun = /\b(bag|tote|lamp|dress|shirt|jacket|shoe|bracelet|bottle|mug|yoga|gadget|laptop)\b/i.test(message);
        if (!hasSpecificNoun && matchedProducts.length >= allProducts.length * 0.9) {
          matchedProducts = [];
        }
        const productsToReturn = matchedProducts.slice(0, 3);
        // Fall back to the direct-search pipeline's matches whenever the agent
        // didn't already produce its own products — this covers both "agent
        // never ran" and the common case where the agent replied but its own
        // search_products tool call didn't yield results (LLM tool-calling is
        // unreliable here; the direct pipeline below doesn't depend on it).
        // Previously this ran unconditionally and silently discarded whatever
        // the agent set above, since `agentUsed` was otherwise never read;
        // gating on agentUsed alone then went too far the other way, hiding
        // cards whenever the agent replied with zero products of its own.
        if (!agentUsed || responseProducts.length === 0) {
          responseProducts = formatProductsForCards(productsToReturn);
        }

        // Auto-escalate for support/complaint intents or explicit human request
        const wantsHuman =
          /human|agent|person|representative|speak to someone|talk to someone|real person|manager/i.test(
            message,
          );
        if (intent?.intent === "support" || intent?.intent === "complaint" || wantsHuman) {
          offerHandoff = true;
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { escalated: true, sentiment: intent?.intent === "complaint" ? "negative" : "neutral" },
          });
          notifyEscalation(store.id, conversation.customerName, intent?.intent === "support" ? "Support request" : intent?.intent === "complaint" ? "Complaint" : "Customer requested human agent").catch(() => {});
        }

        // Persist conversation context + action flow state
        let searchCtx = priorContext;
        if (productsForContext.length > 0) {
          const followUp = detectFollowUp(message, priorContext);
          const preserve = shouldPreserveContext(intent?.intent, followUp !== null);
          if (preserve) {
            const newCtx = buildConversationContext(
              message,
              productsForContext,
              intent?.intent || "product_search",
              isFollowUp && priorContext ? priorContext.topic : intent?.impliedMeaning,
              priorContext,
            );
            if (isFollowUp && priorContext) {
              newCtx.productIds = priorContext.productIds;
              newCtx.topic = priorContext.topic;
              newCtx.searchQuery = priorContext.searchQuery;
              newCtx.nouns = priorContext.nouns;
              newCtx.category = priorContext.category || newCtx.category;
            }
            searchCtx = newCtx;
          }
        } else if (intent?.intent === "faq" && priorContext) {
          searchCtx = priorContext;
        }

        if (searchCtx || flowState) {
          metadataUpdate = serializeSessionMetadata({ search: searchCtx, flow: flowState });
        }

        const applyPostProcess = (reply: string): string => {
          let out = stripPseudoFunctionCalls(reply) || "Let me know how I can help you today!";
          // Template self-correction — only for shopping queries with no matches (skip discount/FAQ).
          // Not gated to intent === "product_search" — vague browse-style queries ("what's
          // popular", "what do you have") are just as often classified as other shopping
          // intents, and isShoppingIntent below already scopes this to shopping queries only.
          const isProductDenial = !/\b(discount|promo|coupon|voucher|%\s*off)\b/i.test(message);
          // Never clobber an answer grounded in the store's own knowledge —
          // if FAQ/page/doc chunks were retrieved, the reply is answering from
          // real content and must stand (e.g. "how do eco tokens work" must not
          // become a category list even though it matches no products).
          if (
            out &&
            !hasGroundedKnowledge &&
            allProducts.length > 0 &&
            matchedProducts.length === 0 &&
            isShoppingIntent &&
            isProductDenial &&
            !isStoreOverviewQuery(message)
          ) {
            // Replace unconditionally rather than pattern-matching the model's wording for
            // "nothing found" — the model phrases a zero-match result differently almost
            // every time (denials, offers to search, invented-sounding specifics), and
            // matching against that free text is a losing game of whack-a-mole. Since we
            // already know zero real products matched, any text here is either an
            // (unhelpfully vague) admission of that or ungrounded — replacing it with the
            // real category list is strictly more accurate and useful either way.
            const groups: Record<string, typeof allProducts> = {};
            for (const p of allProducts) {
              const cat = p.category || "Other";
              if (!groups[cat]) groups[cat] = [];
              groups[cat].push(p);
            }
            const topEntries = Object.entries(groups).slice(0, 3);
            const topCats = topEntries
              .map(([cat, products]) => `${cat} (${products.slice(0, 2).map((p) => p.name).join(", ")})`)
              .join("; ");
            if (topCats) {
              out =
                (LOCALIZED_FALLBACKS[userLang]?.noExactMatch ||
                  `We couldn't find an exact match, but here's what's available: ${topCats}. ` +
                  `Would you like me to compare options, check policies, or narrow this down to your budget and use case?`);
              if (LOCALIZED_FALLBACKS[userLang]?.noExactMatch) {
                out = (LOCALIZED_FALLBACKS[userLang].noExactMatch as string)
                  .replace("{topCats}", topCats)
                  .replace("{count}", String(allProducts.length));
              }
              // Give the suggested items real cards too, not just names in the text —
              // otherwise the user has nothing clickable to act on.
              const suggestionProducts = topEntries.flatMap(([, products]) => products.slice(0, 2));
              responseProducts = formatProductsForCards(suggestionProducts);
            }
          }
          // Inject merchant sales rules when recommending a purchase (skip if agent handled it)
          if (
            store.salesRules &&
            /500|free shipping/i.test(store.salesRules) &&
            /recommend|want to buy|what do you recommend/i.test(message) &&
            matchedProducts.length > 0 &&
            !/500|free shipping/i.test(out)
          ) {
            out += " " + (LOCALIZED_FALLBACKS[userLang]?.freeShipping || "Orders over 500 SEK qualify for free shipping.");
          }
          return out;
        };

        const trackUnanswered = async (reply: string) => {
          if (
            reply &&
            (reply.indexOf("don't carry") !== -1 ||
              reply.indexOf("don't have") !== -1 ||
              reply.indexOf("not something we have") !== -1 ||
              reply.toLowerCase().indexOf("we don't") !== -1)
          ) {
            try {
              let unansweredCrawl: any = {};
              if (store.crawlData) {
                try {
                  unansweredCrawl = JSON.parse(store.crawlData);
                } catch {
                  unansweredCrawl = {};
                }
              }
              if (!unansweredCrawl.unanswered) unansweredCrawl.unanswered = [];
              unansweredCrawl.unanswered.push({
                question: message,
                reply: reply.substring(0, 200),
                timestamp: new Date().toISOString(),
              });
              if (unansweredCrawl.unanswered.length > 100) {
                unansweredCrawl.unanswered = unansweredCrawl.unanswered.slice(-100);
              }
              await prisma.store.update({
                where: { id: store.id },
                data: { crawlData: JSON.stringify(unansweredCrawl) },
              });
            } catch (e) {}
          }
        };

        const replyModel = process.env.REPLY_MODEL || process.env.LLM_MODEL || "anthropic/claude-opus-5";
        const freeReplyModel = process.env.FREE_REPLY_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
        const fallbackModels = [replyModel, freeReplyModel, GEMINI_MODEL_ENV];

        // --- SSE streaming path ---
        if (useStream && !skipLlm) {
          const encoder = new TextEncoder();
          const streamStoreId = store.id;
          const streamConversationId = conversation.id;
          const streamSessionId = sessionId;
          const streamMessages = messages;
          const streamActions = responseActions;
          const streamOfferHandoff = offerHandoff;
          const streamCustomerName = customerName || conversation.customerName;
          const streamCustomerEmail = customerEmail || conversation.customerEmail;
          const streamMetadata = metadataUpdate;

          const readable = new ReadableStream({
            async start(controller) {
              const send = (payload: Parameters<typeof sseEncode>[0]) => {
                controller.enqueue(encoder.encode(sseEncode(payload)));
              };
              try {
                send({ type: "start", conversationState: buildConversationState(intent, isFollowUp, 0) });
                let full = "";
                let usedFallback = false;
                let stream: AsyncIterable<any>;
                let lastErr: unknown;
                for (const model of fallbackModels) {
                  try {
                    stream = await chatCompletionStream(clientForModel(model)!, {
                      model,
                      messages: apiMessages,
                      temperature: 0.3,
                      max_tokens: 900,
                    });
                    if (model !== replyModel) {
                      usedFallback = true;
                      console.warn("Chat fallback to model:", model);
                    }
                    break;
                  } catch (e: any) {
                    lastErr = e;
                    const code = e?.status ?? e?.statusCode ?? 0;
                    const isRetryable = code === 402 || code === 429 || /402|429|rate.limit|insufficient/i.test(String(e?.message || ""));
                    if (!isRetryable) throw e;
                    console.warn("Chat model", model, "failed, trying next:", e?.message || e);
                  }
                }
                if (!stream) throw lastErr ?? new Error("All models failed");

                for await (const chunk of stream) {
                  const delta = chunk.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    full += delta;
                    send({ type: "token", text: delta });
                  }
                  if (chunk.usage?.total_tokens) {
                    llmTokens = chunk.usage.total_tokens;
                  }
                }

                const original = full;
                // applyPostProcess can reassign the outer `responseProducts` (e.g. the
                // zero-match category-suggestion fallback) — read it fresh below rather
                // than from a snapshot taken before this ran.
                assistantReply = applyPostProcess(full);
                if (assistantReply !== original) {
                  send({ type: "replace", text: assistantReply });
                }

                await trackUnanswered(assistantReply);

                const assistantMessage = {
                  role: "bot",
                  content: assistantReply,
                  timestamp: new Date().toISOString(),
                };
                streamMessages.push(assistantMessage);

                await prisma.conversation.update({
                  where: { id: streamConversationId },
                  data: {
                    messages: JSON.stringify(streamMessages),
                    updatedAt: new Date(),
                    customerName: streamCustomerName,
                    customerEmail: streamCustomerEmail,
                    ...(streamMetadata !== undefined ? { metadata: streamMetadata } : {}),
                  },
                });

                const latencyMs = Date.now() - startedAt;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const existingLog = await prisma.usageLog.findUnique({
                  where: { storeId_date: { storeId: streamStoreId, date: today } },
                });
                const prevCount = existingLog?.messagesCount || 0;
                const prevAvg = existingLog?.avgLatencyMs || 0;
                const nextAvg =
                  prevCount === 0 ? latencyMs : (prevAvg * prevCount + latencyMs) / (prevCount + 1);

                await prisma.usageLog.upsert({
                  where: { storeId_date: { storeId: streamStoreId, date: today } },
                  update: {
                    messagesCount: { increment: 1 },
                    avgLatencyMs: nextAvg,
                    llmTokens: { increment: llmTokens },
                  },
                  create: {
                    storeId: streamStoreId,
                    date: today,
                    messagesCount: 1,
                    avgLatencyMs: latencyMs,
                    llmTokens,
                  },
                });

                trackWidgetEvent(streamStoreId, "message_received", streamSessionId, {
                  latencyMs,
                  llmTokens,
                  hasProducts: responseProducts.length > 0,
                  streamed: true,
                }).catch(() => {});

                // Check for keyword-triggered flows
                let flowMessages: string[] = [];
                try {
                  const flowResult = await checkChatMessageForFlows(store.id, message, sessionId);
                  if (flowResult?.messages.length) {
                    flowMessages = flowResult.messages.filter(m => !m.startsWith("__WAIT__"));
                  }
                } catch (e) {}

                send({
                  type: "done",
                  reply: assistantReply,
                  products: responseProducts,
                  actions: streamActions,
                  sources: responseSources.length > 0 ? responseSources : undefined,
                  conversationState: buildConversationState(intent, isFollowUp, responseProducts.length),
                  flowMessages: flowMessages.length > 0 ? flowMessages : undefined,
                  conversationId: streamConversationId,
                  offerHandoff: streamOfferHandoff,
                  latencyMs,
                });
              } catch (err) {
                console.error("Stream chat error:", err);
                send({
                  type: "error",
                  message: "Stream failed",
                  reply: "Sorry, I'm having trouble responding right now. Please try again later.",
                });
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              ...getCorsHeaders(request.headers.get("origin")),
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
            },
          });
        }

        // --- Non-stream JSON path ---
        if (!skipLlm) {
          let completion;
          let lastErr: unknown;
          for (const model of fallbackModels) {
            try {
              completion = await chatCompletionWithRetry(clientForModel(model)!, {
                model,
                messages: apiMessages,
                temperature: 0.3,
                max_tokens: 900,
              }, 2);
              if (model !== replyModel) {
                console.warn("Chat fallback to model:", model);
              }
              break;
            } catch (e: any) {
              lastErr = e;
              const code = e?.status ?? e?.statusCode ?? 0;
              const isRetryable = code === 402 || code === 429 || /402|429|rate.limit|insufficient/i.test(String(e?.message || ""));
              if (!isRetryable) throw e;
              console.warn("Chat model", model, "failed, trying next:", e?.message || e);
            }
          }
          if (!completion) throw lastErr ?? new Error("All models failed");

          const replyMessage = completion.choices[0]?.message;
          assistantReply = applyPostProcess(
            replyMessage?.content || "Let me know how I can help you today!",
          );
          llmTokens = completion.usage?.total_tokens || 0;
        } else {
          assistantReply = applyPostProcess(assistantReply);
        }

        await trackUnanswered(assistantReply);
      } catch (err) {
        console.error("Chat error:", err);
        assistantReply = "Sorry, I'm having trouble responding right now. Please try again later.";
      }
    }

    // Save conversation
    const assistantMessage = { role: "bot", content: assistantReply, timestamp: new Date().toISOString() };
    messages.push(assistantMessage);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messages: JSON.stringify(messages),
        updatedAt: new Date(),
        customerName: customerName || conversation.customerName,
        customerEmail: customerEmail || conversation.customerEmail,
        ...(metadataUpdate !== undefined ? { metadata: metadataUpdate } : {}),
      },
    });

    // Usage tracking with latency + tokens
    const latencyMs = Date.now() - startedAt;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await prisma.usageLog.findUnique({
      where: { storeId_date: { storeId: store.id, date: today } },
    });
    const prevCount = existingLog?.messagesCount || 0;
    const prevAvg = existingLog?.avgLatencyMs || 0;
    const nextCount = prevCount + 1;
    const nextAvg = prevCount === 0 ? latencyMs : (prevAvg * prevCount + latencyMs) / nextCount;

    await prisma.usageLog.upsert({
      where: { storeId_date: { storeId: store.id, date: today } },
      update: {
        messagesCount: { increment: 1 },
        avgLatencyMs: nextAvg,
        llmTokens: { increment: llmTokens },
      },
      create: {
        storeId: store.id,
        date: today,
        messagesCount: 1,
        avgLatencyMs: latencyMs,
        llmTokens,
      },
    });

    trackWidgetEvent(store.id, "message_received", sessionId, {
      latencyMs,
      llmTokens,
      hasProducts: responseProducts.length > 0,
    }).catch(() => {});

    // Check for keyword-triggered flows
    let flowMessages: string[] = [];
    try {
      const flowResult = await checkChatMessageForFlows(store.id, message, sessionId);
      if (flowResult?.messages.length) {
        flowMessages = flowResult.messages.filter(m => !m.startsWith("__WAIT__"));
      }
    } catch {}

    return NextResponse.json({
      success: true,
      reply: assistantReply,
      flowMessages: flowMessages.length > 0 ? flowMessages : undefined,
      products: responseProducts,
      actions: responseActions,
      cart: responseCart,
      sources: responseSources.length > 0 ? responseSources : undefined,
      conversationState: buildConversationState(intent, isFollowUp, responseProducts.length),
      conversationId: conversation.id,
      offerHandoff,
      latencyMs,
    }, { headers: getCorsHeaders(request.headers.get("origin")) });

  } catch (error: any) {
    console.error("Chat API error:", error);
    if (storeIdForErrors) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await prisma.usageLog.upsert({
          where: { storeId_date: { storeId: storeIdForErrors, date: today } },
          update: { errorCount: { increment: 1 } },
          create: { storeId: storeIdForErrors, date: today, messagesCount: 0, errorCount: 1 },
        });
      } catch {}
    }
    return NextResponse.json({ 
      error: "Something went wrong", 
      reply: "Sorry, I couldn't process your message right now." 
    }, { status: 500, headers: getCorsHeaders(request.headers.get("origin")) });
  }
}
