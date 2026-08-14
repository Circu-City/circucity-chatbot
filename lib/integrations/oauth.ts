import { OAuthPlatform, PLATFORMS, getConfig, getEnv, ChannelCredentials } from "./registry";

export function getAuthorizationUrl(platformId: string, storeId: string, shopDomain?: string, _dbCredentials?: any, returnTo?: string): string {
  const platform = PLATFORMS[platformId];
  if (!platform) throw new Error(`Unknown platform: ${platformId}`);

  const { redirectUri } = getConfig();
  const clientId = getEnv(platform.clientIdEnv);

  const state = JSON.stringify({ platform: platformId, storeId, shop: shopDomain || "", returnTo: returnTo || "" });

  let authUrl = platform.authUrl;
  if (shopDomain) {
    authUrl = authUrl.replace("{shop}", shopDomain);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: platform.scopes,
    response_type: "code",
  });

  if (platform.extraParams) {
    Object.entries(platform.extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  return `${authUrl}?${params.toString()}`;
}

export async function exchangeCode(platformId: string, code: string, shopDomain?: string): Promise<ChannelCredentials> {
  const platform = PLATFORMS[platformId];
  if (!platform) throw new Error(`Unknown platform: ${platformId}`);

  const { redirectUri } = getConfig();
  const clientId = getEnv(platform.clientIdEnv);
  const clientSecret = getEnv(platform.clientSecretEnv);

  let tokenUrl = platform.tokenUrl;
  if (shopDomain) {
    tokenUrl = tokenUrl.replace("{shop}", shopDomain);
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  if (platform.tokenBodyParams) {
    Object.entries(platform.tokenBodyParams).forEach(([key, value]) => {
      body.set(key, value);
    });
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed for ${platformId}: ${errText}`);
  }

  const data = await res.json();

  if (platform.tokenTransform) {
    return platform.tokenTransform(data);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
    scope: data.scope,
  };
}

export async function refreshAccessToken(platformId: string, refreshToken: string, shopDomain?: string): Promise<ChannelCredentials> {
  const platform = PLATFORMS[platformId];
  if (!platform) throw new Error(`Unknown platform: ${platformId}`);

  const clientId = getEnv(platform.clientIdEnv);
  const clientSecret = getEnv(platform.clientSecretEnv);

  let tokenUrl = platform.tokenUrl;
  if (shopDomain) {
    tokenUrl = tokenUrl.replace(
      "{shop}",
      shopDomain.replace(/^https?:\/\//, "").split("/")[0].replace(/\.myshopify\.com$/i, "")
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).catch((e: any) => {
    const cause = e?.cause ? `${e.cause?.message || e.cause?.code || e.cause} ` : "";
    throw new Error(`refresh fetch failed to ${tokenUrl}: ${cause}${e.message}`);
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token refresh failed for ${platformId}: ${errText}`);
  }

  const data = await res.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
    scope: data.scope,
  };
}

export function getPlatformDisplayName(platformId: string): string {
  return PLATFORMS[platformId]?.name || platformId;
}
