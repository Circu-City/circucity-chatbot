import type { ConversationContext } from "@/lib/conversation-context";

export type FlowState = {
  pendingFlow?: "stock_email" | "shipping_pick" | null;
  selectedCarrier?: "postnord" | "shipmondo";
  marketplaceProductId?: string;
  productName?: string;
  shippingRates?: { postnord: number; shipmondo: number; weightKg: number };
};

export type SessionMetadata = {
  search: ConversationContext | null;
  flow: FlowState | null;
};

export function parseSessionMetadata(raw: string | null | undefined): SessionMetadata {
  if (!raw) return { search: null, flow: null };
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.topic && parsed?.productIds) {
      return { search: parsed as ConversationContext, flow: null };
    }
    return {
      search: parsed?.search || null,
      flow: parsed?.flow || null,
    };
  } catch {
    return { search: null, flow: null };
  }
}

export function serializeSessionMetadata(meta: SessionMetadata): string {
  if (!meta.search && !meta.flow) return "";
  if (meta.search && !meta.flow) return JSON.stringify(meta.search);
  return JSON.stringify(meta);
}