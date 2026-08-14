export interface OAuthPlatform {
  id: string;
  name: string;
  category: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  redirectUriSuffix?: string;
  extraParams?: Record<string, string>;
  tokenBodyParams?: Record<string, string>;
  tokenTransform?: (data: any) => ChannelCredentials;
}

export interface ChannelCredentials {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scope?: string;
  [key: string]: any;
}

export function getConfig() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";
  return {
    redirectUri: `${appUrl}/api/integrations/oauth/callback`,
    appUrl,
  };
}

export function getEnv(key: string): string {
  return process.env[key] || "";
}

export const PLATFORMS: Record<string, OAuthPlatform> = {
  gmail: {
    id: "gmail",
    name: "Gmail",
    category: "email",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send",
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    extraParams: { access_type: "offline", prompt: "consent" },
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
      scope: data.scope,
    }),
  },
  google_analytics: {
    id: "google_analytics",
    name: "Google Analytics",
    category: "analytics",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/analytics.readonly",
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    extraParams: { access_type: "offline", prompt: "consent" },
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
      scope: data.scope,
    }),
  },
  shopify: {
    id: "shopify",
    name: "Shopify",
    category: "ecommerce",
    authUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
    tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token",
    scopes: "read_products,write_products,read_inventory,read_orders,read_customers,read_legal_policies",
    clientIdEnv: "SHOPIFY_OAUTH_CLIENT_ID",
    clientSecretEnv: "SHOPIFY_OAUTH_CLIENT_SECRET",
    redirectUriSuffix: "",
    tokenBodyParams: { expiring: "1" },
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
      scope: data.scope,
    }),
  },
  ebay: {
    id: "ebay",
    name: "eBay",
    category: "marketplace",
    authUrl: "https://auth.ebay.com/oauth2/authorize",
    tokenUrl: "https://api.ebay.com/identity/v1/oauth2/token",
    scopes: "https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
    clientIdEnv: "EBAY_OAUTH_APP_ID",
    clientSecretEnv: "EBAY_OAUTH_CERT_ID",
    extraParams: { prompt: "login" },
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
      scope: data.scope,
    }),
  },
  stripe: {
    id: "stripe",
    name: "Stripe",
    category: "ecommerce",
    authUrl: "https://connect.stripe.com/oauth/authorize",
    tokenUrl: "https://connect.stripe.com/oauth/token",
    scopes: "read_write",
    clientIdEnv: "STRIPE_CLIENT_ID",
    clientSecretEnv: "STRIPE_SECRET_KEY",
    extraParams: { stripe_landing: "login" },
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      stripeUserId: data.stripe_user_id,
      stripePublishableKey: data.stripe_publishable_key,
    }),
  },
  google_calendar: {
    id: "google_calendar",
    name: "Google Calendar",
    category: "meetings",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/calendar.events",
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    extraParams: { access_type: "offline", prompt: "consent" },
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
    }),
  },
  slack: {
    id: "slack",
    name: "Slack",
    category: "workflow",
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: "chat:write,channels:read,channels:history",
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      scope: data.scope,
      teamName: data.team?.name,
      teamId: data.team?.id,
      incomingWebhook: data.incoming_webhook?.url,
    }),
  },
  zoom: {
    id: "zoom",
    name: "Zoom",
    category: "meetings",
    authUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: "meeting:write meeting:read user:read",
    clientIdEnv: "ZOOM_OAUTH_CLIENT_ID",
    clientSecretEnv: "ZOOM_OAUTH_CLIENT_SECRET",
    tokenTransform: (data: any) => ({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
    }),
  },
};

export function isPlatformConfigured(platformId: string, dbCredentials?: { clientId: string; clientSecret: string } | null): boolean {
  const platform = PLATFORMS[platformId];
  if (!platform) return false;
  if (!!(getEnv(platform.clientIdEnv) && getEnv(platform.clientSecretEnv))) return true;
  if (dbCredentials?.clientId && dbCredentials?.clientSecret) return true;
  return false;
}

export function getConfiguredPlatforms(): string[] {
  return Object.keys(PLATFORMS).filter(isPlatformConfigured);
}

export function getAuthorizationUrl(platformId: string, storeId: string, shopDomain?: string, dbCredentials?: { clientId: string; clientSecret: string } | null): string {
  const platform = PLATFORMS[platformId];
  if (!platform) throw new Error("Unknown platform: " + platformId);
  const cfg = getConfig();
  let authUrl = platform.authUrl;
  if (shopDomain) {
    const normalized = shopDomain
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .replace(/\.myshopify\.com$/i, "");
    authUrl = authUrl.replace("{shop}", normalized);
  }
    const clientId = dbCredentials?.clientId || getEnv(platform.clientIdEnv);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: cfg.redirectUri + (platform.redirectUriSuffix !== undefined ? platform.redirectUriSuffix : "?platform=" + platformId),
    scope: platform.scopes,
    response_type: "code",
    state: JSON.stringify({ platform: platformId, storeId, shopDomain }),
  });
  if (platform.extraParams) {
    Object.entries(platform.extraParams).forEach(([k, v]) => params.set(k, v));
  }
  return authUrl + "?" + params.toString();
}

export async function exchangeCode(code: string, platformId: string, shopDomain?: string, clientIdOverride?: string, clientSecretOverride?: string): Promise<any> {
  const platform = PLATFORMS[platformId];
  if (!platform) throw new Error("Unknown platform: " + platformId);
  const cfg = getConfig();
  let tokenUrl = platform.tokenUrl;
  if (shopDomain) {
    const normalized = shopDomain
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .replace(/\.myshopify\.com$/i, "");
    tokenUrl = tokenUrl.replace("{shop}", normalized);
  }
  const body = new URLSearchParams({
    client_id: clientIdOverride || getEnv(platform.clientIdEnv),
    client_secret: clientSecretOverride || getEnv(platform.clientSecretEnv),
    redirect_uri: cfg.redirectUri + (platform.redirectUriSuffix !== undefined ? platform.redirectUriSuffix : "?platform=" + platformId),
    code,
    grant_type: "authorization_code",
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    const short = err.replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error("Token exchange failed for " + platformId + ": " + short);
  }
  const data = await res.json();
  if (platform.tokenTransform) {
    return platform.tokenTransform(data);
  }
  return data;
}
