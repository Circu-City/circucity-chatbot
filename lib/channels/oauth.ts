import { getChannelConfigFromDb, META_GRAPH_URL, META_API_VERSION, ChannelCredentials, isConfiguredAsync } from "./types";

export { isConfiguredAsync as isConfigured };

export async function getWebhookVerifyToken(): Promise<string> {
  const cfg = await getChannelConfigFromDb();
  return cfg.webhookVerifyToken;
}

export async function getOAuthUrl(platform: string, storeId: string): Promise<string> {
  const cfg = await getChannelConfigFromDb();
  const scopes: Record<string, string> = {
    whatsapp: "whatsapp_business_messaging business_management",
    messenger: "pages_manage_metadata pages_messaging pages_read_engagement pages_show_list",
    instagram: "pages_manage_metadata pages_messaging pages_read_engagement pages_show_list",
  };

  const params = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: cfg.redirectUri,
    state: JSON.stringify({ platform, storeId }),
    scope: scopes[platform] || "business_management",
    response_type: "code",
  });

  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<ChannelCredentials> {
  const cfg = await getChannelConfigFromDb();
  const tokenRes = await fetch(`${META_GRAPH_URL}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      redirect_uri: cfg.redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokenData: { access_token: string; token_type: string; expires_in: number } = await tokenRes.json();

  const longRes = await fetch(`${META_GRAPH_URL}/oauth/access_token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      fb_exchange_token: tokenData.access_token,
    }),
  });

  if (!longRes.ok) {
    const err = await longRes.text();
    throw new Error(`Long-lived token exchange failed: ${err}`);
  }

  const longData: { access_token: string; token_type: string; expires_in: number } = await longRes.json();
  const expiresAt = new Date(Date.now() + longData.expires_in * 1000).toISOString();

  return { accessToken: longData.access_token, tokenExpiresAt: expiresAt };
}

