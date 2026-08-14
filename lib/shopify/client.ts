import "@shopify/shopify-api/adapters/node";
import { shopifyApi, Session, ApiVersion } from "@shopify/shopify-api";

const VERSION_KEYS: Record<string, any> = {
  October24: ApiVersion.October24,
  January25: ApiVersion.January25,
  April25: ApiVersion.April25,
  July25: ApiVersion.July25,
  October25: ApiVersion.October25,
  January26: ApiVersion.January26,
  April26: ApiVersion.April26,
  July26: ApiVersion.July26,
};

function getApiVersion(): any {
  const key = process.env.SHOPIFY_API_VERSION || "July26";
  return VERSION_KEYS[key] || ApiVersion.July26;
}

let _shopify: ReturnType<typeof shopifyApi> | null = null;

export function getShopifyApi() {
  if (!_shopify) {
    _shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_OAUTH_CLIENT_ID || "cira",
      apiSecretKey: process.env.SHOPIFY_OAUTH_CLIENT_SECRET || "cira",
      scopes: [
        "read_products",
        "write_products",
        "read_inventory",
        "read_orders",
        "read_customers",
        "read_legal_policies",
      ],
      hostName:
        (process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com").replace(/^https?:\/\//, ""),
      apiVersion: getApiVersion(),
      isEmbeddedApp: false,
      expiringOfflineAccessTokens: true,
    });
  }
  return _shopify;
}

export function getShopifyGraphqlClient(accessToken: string, shopDomain: string) {
  const shopify = getShopifyApi();
  const session = new Session({
    id: "cira-" + shopDomain,
    shop: shopDomain,
    state: "active",
    isOnline: false,
    accessToken,
  });
  return new shopify.clients.Graphql({ session });
}
