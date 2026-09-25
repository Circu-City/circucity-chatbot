import prisma from "@/lib/db";

export interface ChannelCredentials {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  pageId?: string;
  pageName?: string;
  igUserId?: string;
  igUserName?: string;
  phoneNumberId?: string;
  phoneNumber?: string;
  businessAccountId?: string;
}

export function getChannelConfig() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://ai.circucity.com";
  return {
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
    // Instagram Login uses the Instagram App ID/Secret, which is a distinct credential
    // pair from the Meta (Facebook) app even though both live under the same Meta app.
    // Messenger keeps using META_*; only Instagram uses these.
    igAppId: process.env.INSTAGRAM_APP_ID || "",
    igAppSecret: process.env.INSTAGRAM_APP_SECRET || "",
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || "circucity-ai-webhook-2024",
    redirectUri: `${appUrl}/api/channels/oauth/callback`,
  };
}

export async function getChannelConfigFromDb() {
  const envCfg = getChannelConfig();
  let dbCfg = { metaAppId: "", metaAppSecret: "", metaWebhookToken: "" };

  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (settings) {
      dbCfg = {
        metaAppId: settings.metaAppId || "",
        metaAppSecret: settings.metaAppSecret || "",
        metaWebhookToken: settings.metaWebhookToken || "",
      };
    }
  } catch {}

  return {
    appId: dbCfg.metaAppId || envCfg.appId,
    appSecret: dbCfg.metaAppSecret || envCfg.appSecret,
    igAppId: envCfg.igAppId,
    igAppSecret: envCfg.igAppSecret,
    webhookVerifyToken: dbCfg.metaWebhookToken || envCfg.webhookVerifyToken,
    redirectUri: envCfg.redirectUri,
  };
}

export const META_API_VERSION = "v21.0";
export const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Instagram Login endpoints. Separate host from the Facebook Graph API.
export const IG_API_VERSION = "v25.0";
export const IG_GRAPH_URL = "https://graph.instagram.com";
export const IG_AUTH_URL = "https://www.instagram.com/oauth/authorize";
export const IG_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

export async function isInstagramConfiguredAsync(): Promise<boolean> {
  const cfg = await getChannelConfigFromDb();
  return !!(cfg.igAppId && cfg.igAppSecret);
}

export async function isConfiguredAsync(): Promise<boolean> {
  const cfg = await getChannelConfigFromDb();
  return !!(cfg.appId && cfg.appSecret);
}

