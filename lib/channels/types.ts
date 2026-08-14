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
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";
  return {
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
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
    webhookVerifyToken: dbCfg.metaWebhookToken || envCfg.webhookVerifyToken,
    redirectUri: envCfg.redirectUri,
  };
}

export const META_API_VERSION = "v21.0";
export const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export async function isConfiguredAsync(): Promise<boolean> {
  const cfg = await getChannelConfigFromDb();
  return !!(cfg.appId && cfg.appSecret);
}

