import OpenAI from "openai";
import { detectFastIntent } from "@/lib/fast-intent";
import { chatCompletionWithRetry } from "@/lib/llm";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    })
  : null;

export interface QueryIntent {
  intent: "greeting" | "product_search" | "gift_shopping" | "faq" | "support" | "complaint" | "unknown";
  category?: string;
  priceMin?: number;
  priceMax?: number;
  keywords: string[];
  impliedMeaning: string;
  giftFor?: string;
  giftOccasion?: string;
}

const SYSTEM_PROMPT = [
  "You are a query understanding system for an e-commerce chatbot.",
  "Analyze the customer message and extract structured intent.",
  "Respond with ONLY valid JSON, no other text.",
  "",
  "Return this JSON structure:",
  '{ "intent": "product_search" | "gift_shopping" | "faq" | "support" | "complaint" | "greeting" | "unknown",',
  '  "category": string or null,',
  '  "priceMin": number or null,',
  '  "priceMax": number or null,',
  '  "keywords": string[],',
  '  "impliedMeaning": string,',
  '  "giftFor": string or null,',
  '  "giftOccasion": string or null',
  "}",
  "",
  "Examples:",
  '- "I need something for my hair" -> intent:product_search, keywords:["hair","hair care","hair products"], impliedMeaning:"looking for hair care products"',
  "- \"I need a gift for my mom's birthday\" -> intent:gift_shopping, giftFor:\"mom\", giftOccasion:\"birthday\"",
  '- "show me products under 50 dollars" -> intent:product_search, priceMax:50',
  '- "do you have eco-friendly bags" -> intent:product_search, keywords:["eco-friendly","bags","sustainable bags"]',
  '- "return policy" -> intent:faq',
  '- "I want a refund" -> intent:support',
  "Always expand keywords with related terms and synonyms.",
  "Set category to the product category if mentioned, otherwise null.",
  "Set priceMin/priceMax only if the customer specifies a price range.",
].join("\n");

export async function understandQuery(
  message: string,
): Promise<QueryIntent | null> {
  const fast = detectFastIntent(message);
  if (fast) return fast;

  if (!openai) return null;

  try {
    const completion = await chatCompletionWithRetry(openai, {
      model: process.env.QUERY_MODEL || "qwen/qwen3.6-27b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }, 2);

    const text = completion.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as QueryIntent;
  } catch (err) {
    console.error("Query understanding error:", err);
    return null;
  }
}
