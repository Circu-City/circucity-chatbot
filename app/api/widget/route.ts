import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import fs from "fs";
import path from "path";
import { crawlWebsite } from "@/lib/crawler";
import { hexToRgb } from "@/lib/widget-api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("key") || searchParams.get("apiKey") || "";
  let workspaceId = searchParams.get("workspace_id") || searchParams.get("ws_id") || "";
  const noBubble = searchParams.get("no_bubble") === "1";

  let workspaceName = "AI Assistant";
  let botName = "Cira";
  let greeting = "Hi! How can I help you today?";
  let primaryColor = "#A3E635";
  let position = "bottom-right";
  let voiceEnabled = true;
  let proactiveEnabled = true;
  let autoOpen = false;
  let autoOpenDelay = 5;
  let showBranding = true;
  let handoffEnabled = true;

  if (apiKey && /^cc_(live|demo)_[A-Za-z0-9_-]{10,}$/.test(apiKey)) {
    try {
      const store = await prisma.store.findFirst({
        where: { apiKey, status: { in: ["active", "trialing", "free"] } },
        include: { embedSettings: true },
      });
      if (store) {
        workspaceName = store.businessName || store.name || "Cira";
        workspaceId = store.id;
        botName = store.embedSettings?.botName || "Cira";
        greeting = store.greetingMessage || store.embedSettings?.welcomeMessage || greeting;
        primaryColor = store.embedSettings?.primaryColor || primaryColor;
        position = store.embedSettings?.position || position;
        voiceEnabled = store.embedSettings?.voiceEnabled !== false;
        proactiveEnabled = store.embedSettings?.proactiveEnabled !== false;
        autoOpen = store.embedSettings?.autoOpen === true;
        autoOpenDelay = store.embedSettings?.autoOpenDelay ?? 5;
        showBranding = store.embedSettings?.showBranding !== false;
        handoffEnabled = store.embedSettings?.handoffEnabled !== false;

        // Auto-verify website ownership if widget is loaded from the store's domain
        const referer = request.headers.get("referer") || request.headers.get("origin") || "";
        if (!store.ownershipVerified && referer && store.websiteUrl) {
          try {
            const storeOrigin = new URL(store.websiteUrl).origin;
            const requestOrigin = new URL(referer).origin;
            if (storeOrigin === requestOrigin) {
              await prisma.store.update({
                where: { id: store.id },
                data: { ownershipVerified: true, verifiedAt: new Date() },
              });
              console.log("[Widget] Auto-verified ownership for " + store.name + " (" + storeOrigin + ")");
              // Trigger crawl immediately
              crawlWebsite(store.id).catch((e) => console.error("Crawl error:", e));
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Widget: Failed to load workspace", e);
    }
  }

  const primaryRgb = hexToRgb(primaryColor);

  const posStyle =
    position === "bottom-left"
      ? "bottom:20px;left:20px;top:auto;right:auto;"
      : position === "top-right"
        ? "top:20px;right:20px;bottom:auto;"
        : position === "top-left"
          ? "top:20px;left:20px;bottom:auto;right:auto;"
          : "bottom:20px;right:20px;";

  const windowPosStyle =
    position === "bottom-left"
      ? "bottom:90px;left:20px;top:auto;right:auto;"
      : position === "top-right"
        ? "top:90px;right:20px;bottom:auto;"
        : position === "top-left"
          ? "top:90px;left:20px;bottom:auto;right:auto;"
          : "bottom:90px;right:20px;";

  const cssContent = [
      ":where(#cc-ai-widget),:where(#cc-ai-widget) *,:where(#cc-ai-proactive),:where(#cc-ai-proactive) *{box-sizing:border-box;margin:0;padding:0}",
      "#cc-ai-widget{position:fixed;" +
        posStyle +
        "z-index:999999;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,sans-serif;-webkit-font-smoothing:antialiased;font-size:13.5px;line-height:1.45}",
      "#cc-ai-launcher{display:flex;align-items:center;gap:10px;cursor:pointer;transition:opacity .25s,transform .25s}",
      "#cc-ai-launcher-pill{background:#fff;color:#3d4653;padding:7px 13px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid #eceff3;box-shadow:0 4px 16px rgba(15,23,42,0.14);white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;opacity:0;transform:scale(.96);transition:opacity .22s ease,transform .22s ease;pointer-events:none}",
      "#cc-ai-launcher:hover #cc-ai-launcher-pill,#cc-ai-launcher:focus #cc-ai-launcher-pill{opacity:1;transform:scale(1)}",
      "#cc-ai-bubble{position:relative;width:52px;height:52px;background:var(--cc-primary,#A3E635);border-radius:9999px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(15,23,42,0.2),0 0 0 1px rgba(255,255,255,0.14) inset;transition:transform .22s cubic-bezier(.4,0,.2,1),box-shadow .22s,opacity .25s}",
      "#cc-ai-bubble:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 10px 26px rgba(15,23,42,0.26),0 0 0 1px rgba(255,255,255,0.14) inset}",
      "#cc-ai-bubble svg{width:24px;height:24px;color:#0f172a}",
      "#cc-ai-bubble.cc-pulse{animation:ccAttention 2s ease-in-out infinite}",
      "#cc-ai-badge{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;padding:0 5px;background:#ef4444;color:#fff;border-radius:9999px;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,0.45)}",
      "#cc-ai-badge.show{display:flex}",
      // Keep the bubble itself visible/clickable when chat is open (it becomes the
      // close/minimize control, icon swapped to an X in toggle()) — only the
      // "Chat with X" hover pill hides, since it doesn't make sense while open.
      "#cc-ai-widget.chat-open #cc-ai-launcher-pill{display:none}",
      "#cc-ai-window{position:fixed;" +
        windowPosStyle +
        "width:100%;max-width:384px;height:min(600px,calc(100vh - 96px));min-height:450px;background:#fff;border-radius:16px;box-shadow:0 24px 56px -16px rgba(15,23,42,0.28),0 0 0 1px rgba(15,23,42,0.05);display:none;flex-direction:column;overflow:hidden;z-index:999999;opacity:0;transform:translateY(14px) scale(.96);transform-origin:bottom right;transition:opacity .28s cubic-bezier(.21,1.02,.73,1),transform .28s cubic-bezier(.21,1.02,.73,1)}",
      "#cc-ai-window.open{display:flex;opacity:1;transform:translateY(0) scale(1)}",
      "#cc-ai-header{background:#ffffff;color:#1f2328;padding:10px 10px 8px 12px;display:flex;align-items:center;justify-content:space-between;min-height:52px;flex-shrink:0;border-bottom:1px solid #eceff3}",
      ".cc-header-left{display:flex;align-items:center;gap:8px;min-width:0}",
      ".cc-header-info{min-width:0}",
      ".cc-header-name{font-size:13.5px;font-weight:600;line-height:1.25;letter-spacing:-.01em;color:#1f2328}",
      "#cc-ai-header .bot-avatar{width:32px;height:32px;background:var(--cc-primary,#A3E635);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 6px rgba(15,23,42,0.1)}",
      "#cc-ai-header .bot-avatar svg{width:15px;height:15px;color:#0f172a}",
      "#cc-ai-header .status{display:flex;align-items:center;gap:5px;font-size:11px;color:#8a919e;margin-top:2px}",
      "#cc-ai-header .status-dot{width:6px;height:6px;background:#22c55e;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,0.15);flex-shrink:0}",
      ".cc-header-actions{display:flex;align-items:center;gap:1px;flex-shrink:0;margin-left:8px}",
      ".cc-header-btn{background:transparent;border:none;color:#8a919e;width:28px;height:28px;border-radius:8px;font-size:11.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .18s,color .18s}",
      ".cc-header-btn:hover{background:#f1f3f6;color:#1f2328}",
      ".cc-header-btn.active{background:rgba(163,230,53,0.25);color:#1f2328}",
      "#cc-ai-body{flex:1;display:flex;flex-direction:column;min-height:0;background:#f6f7f9}",
      "#cc-ai-messages{flex:1;display:flex;flex-direction:column;padding:14px 12px 6px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#d4d9df transparent}",
      "#cc-ai-messages::-webkit-scrollbar{width:5px}",
      "#cc-ai-messages::-webkit-scrollbar-thumb{background:#d4d9df;border-radius:99px}",
      ".cc-msg-row{display:flex;gap:7px;margin-bottom:10px;animation:ccFadeUp .3s ease-out;width:100%;max-width:100%;flex:0 0 auto;align-items:flex-end}",
      ".cc-msg-row.user{justify-content:flex-end}",
      ".cc-msg-row.system{justify-content:center}",
      ".cc-msg-avatar{width:26px;height:26px;background:var(--cc-primary,#A3E635);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:2px;box-shadow:0 1px 4px rgba(15,23,42,0.1)}",
      ".cc-msg-avatar svg{width:12px;height:12px;color:#0f172a}",
      ".cc-msg-wrap{min-width:0;max-width:78%;display:flex;flex-direction:column;gap:2px}",
      ".cc-msg-row.user .cc-msg-wrap{align-items:flex-end;max-width:72%}",
      ".cc-msg{padding:8px 12px;border-radius:14px;font-size:13.5px;line-height:1.45;word-break:break-word;overflow-wrap:break-word;max-width:100%}",
      ".cc-msg.bot{background:#fff;color:#1f2328;border:1px solid #eceff3;border-bottom-left-radius:5px;box-shadow:0 1px 2px rgba(15,23,42,0.05)}",
      ".cc-msg.user{background:var(--cc-primary,#A3E635);color:#0f172a;border-bottom-right-radius:5px;box-shadow:0 1px 2px rgba(15,23,42,0.06)}",
      ".cc-msg.system{background:#eef1f4;border:none;color:#66707d;font-size:11.5px;padding:5px 13px;border-radius:999px;text-align:center;max-width:90%;line-height:1.45}",
      ".cc-msg a{color:var(--cc-primary,#65a30d);text-decoration:underline;text-underline-offset:2px;font-weight:600}",
      ".cc-msg ul{margin:5px 0 0 18px;padding:0}",
      ".cc-msg li{margin:1px 0}",
      ".cc-msg code{background:#f1f3f6;border-radius:5px;padding:1px 5px;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#3d4653}",
      ".cc-msg.bot.streaming{min-width:28px}",
      ".cc-msg.bot.streaming::after{content:'';display:inline-block;width:6px;height:13px;margin-left:3px;vertical-align:-2px;background:var(--cc-primary,#A3E635);border-radius:1px;animation:ccCaret 0.9s steps(1) infinite}",
      ".cc-msg-time{font-size:10px;color:#a2a8b3;padding:0 4px;margin-top:1px;opacity:0;transition:opacity .18s}",
      ".cc-msg-row:hover .cc-msg-time{opacity:1}",
      ".cc-msg-row.user .cc-msg-time{text-align:right}",
      ".cc-msg-actions{display:flex;gap:2px;padding-left:4px;align-items:center;opacity:0;transition:opacity .18s}",
      ".cc-msg-row:hover .cc-msg-actions{opacity:1}",
      ".cc-msg-speaker,.cc-thumb{background:none;border:none;cursor:pointer;padding:3px;color:#9aa1ac;border-radius:7px;transition:color .18s,background .18s;font-size:11.5px;line-height:1;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px}",
      ".cc-msg-speaker:hover,.cc-thumb:hover{color:var(--cc-primary,#65a30d);background:#f1f3f6}",
      ".cc-msg-speaker.playing{color:var(--cc-primary,#65a30d)}",
      ".cc-msg-speaker.loading svg{animation:ccSpin .8s linear infinite}",
      ".cc-thumb svg{width:14px;height:14px}",
      // Emoji glyphs (the old icon here) don't respond to CSS color, so the
      // active state was a silent no-op — now real SVGs, with up/down given
      // distinct colors since "not helpful" shouldn't read as the same
      // celebratory brand-green as "helpful".
      ".cc-thumb-up.active{color:var(--cc-primary,#65a30d)}",
      ".cc-thumb-down.active{color:#ef4444}",
      ".cc-typing-bubble{display:flex;align-items:center;gap:4px;padding:10px 14px!important;min-width:56px}",
      ".cc-dot{width:6px;height:6px;background:#b9c0ca;border-radius:50%;animation:ccBounce 1.2s infinite}",
      ".cc-dot:nth-child(2){animation-delay:.15s}",
      ".cc-dot:nth-child(3){animation-delay:.3s}",
      ".cc-think-orb{width:18px;height:18px;position:relative;flex-shrink:0;border-radius:50%;background:var(--cc-primary,#A3E635);animation:ccThinkBreathe 1.2s ease-in-out infinite}",
      ".cc-think-orb::before{content:'';position:absolute;inset:-4px;border-radius:50%;background:var(--cc-primary,#A3E635);opacity:.4;animation:ccThinkPulse 1.2s ease-out infinite}",
      ".cc-think-label{display:flex;align-items:center;gap:7px;font-size:12px;color:#8a919e}",
      ".cc-think-dots{display:inline-flex;align-items:center;gap:3px}",
      ".cc-think-dots::before{content:'';width:4px;height:4px;border-radius:50%;background:#b9c0ca;animation:ccBounce 1.4s infinite}",
      ".cc-think-dots::after{content:'';width:4px;height:4px;border-radius:50%;background:#b9c0ca;animation:ccBounce 1.4s .2s infinite}",
      ".cc-think-text{white-space:nowrap}",
      ".cc-think-time{font-size:10px;color:#cbd5e1;font-variant-numeric:tabular-nums;margin-left:2px}",
      "@keyframes ccThinkPulse{0%{transform:scale(.5);opacity:.5}100%{transform:scale(1.8);opacity:0}}",
      "@keyframes ccThinkBreathe{0%,100%{transform:scale(.85)}50%{transform:scale(1.08)}}",
      "#cc-ai-suggestions{display:none;padding:0 12px 8px;flex-shrink:0;background:#f6f7f9}",
      ".suggestions-label{font-size:10px;font-weight:600;color:#a2a8b3;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}",
      ".suggestions-container{display:flex;flex-wrap:wrap;gap:5px;width:100%}",
      // Shared pill-button look for .cc-suggestion/.cc-cs-chip/.cc-err-btn — each
      // keeps only its own padding/font-size/weight delta below.
      ".cc-suggestion,.cc-cs-chip,.cc-err-btn{background:#fff;border:1px solid #e3e7ec;color:#3d4653;border-radius:999px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit;transition:border-color .18s,color .18s}",
      ".cc-suggestion:hover,.cc-cs-chip:hover,.cc-err-btn:hover{border-color:var(--cc-primary,#A3E635);color:var(--cc-primary,#65a30d)}",
      ".cc-suggestion{padding:6px 11px;font-size:12px;transition:border-color .18s,color .18s,transform .18s,box-shadow .18s;box-shadow:0 1px 2px rgba(15,23,42,0.03)}",
      ".cc-suggestion:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(15,23,42,0.08)}",
      // Overlay these on top of #cc-ai-body instead of stacking them in the flex
      // column above it — otherwise they permanently steal height from the message
      // list, squeezing it into a tiny scrollable sliver while the form is showing.
      "#cc-ai-lead,#cc-ai-handoff,#cc-ai-csat{display:none;position:absolute;left:0;right:0;top:53px;bottom:0;overflow-y:auto;z-index:5;padding:12px 14px;background:#fff;animation:ccFadeUp .25s ease-out}",
      "#cc-ai-lead.open,#cc-ai-handoff.open,#cc-ai-csat.open{display:block}",
      ".cc-form-title{font-size:13px;font-weight:600;color:#1f2328;margin-bottom:10px}",
      ".cc-form-row{display:flex;flex-direction:column;gap:5px;margin-bottom:8px}",
      ".cc-form-row input,.cc-form-row textarea{border:1px solid #e3e7ec;border-radius:9px;padding:9px 11px;font-size:13px;outline:none;font-family:inherit;background:#fff;color:#1f2328;transition:border-color .18s,box-shadow .18s}",
      ".cc-form-row input:focus,.cc-form-row textarea:focus{border-color:var(--cc-primary,#A3E635);box-shadow:0 0 0 3px rgba(var(--cc-primary-rgb),0.14)}",
      ".cc-form-actions{display:flex;gap:8px;margin-top:10px}",
      ".cc-btn{border:none;border-radius:9px;padding:9px 13px;font-size:12.5px;font-weight:600;cursor:pointer;transition:transform .15s,opacity .2s,background .18s}",
      ".cc-btn-primary{background:var(--cc-primary,#A3E635);color:#0f172a}",
      ".cc-btn-ghost{background:#f1f3f6;color:#3d4653}",
      ".cc-btn-primary:hover{transform:translateY(-1px)}",
      ".cc-btn-ghost:hover{background:#e9edf1}",
      ".cc-stars{display:flex;gap:6px;justify-content:center;margin:8px 0 4px}",
      ".cc-star{background:none;border:none;font-size:26px;cursor:pointer;color:#d0d6de;transition:color .15s,transform .15s;line-height:1;padding:0 2px}",
      ".cc-star:hover,.cc-star.on{color:#f6a609;transform:scale(1.1)}",
      "#cc-ai-home{flex:1;overflow-y:auto;overflow-x:hidden;padding:20px 20px 16px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#f6f7f9;text-align:center}",
      ".cc-home-hero{display:flex;justify-content:center;padding-top:2px;margin-bottom:2px}",
      ".cc-home-avatar{width:46px;height:46px;background:var(--cc-primary,#A3E635);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(15,23,42,0.14),0 0 0 5px rgba(var(--cc-primary-rgb),0.14);animation:ccFadeUp .35s ease-out}",
      ".cc-home-avatar svg{width:20px;height:20px;color:#0f172a}",
      ".cc-home-welcome{display:flex;flex-direction:column;align-items:center}",
      ".cc-home-title{font-size:15.5px;font-weight:700;color:#1f2328;margin:0;letter-spacing:-.02em}",
      ".cc-home-eyebrow{font-size:11.5px;color:#8a919e;margin:0 0 2px}",
      ".cc-home-text{text-align:center;font-size:13px;line-height:1.5;color:#6b7280;margin:0 auto;max-width:280px}",
      ".cc-home-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px;width:100%;max-width:300px}",
      ".cc-home-chip{background:#fff;border:1px solid #e3e7ec;color:#3d4653;padding:7px 12px;border-radius:999px;font-size:12.5px;font-weight:500;cursor:pointer;transition:border-color .18s,color .18s,transform .18s,box-shadow .18s;box-shadow:0 1px 2px rgba(15,23,42,0.03);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".cc-home-chip:hover{border-color:var(--cc-primary,#A3E635);color:var(--cc-primary,#65a30d);transform:translateY(-1px);box-shadow:0 4px 10px rgba(15,23,42,0.08)}",
      ".cc-home-cards{display:flex;flex-direction:column;gap:6px;margin-top:2px;width:100%;max-width:300px}",
      ".cc-home-card{border-radius:11px;padding:9px 12px;text-align:left;cursor:pointer;transition:transform .15s ease,box-shadow .2s ease,border-color .2s ease;border:1px solid transparent;background:#fff}",
      ".cc-home-card--inverse{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;box-shadow:0 8px 18px -8px rgba(15,23,42,0.35)}",
      ".cc-home-card--chat{display:flex;align-items:center;gap:9px;width:100%;border-color:#e7e9ec;box-shadow:0 1px 2px rgba(0,0,0,0.04)}",
      ".cc-home-card--chat:hover{border-color:var(--cc-primary,#A3E635);box-shadow:0 6px 16px -6px rgba(15,23,42,0.12);transform:translateY(-1px)}",
      ".cc-home-card-title{font-size:12px;font-weight:700;margin:0 0 2px}",
      ".cc-home-card-sub{font-size:11px;color:#8a919e;margin:0}",
      ".cc-home-card--inverse .cc-home-card-sub{color:#94a3b8}",
      ".cc-home-card-text{flex:1;min-width:0}",
      ".cc-home-card-icon{width:28px;height:28px;border-radius:9px;background:var(--cc-primary,#A3E635);color:#0f172a;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
      ".cc-home-card-icon svg{width:14px;height:14px}",
      // The base .cc-home-title/.cc-home-text rules assume a light background; scope
      // overrides for when they sit inside the dark .cc-home-card--inverse hero.
      ".cc-home-card--inverse .cc-home-title{color:#fff}",
      ".cc-home-card--inverse .cc-home-text{color:#cbd5e1}",
      // Originally styled for a dark hero context; the KB search box now lives in
      // the (light) Help tab instead, so it's restyled here for a light surface.
      ".cc-kb-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e3e7ec;border-radius:9px;padding:2px 4px 2px 10px;margin-bottom:12px;flex-shrink:0;transition:border-color .2s,box-shadow .2s}",
      ".cc-kb-search:focus-within{border-color:var(--cc-primary,#A3E635);box-shadow:0 0 0 3px rgba(var(--cc-primary-rgb),0.12)}",
      "#cc-kb-input{flex:1;min-width:0;background:transparent;border:none;outline:none;color:#1f2328;font-size:13px;padding:7px 0}",
      "#cc-kb-input::placeholder{color:#9aa1ac}",
      "#cc-kb-search-btn{width:26px;height:26px;border:none;border-radius:8px;background:var(--cc-primary,#A3E635);color:#0f172a;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform .15s}",
      "#cc-kb-search-btn:hover{transform:scale(1.08)}",
      "#cc-kb-search-btn svg{width:14px;height:14px}",
      "#cc-ai-messages-list{flex:1;display:none;flex-direction:column;gap:4px;overflow-y:auto;overflow-x:hidden;padding:10px 12px;background:#fff}",
      "#cc-ai-help{flex:1;display:none;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding:14px 14px 12px;background:#f6f7f9}",
      ".cc-conv-empty{padding:32px 16px;text-align:center;color:#8a919e;font-size:12.5px}",
      ".cc-conv-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:none;border-radius:10px;cursor:pointer;padding:9px 8px;font-family:inherit;transition:background .15s}",
      ".cc-conv-item:hover{background:#f6f7f9}",
      ".cc-conv-item--new{color:var(--cc-primary,#65a30d);font-weight:600;border-bottom:1px solid #eceff3;border-radius:0;margin-bottom:4px;padding-bottom:12px}",
      ".cc-conv-item-icon{width:30px;height:30px;border-radius:9px;background:#f1f3f6;color:#5b6470;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
      ".cc-conv-item-icon svg{width:15px;height:15px}",
      ".cc-conv-item--new .cc-conv-item-icon{background:rgba(var(--cc-primary-rgb),0.14);color:var(--cc-primary,#65a30d)}",
      ".cc-conv-item-text{min-width:0;flex:1}",
      ".cc-conv-item-title{font-size:12.5px;font-weight:600;color:#1f2328;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".cc-conv-item--new .cc-conv-item-title{color:inherit}",
      ".cc-conv-item-sub{font-size:11px;color:#8a919e;margin-top:1px}",
      ".cc-faq-list{display:flex;flex-direction:column;gap:6px}",
      ".cc-faq-item{background:#fff;border:1px solid #e7ebf0;border-radius:10px;overflow:hidden;transition:border-color .15s}",
      ".cc-faq-question{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:11px 12px;font-size:12.5px;font-weight:600;color:#1f2328;font-family:inherit;line-height:1.4}",
      ".cc-faq-question svg{width:14px;height:14px;color:#8a919e;flex-shrink:0;transition:transform .2s}",
      ".cc-faq-item.open .cc-faq-question svg{transform:rotate(180deg)}",
      ".cc-faq-item.open{border-color:#d8dce1}",
      ".cc-faq-answer{max-height:0;overflow:hidden;transition:max-height .25s ease}",
      ".cc-faq-item.open .cc-faq-answer{max-height:400px}",
      ".cc-faq-answer-inner{padding:0 12px 12px;font-size:12px;line-height:1.55;color:#5b6470;white-space:pre-wrap}",
      "#cc-ai-navbar{display:flex;align-items:stretch;flex-shrink:0;height:52px;background:#fff;border-top:1px solid #eceff3}",
      ".cc-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:none;border:none;cursor:pointer;color:#8a919e;font-family:inherit;font-size:10px;font-weight:600;padding:4px 0;transition:color .15s}",
      ".cc-nav-btn svg{width:19px;height:19px}",
      ".cc-nav-btn:hover{color:#5b6470}",
      ".cc-nav-btn.active{color:var(--cc-primary,#65a30d)}",
      "#cc-ai-input-area{padding:8px 10px;background:#fff;border-top:1px solid #eceff3;flex-shrink:0;position:relative}",
      "#cc-ai-composer{display:flex;align-items:flex-end;gap:4px;background:#f1f3f6;border:1px solid transparent;border-radius:22px;padding:3px 3px 3px 12px;transition:border-color .18s,box-shadow .18s}",
      "#cc-ai-composer:focus-within{border-color:var(--cc-primary,#A3E635);box-shadow:0 0 0 3px rgba(var(--cc-primary-rgb),0.12)}",
      "#cc-ai-input-wrapper{flex:1;min-width:0}",
      "#cc-ai-input{width:100%;border:none;background:transparent;padding:7px 6px;font-size:13.5px;outline:none;color:#1f2328;resize:none;max-height:96px;min-height:30px;line-height:1.45;font-family:inherit}",
      "#cc-ai-input::placeholder{color:#9aa1ac}",
      "#cc-ai-attach,#cc-ai-mic,#cc-ai-emoji{background:none;border:none;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:#8a919e;border-radius:50%;transition:background .18s,color .18s;flex-shrink:0}",
      "#cc-ai-attach:hover,#cc-ai-mic:hover,#cc-ai-emoji:hover{background:rgba(0,0,0,0.06);color:#1f2328}",
      "#cc-ai-send{background:var(--cc-primary,#A3E635);border:none;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s,box-shadow .18s,opacity .2s;flex-shrink:0;box-shadow:0 2px 6px rgba(15,23,42,0.12)}",
      "#cc-ai-send:hover{transform:scale(1.06);box-shadow:0 4px 12px rgba(15,23,42,0.18)}",
      "#cc-ai-send:disabled{opacity:.45;cursor:not-allowed;transform:none}",
      "#cc-ai-send svg{color:#0f172a}",
      "#cc-ai-send.cc-cancel{background:#fee2e2}",
      "#cc-ai-file-preview{display:none;padding:6px 10px;background:#f1f3f6;border-top:1px solid #eceff3;align-items:center;gap:8px;font-size:12px;color:#3d4653}",
      "#cc-ai-file-preview .cc-file-thumb{width:32px;height:32px;border-radius:8px;object-fit:cover;background:#e2e8f0}",
      ".cc-file-icon{opacity:.7}",
      "#cc-file-preview-remove{background:none;border:none;cursor:pointer;color:#ef4444;font-size:18px;line-height:1;padding:2px 6px;margin-left:auto;border-radius:6px}",
      "#cc-file-preview-remove:hover{background:rgba(239,68,68,0.08)}",
      "#cc-ai-emoji-panel{display:none;position:absolute;bottom:60px;left:12px;right:12px;background:#fff;border:1px solid #eceff3;border-radius:14px;padding:8px;box-shadow:0 12px 28px rgba(15,23,42,0.14);z-index:30;grid-template-columns:repeat(8,1fr);gap:3px}",
      "#cc-ai-emoji-panel.open{display:grid}",
      "#cc-ai-emoji-panel button{background:none;border:none;font-size:18px;cursor:pointer;padding:5px;border-radius:8px;line-height:1}",
      "#cc-ai-emoji-panel button:hover{background:#f1f3f6}",
      "#cc-ai-footer{padding:6px 12px 10px;background:#fff;text-align:center;flex-shrink:0}",
      "#cc-ai-footer.hidden{display:none}",
      "#cc-ai-footer .footer-text{font-size:10.5px;color:#a2a8b3}",
      "#cc-ai-footer .footer-link{color:var(--cc-primary,#65a30d);text-decoration:none;font-weight:600}",
      "#cc-ai-footer .footer-link:hover{text-decoration:underline}",
      ".cc-toast{position:absolute;bottom:78px;left:12px;right:12px;background:#1f2328;color:#fff;padding:9px 12px;border-radius:11px;font-size:12.5px;display:flex;align-items:center;gap:9px;box-shadow:0 12px 28px rgba(15,23,42,0.25);animation:ccToastIn .3s ease-out;z-index:20}",
      ".cc-toast--success{background:linear-gradient(135deg,#065f46,#047857)}",
      ".cc-toast--error{background:linear-gradient(135deg,#7f1d1d,#b91c1c)}",
      ".cc-toast-icon{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}",
      ".cc-product-row{align-items:flex-start}",
      ".cc-product-list{display:flex;flex-direction:column;gap:6px;width:100%;max-width:100%;flex:1;min-width:0}",
      ".cc-pl-item{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e7ebf0;border-radius:11px;padding:8px 10px;width:100%;max-width:100%;min-width:0;box-sizing:border-box;transition:box-shadow .18s,border-color .18s;animation:ccFadeUp .3s ease-out}",
      ".cc-pl-item:hover{box-shadow:0 4px 14px rgba(0,0,0,0.08);border-color:#cbd5e1}",
      ".cc-pl-img{width:42px;height:42px;border-radius:8px;flex-shrink:0;overflow:hidden;background:#f1f3f6}",
      ".cc-pl-img--icon{background:rgba(var(--cc-primary-rgb),0.12);border:1px solid rgba(var(--cc-primary-rgb),0.25);display:flex;align-items:center;justify-content:center}",
      ".cc-pl-img img{width:100%;height:100%;object-fit:cover;display:block}",
      ".cc-pl-info{flex:1;min-width:0}",
      ".cc-pl-name{display:block;font-size:12.5px;font-weight:600;color:#1f2328;line-height:1.35;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cc-pl-name:hover{color:var(--cc-primary,#65a30d)}",
      ".cc-pl-price{font-size:11.5px;color:var(--cc-primary,#65a30d);font-weight:700;margin-top:2px}",
      ".cc-pl-actions{display:flex;align-items:center;gap:5px;flex-shrink:0}",
      ".cc-pl-view{font-size:10.5px;font-weight:600;color:#8a919e;text-decoration:none;padding:5px 7px;border-radius:7px;transition:background .18s,color .18s}",
      ".cc-pl-view:hover{background:#f1f3f6;color:#1f2328}",
      ".cc-pl-cart{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--cc-primary,#A3E635);color:#0f172a;border:none;cursor:pointer;transition:transform .15s,box-shadow .18s}",
      ".cc-pl-cart:hover{transform:scale(1.08);box-shadow:0 4px 12px rgba(15,23,42,0.12)}",
      ".cc-ai-proactive-bubble{position:fixed;z-index:999998;background:#fff;border:1px solid #eceff3;border-radius:16px;padding:10px 13px;font-size:13px;color:#1f2328;box-shadow:0 14px 36px rgba(15,23,42,0.16);max-width:310px;line-height:1.45;cursor:pointer;animation:ccFadeUp .35s ease-out;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;display:flex;align-items:flex-start;gap:8px}",
      ".cc-ai-proactive-bubble::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:#fff;border-right:1px solid #eceff3;border-bottom:1px solid #eceff3;transform:rotate(45deg)}",
      ".cc-ai-proactive-text{flex:1;min-width:0;padding-top:1px}",
      ".cc-ai-proactive-close{position:relative;z-index:1;width:24px;height:24px;flex:0 0 24px;margin-top:-6px;margin-right:-6px;border:0;border-radius:999px;background:transparent;color:#9aa1ac;font:700 18px/24px Arial,sans-serif;text-align:center;cursor:pointer;padding:0;transition:background .15s,color .15s;touch-action:manipulation}",
      ".cc-ai-proactive-close:hover{background:#f1f3f6;color:#1f2328}",
      ".cc-hidden{display:none!important}",
      "@keyframes ccBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}",
      "@keyframes ccSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
      "@keyframes ccFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
      "@keyframes ccToastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
      "@keyframes ccCaret{0%,49%{opacity:1}50%,100%{opacity:0}}",
      "@keyframes ccAttention{0%,100%{box-shadow:0 6px 18px rgba(15,23,42,0.2)}50%{box-shadow:0 6px 18px rgba(15,23,42,0.2),0 0 0 8px rgba(var(--cc-primary-rgb),0.22)}}",
      "#cc-ai-messages:empty::after{content:'Say hello to get started';display:block;text-align:center;color:#a2a8b3;font-size:12.5px;padding:40px 16px}",
      ".cc-msg-source{display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:11px;color:#8a919e;padding:0 4px;margin-top:4px}",
      ".cc-msg-source-label{font-weight:600;color:#a2a8b3;text-transform:uppercase;letter-spacing:.05em;font-size:10px}",
      ".cc-msg-source a{color:var(--cc-primary,#65a30d);text-decoration:none;font-weight:600}",
      ".cc-msg-source a:hover{text-decoration:underline}",
      "#cc-ai-convstate{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 12px 2px;background:#f6f7f9;flex-shrink:0;border-top:1px solid #eceff3}",
      ".cc-cs-label{font-size:10.5px;font-weight:600;color:#a2a8b3;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}",
      ".cc-cs-chip{padding:4px 10px;font-size:11.5px}",
      ".cc-cs-clear{background:none;border:none;color:#a2a8b3;cursor:pointer;font-size:12px;line-height:1;padding:4px;border-radius:6px;transition:color .18s,background .18s;flex-shrink:0}",
      ".cc-cs-clear:hover{color:#1f2328;background:#f1f3f6}",
      ".cc-msg.bot.cc-msg-error{background:#fef2f2;border-color:#fecaca;color:#991b1b}",
      ".cc-err-actions{display:flex;gap:6px;flex-wrap:wrap;padding:0 2px;margin-top:6px}",
      ".cc-err-btn{padding:5px 12px;font-size:11.5px;font-weight:600}",
      ".cc-err-btn-primary{background:var(--cc-primary,#A3E635);border-color:var(--cc-primary,#A3E635);color:#0f172a}",
      ".cc-err-btn-primary:hover{color:#0f172a}",
      "@media(hover:none){.cc-msg-time,.cc-msg-actions{opacity:1}}",
      "@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}",
      // #cc-ai-widget spans the full width on mobile (left:0;right:0) so the launcher
      // needs an explicit flex alignment to sit on the right — otherwise it falls
      // back to the start of normal flow, which renders on the LEFT edge instead.
      "@media(max-width:520px){#cc-ai-widget{bottom:0!important;left:0!important;right:0!important;top:auto!important;display:flex!important;justify-content:flex-end!important;align-items:flex-end!important}#cc-ai-window{width:100%!important;max-width:100%!important;height:100dvh!important;max-height:100dvh!important;min-height:0!important;border-radius:0!important;bottom:0!important;left:0!important;right:0!important;top:0!important;transform-origin:bottom center}#cc-ai-bubble{bottom:16px!important;right:16px!important;left:auto!important;top:auto!important}#cc-ai-launcher-pill{display:none!important}#cc-ai-input{font-size:16px!important}}",
      "@media(max-width:480px){.cc-ai-proactive-bubble{max-width:calc(100vw - 40px)!important;font-size:12.5px!important}}",
      "@media(min-width:521px) and (max-width:768px){#cc-ai-window{max-width:360px!important}}",
].join("");

  try {
    const templatePath = path.join(process.cwd(), "public", "widget-script.js");
    let script = fs.readFileSync(templatePath, "utf8");

    script = script
      .replace(/\{\{API_KEY\}\}/g, apiKey || "")
      .replace(/\{\{WS_ID\}\}/g, workspaceId)
      .replace(/\{\{WS_NAME\}\}/g, JSON.stringify(workspaceName))
      .replace(/\{\{BOT_NAME\}\}/g, JSON.stringify(botName))
      .replace(/\{\{GREETING\}\}/g, JSON.stringify(greeting))
      .replace(/\{\{PRIMARY_COLOR\}\}/g, primaryColor)
      .replace(/\{\{PRIMARY_RGB\}\}/g, primaryRgb)
      .replace(/\{\{VOICE_ENABLED\}\}/g, voiceEnabled ? "true" : "false")
      .replace(/\{\{PROACTIVE_ENABLED\}\}/g, proactiveEnabled ? "true" : "false")
      .replace(/\{\{AUTO_OPEN\}\}/g, autoOpen ? "true" : "false")
      .replace(/\{\{AUTO_OPEN_DELAY\}\}/g, String(autoOpenDelay || 5))
      .replace(/\{\{SHOW_BRANDING\}\}/g, showBranding ? "true" : "false")
      .replace(/\{\{HANDOFF_ENABLED\}\}/g, handoffEnabled ? "true" : "false")
      .replace(/\{\{POSITION\}\}/g, position)
      .replace(/\{\{NO_BUBBLE\}\}/g, noBubble ? "true" : "false")
      .replace(/\{\{CSS_CONTENT\}\}/g, cssContent.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$"));

    return new NextResponse(script, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
        "X-CircuCity-Widget": "v2",
      },
    });
  } catch (e) {
    console.error("Widget: Failed to read template", e);
    return new NextResponse("console.error('Widget script not found');", {
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
