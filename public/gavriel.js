/**
 * Gavriel Universal AI Commerce Assistant
 * High-performance, zero-latency, cross-platform e-commerce embed
 * Compatible with Shopify, WooCommerce, Magento, Custom React/Next/Vue, Webflow, Wix, Squarespace, and HTML
 */
(function () {
  "use strict";

  if (window.__GAVRIEL_INITIALIZED__) return;
  window.__GAVRIEL_INITIALIZED__ = true;

  // Extract script configuration
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf("gavriel.js") !== -1) {
          return scripts[i];
        }
      }
      return scripts[scripts.length - 1];
    })();

  var API_KEY =
    (currentScript && (currentScript.getAttribute("data-store-id") || currentScript.getAttribute("data-api-key"))) ||
    window.GAVRIEL_STORE_ID ||
    window.GAVRIEL_API_KEY ||
    "";

  var BASE_URL = (function () {
    if (currentScript && currentScript.src) {
      try {
        var u = new URL(currentScript.src);
        return u.origin;
      } catch (e) {}
    }
    return "https://chatbot.circucity.com";
  })();

  if (!API_KEY) {
    console.warn("[Gavriel AI] Missing data-store-id or data-api-key attribute on embed script.");
  }

  // Session ID persistence
  var SESSION_KEY = "gavriel_session_id_" + (API_KEY || "default");
  var sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "gav_" + Math.random().toString(36).slice(2, 12) + "_" + Date.now().toString(36);
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (e) {}
  }

  // 0ms Client-side Active Page Product Scraper
  function scrapeActivePageProduct() {
    try {
      // 1. JSON-LD Schema.org/Product
      var jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < jsonLdScripts.length; i++) {
        try {
          var data = JSON.parse(jsonLdScripts[i].textContent || "{}");
          var item = data["@type"] === "Product" ? data : (data["@graph"] && data["@graph"].find(function (x) { return x["@type"] === "Product"; }));
          if (item) {
            var offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            return {
              name: item.name || document.title,
              price: offer ? (offer.price || offer.lowPrice) : null,
              currency: offer ? (offer.priceCurrency || "USD") : "USD",
              image: Array.isArray(item.image) ? item.image[0] : (item.image && item.image.url ? item.image.url : item.image),
              description: item.description || "",
              url: window.location.href,
            };
          }
        } catch (e) {}
      }

      // 2. OpenGraph Product Meta Tags
      var ogTitle = document.querySelector('meta[property="og:title"]');
      var ogPrice = document.querySelector('meta[property="product:price:amount"]') || document.querySelector('meta[property="og:price:amount"]');
      var ogCurrency = document.querySelector('meta[property="product:price:currency"]') || document.querySelector('meta[property="og:price:currency"]');
      var ogImage = document.querySelector('meta[property="og:image"]');
      var ogDesc = document.querySelector('meta[property="og:description"]');

      if (ogTitle && (ogPrice || window.location.pathname.indexOf('/product') !== -1 || window.location.pathname.indexOf('/item') !== -1)) {
        return {
          name: ogTitle.getAttribute("content") || document.title,
          price: ogPrice ? parseFloat(ogPrice.getAttribute("content") || "0") : null,
          currency: ogCurrency ? ogCurrency.getAttribute("content") : "USD",
          image: ogImage ? ogImage.getAttribute("content") : null,
          description: ogDesc ? ogDesc.getAttribute("content") : "",
          url: window.location.href,
        };
      }

      // 3. Shopify platform global object
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        var sp = window.ShopifyAnalytics.meta.product;
        return {
          name: sp.variants && sp.variants[0] ? sp.variants[0].name : document.title,
          price: sp.variants && sp.variants[0] ? (sp.variants[0].price / 100) : null,
          currency: window.Shopify ? window.Shopify.currency.active : "USD",
          image: sp.featured_image || null,
          description: "",
          url: window.location.href,
        };
      }
    } catch (err) {
      console.warn("[Gavriel] DOM scraper error:", err);
    }
    return null;
  }

  // Client-Side In-Memory & LocalStorage Catalog Manifest Cache
  var catalogManifest = null;
  var MANIFEST_STORAGE_KEY = "gavriel_manifest_" + API_KEY;
  var MANIFEST_ETAG_KEY = "gavriel_manifest_etag_" + API_KEY;

  function loadCachedManifest() {
    try {
      var raw = localStorage.getItem(MANIFEST_STORAGE_KEY);
      if (raw) {
        catalogManifest = JSON.parse(raw);
      }
    } catch (e) {}
  }
  loadCachedManifest();

  function syncCatalogManifest() {
    if (!API_KEY) return;
    var cachedEtag = "";
    try {
      cachedEtag = localStorage.getItem(MANIFEST_ETAG_KEY) || "";
    } catch (e) {}

    var headers = {};
    if (cachedEtag) headers["If-None-Match"] = cachedEtag;

    fetch(BASE_URL + "/api/widget/manifest?apiKey=" + encodeURIComponent(API_KEY), {
      method: "GET",
      headers: headers,
    })
      .then(function (res) {
        if (res.status === 304) return null; // Cache is fresh!
        if (res.ok) {
          var newEtag = res.headers.get("ETag");
          if (newEtag) {
            try {
              localStorage.setItem(MANIFEST_ETAG_KEY, newEtag);
            } catch (e) {}
          }
          return res.json();
        }
        return null;
      })
      .then(function (data) {
        if (data) {
          catalogManifest = data;
          try {
            localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {}
          updateWidgetTheme(data);
        }
      })
      .catch(function (err) {
        console.warn("[Gavriel] Manifest sync note:", err.message);
      });
  }
  syncCatalogManifest();

  // Instant In-Memory Catalog Search (< 5ms)
  function searchLocalCatalog(query) {
    if (!catalogManifest || !catalogManifest.products || !catalogManifest.products.length) return [];
    var q = query.toLowerCase().trim();
    if (!q) return [];
    var words = q.split(/\s+/).filter(function (w) { return w.length > 2; });
    if (!words.length) return [];

    var scored = catalogManifest.products.map(function (p) {
      var score = 0;
      var name = (p.n || "").toLowerCase();
      var cat = (p.cat || "").toLowerCase();
      var desc = (p.d || "").toLowerCase();

      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (name.indexOf(w) !== -1) score += 50;
        if (cat.indexOf(w) !== -1) score += 30;
        if (desc.indexOf(w) !== -1) score += 15;
      }
      return { product: p, score: score };
    });

    return scored
      .filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 4)
      .map(function (x) { return x.product; });
  }

  // Currency Formatter
  function formatCurrency(price, currency) {
    if (price == null) return "";
    var c = (currency || (catalogManifest && catalogManifest.currency) || "USD").toUpperCase();
    var symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      NGN: "₦",
      SEK: " kr",
      KES: " KSh",
      ZAR: "R",
      CAD: "CA$",
      AUD: "AU$",
    };
    var sym = symbols[c] || (c + " ");
    var num = typeof price === "number" ? price.toLocaleString() : price;
    if (c === "SEK" || c === "KES") return num + sym;
    return sym + num;
  }

  // UI Construction (Launcher & Drawer)
  var BRAND_COLOR = "#0A1428";
  var ACCENT_COLOR = "#A3E635";
  var BOT_NAME = "Gavriel";

  function updateWidgetTheme(manifest) {
    if (!manifest) return;
    if (manifest.botName) {
      BOT_NAME = manifest.botName;
      var titleEl = document.getElementById("gavriel-header-title");
      if (titleEl) titleEl.textContent = BOT_NAME;
    }
  }

  // Inject Styles
  var style = document.createElement("style");
  style.id = "gavriel-embed-styles";
  style.textContent = `
    #gavriel-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #gavriel-launcher-btn {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: ${ACCENT_COLOR};
      color: #0A1428;
      border: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(163,230,53,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
    }
    #gavriel-launcher-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 28px rgba(0,0,0,0.25), 0 4px 12px rgba(163,230,53,0.5);
    }
    #gavriel-launcher-btn:active {
      transform: scale(0.95);
    }
    #gavriel-chat-drawer {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 120px);
      background: #FFFFFF;
      border-radius: 20px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.08);
      animation: gavrielFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes gavrielFadeIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #gavriel-chat-header {
      background: ${BRAND_COLOR};
      color: #FFFFFF;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #gavriel-chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .gavriel-avatar {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      background: ${ACCENT_COLOR};
      color: #0A1428;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }
    #gavriel-messages-area {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F8FAFC;
    }
    .gavriel-msg {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.45;
      word-wrap: break-word;
    }
    .gavriel-msg.bot {
      background: #FFFFFF;
      color: #1E293B;
      align-self: flex-start;
      border: 1px solid #E2E8F0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .gavriel-msg.user {
      background: ${BRAND_COLOR};
      color: #FFFFFF;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .gavriel-product-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .gavriel-product-img {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
      background: #F1F5F9;
    }
    .gavriel-product-details {
      flex: 1;
      min-width: 0;
    }
    .gavriel-product-title {
      font-size: 13px;
      font-weight: 600;
      color: #0F172A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .gavriel-product-price {
      font-size: 12px;
      font-weight: 700;
      color: #15803D;
      margin-top: 2px;
    }
    .gavriel-view-btn {
      font-size: 11px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      background: ${ACCENT_COLOR};
      color: #0A1428;
      text-decoration: none;
      white-space: nowrap;
    }
    #gavriel-input-area {
      padding: 12px 16px;
      background: #FFFFFF;
      border-top: 1px solid #E2E8F0;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    #gavriel-text-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 24px;
      border: 1px solid #CBD5E1;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    #gavriel-text-input:focus {
      border-color: #0A1428;
    }
    #gavriel-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      background: ${ACCENT_COLOR};
      color: #0A1428;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  // Build DOM Structure
  var container = document.createElement("div");
  container.id = "gavriel-widget-container";
  container.innerHTML = `
    <div id="gavriel-chat-drawer">
      <div id="gavriel-chat-header">
        <div id="gavriel-chat-header-info">
          <div class="gavriel-avatar">G</div>
          <div>
            <div id="gavriel-header-title" style="font-weight: 700; font-size: 15px;">${BOT_NAME}</div>
            <div style="font-size: 11px; opacity: 0.8; display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 3px; background: #22C55E; display: inline-block;"></span> Online & Ready
            </div>
          </div>
        </div>
        <button id="gavriel-close-btn" style="background:none;border:none;color:#FFFFFF;font-size:20px;cursor:pointer;opacity:0.8;">✕</button>
      </div>
      <div id="gavriel-messages-area">
        <div class="gavriel-msg bot">
          Hello! 👋 I'm ${BOT_NAME}, your AI shopping and discovery assistant. How can I help you today?
        </div>
      </div>
      <div id="gavriel-input-area">
        <input type="text" id="gavriel-text-input" placeholder="Ask about products, orders, specs..." autocomplete="off" />
        <button type="button" id="gavriel-send-btn">➤</button>
      </div>
    </div>
    <button id="gavriel-launcher-btn" title="Open AI Assistant" aria-label="Open AI Assistant">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
  `;
  document.body.appendChild(container);

  // Wire Interaction
  var drawer = document.getElementById("gavriel-chat-drawer");
  var launcher = document.getElementById("gavriel-launcher-btn");
  var closeBtn = document.getElementById("gavriel-close-btn");
  var textInput = document.getElementById("gavriel-text-input");
  var sendBtn = document.getElementById("gavriel-send-btn");
  var messagesArea = document.getElementById("gavriel-messages-area");

  var isOpen = false;
  function toggleChat() {
    isOpen = !isOpen;
    drawer.style.display = isOpen ? "flex" : "none";
    if (isOpen) {
      textInput.focus();
      // Check active page product on open
      var pageProduct = scrapeActivePageProduct();
      if (pageProduct && !document.getElementById("gavriel-active-page-chip")) {
        var chip = document.createElement("div");
        chip.id = "gavriel-active-page-chip";
        chip.style.cssText = "font-size: 11px; background: #E2E8F0; padding: 6px 12px; border-radius: 20px; color: #334155; align-self: center; margin-bottom: 6px;";
        chip.textContent = "📍 Viewing: " + pageProduct.name + (pageProduct.price ? " (" + formatCurrency(pageProduct.price, pageProduct.currency) + ")" : "");
        messagesArea.appendChild(chip);
      }
    }
  }

  launcher.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  function appendMessage(role, text, products) {
    var msgDiv = document.createElement("div");
    msgDiv.className = "gavriel-msg " + role;
    msgDiv.textContent = text;

    if (products && products.length) {
      for (var i = 0; i < products.length; i++) {
        var p = products[i];
        var card = document.createElement("div");
        card.className = "gavriel-product-card";
        var imgHtml = p.image || p.img ? '<img class="gavriel-product-img" src="' + (p.image || p.img) + '" alt="" />' : '';
        var priceHtml = p.price || p.p ? formatCurrency(p.price || p.p, p.currency || p.c) : '';
        var linkUrl = p.url || p.u || "#";

        card.innerHTML = imgHtml +
          '<div class="gavriel-product-details">' +
            '<div class="gavriel-product-title">' + (p.name || p.n || "Product") + '</div>' +
            '<div class="gavriel-product-price">' + priceHtml + '</div>' +
          '</div>' +
          '<a class="gavriel-view-btn" href="' + linkUrl + '" target="_blank">View Item</a>';
        msgDiv.appendChild(card);
      }
    }

    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    return msgDiv;
  }

  function handleSend() {
    var text = textInput.value.trim();
    if (!text) return;
    textInput.value = "";

    appendMessage("user", text);

    // Check instant in-memory client search first
    var instantProducts = searchLocalCatalog(text);

    // Send to Edge API
    var pageProduct = scrapeActivePageProduct();
    var botMsgEl = appendMessage("bot", "...", instantProducts);

    fetch(BASE_URL + "/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        sessionId: sessionId,
        apiKey: API_KEY,
        pageUrl: window.location.href,
        pageProduct: pageProduct,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.reply) {
          botMsgEl.textContent = data.reply;
          if (data.products && data.products.length) {
            // Re-render product cards from server
            for (var i = 0; i < data.products.length; i++) {
              var p = data.products[i];
              var card = document.createElement("div");
              card.className = "gavriel-product-card";
              var imgHtml = p.image ? '<img class="gavriel-product-img" src="' + p.image + '" alt="" />' : '';
              var priceHtml = p.price ? p.price : '';
              var linkUrl = p.url || "#";

              card.innerHTML = imgHtml +
                '<div class="gavriel-product-details">' +
                  '<div class="gavriel-product-title">' + (p.name || "Product") + '</div>' +
                  '<div class="gavriel-product-price">' + priceHtml + '</div>' +
                '</div>' +
                '<a class="gavriel-view-btn" href="' + linkUrl + '" target="_blank">View Item</a>';
              botMsgEl.appendChild(card);
            }
          }
        } else {
          botMsgEl.textContent = "I'm having a little trouble connecting right now. Please try again shortly.";
        }
        messagesArea.scrollTop = messagesArea.scrollHeight;
      })
      .catch(function (err) {
        botMsgEl.textContent = "Unable to connect to assistant.";
      });
  }

  sendBtn.addEventListener("click", handleSend);
  textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleSend();
  });

  console.log("[Gavriel AI] Universal e-commerce assistant initialized.");
})();
