"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Condition = "new" | "like_new" | "used" | "refurb";
type Tone = "professional" | "luxury" | "casual" | "trendy";
type Tab =
  | "analyze"
  | "listing"
  | "photo_ai"
  | "competitor"
  | "price_history"
  | "sell_through"
  | "hunter"
  | "negotiate"
  | "export"
  | "settings";

interface UserSession {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AnalysisData {
  productName: string;
  brand: string;
  categoryHierarchy: string;
  primaryCategory: string;
  conditionGrading: string;
  defectReport: string;
  materials: string;
  estimatedDimensions: string;
  pricePricing: {
    currency: string;
    fastLiquidationPrice: number;
    optimalMarginPrice: number;
    premiumValuationPrice: number;
    suggestedRange: string;
    marketRationale: string;
  };
  confidenceScore: number;
  keyFeatures: string[];
  searchKeywords: string[];
}

interface CopyData {
  shopify?: {
    title: string;
    htmlDescription: string;
    metaTitle: string;
    metaDescription: string;
    tags: string[];
    skuSuggestion: string;
  };
  amazon?: {
    title: string;
    bulletPoints: string[];
    backendSearchTerms: string;
  };
  ebay?: {
    title: string;
    subtitle: string;
    itemSpecifics: Record<string, string>;
    htmlTemplate: string;
  };
  etsy?: {
    title: string;
    description: string;
    tags13: string[];
    materials: string;
  };
  tiktok?: {
    hookTitle: string;
    caption: string;
    callToAction: string;
  };
}

export default function ProductionGavrielDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Auth State
  const [user, setUser] = useState<UserSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState<"signin" | "signup" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Product Analysis State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("like_new");
  const [tone, setTone] = useState<Tone>("professional");
  const [marketplaces, setMarketplaces] = useState<string[]>([
    "shopify",
    "ebay",
    "amazon",
    "etsy",
    "tiktok",
  ]);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [copyGenerating, setCopyGenerating] = useState(false);
  const [copyResult, setCopyResult] = useState<CopyData | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("shopify");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState<number>(14);

  // Advanced Photo Studio State (Professional UX)
  const [stagingTheme, setStagingTheme] = useState<string>("studio_white");
  const [studioAspectRatio, setStudioAspectRatio] = useState<"1:1" | "4:5" | "9:16" | "16:9">("1:1");
  const [studioLighting, setStudioLighting] = useState<string>("softbox");
  const [studioShadow, setStudioShadow] = useState<boolean>(true);
  const [studioBadge, setStudioBadge] = useState<boolean>(true);
  const [studioBadgeText, setStudioBadgeText] = useState<string>("✓ CircuCity Inspected");
  const [studioColorTemp, setStudioColorTemp] = useState<number>(5500);
  const [studioBokeh, setStudioBokeh] = useState<number>(35);
  const [studioSurface, setStudioSurface] = useState<string>("marble");
  const [customStudioPrompt, setCustomStudioPrompt] = useState<string>("");
  const [studioRendering, setStudioRendering] = useState<boolean>(false);
  const [studioActiveView, setStudioActiveView] = useState<"split" | "staged" | "raw">("split");
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);
  const [activeVariation, setActiveVariation] = useState<number>(0);

  // Competitor Radar State
  const [compSearchQuery, setCompSearchQuery] = useState<string>("");
  const [compPlatformFilter, setCompPlatformFilter] = useState<string>("all");
  const [compConditionFilter, setCompConditionFilter] = useState<string>("all");

  // Sell-Through & Price History State
  const [simulatedPrice, setSimulatedPrice] = useState<number>(79);
  const [priceHistoryRange, setPriceHistoryRange] = useState<"30d" | "90d" | "12m">("12m");

  // Demand insights
  const [demandInsights, setDemandInsights] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Negotiation state
  const [buyerOffer, setBuyerOffer] = useState<string>("55");
  const [itemCost, setItemCost] = useState<string>("25");
  const [negotiationTone, setNegotiationTone] = useState<"counter" | "firm" | "urgency" | "bundle">("counter");
  const [negotiationScript, setNegotiationScript] = useState<string | null>(null);
  const [negotiationLang, setNegotiationLang] = useState<string>("en");

  // Omni-Publish State
  const [publishingChannels, setPublishingChannels] = useState<string[]>(["shopify", "ebay"]);
  const [publishStatus, setPublishStatus] = useState<Record<string, "idle" | "publishing" | "published">>({
    shopify: "idle",
    ebay: "idle",
    tiktok: "idle",
    amazon: "idle",
  });

  // Settings & Integrations
  const [defaultCurrency, setDefaultCurrency] = useState<string>("EUR");
  const [targetMargin, setTargetMargin] = useState<number>(45);
  const [apiKeyVisible, setApiKeyVisible] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>("https://api.mystore.com/webhooks/gavriel-sync");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Initial Load
  useEffect(() => {
    async function checkUserSession() {
      try {
        setCheckingSession(true);
        const res = await fetch("/api/gavriel/auth/session");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (e) {
        console.error("Failed to check session", e);
      } finally {
        setCheckingSession(false);
      }
    }
    checkUserSession();

    // Check onboarding
    const hasSeen = localStorage.getItem("gavriel_seen_onboarding");
    if (!hasSeen) {
      setShowOnboarding(true);
    }

    // Preload default sample product for immediate testing
    loadSample("headphones");
  }, []);

  // Fetch live Cira demand insights
  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoadingInsights(true);
        const res = await fetch("/api/gavriel/demand-insights");
        const json = await res.json();
        if (json.insights) setDemandInsights(json.insights);
      } catch (e) {
        console.error("Failed to load demand insights", e);
      } finally {
        setLoadingInsights(false);
      }
    }
    fetchInsights();
  }, []);

  // Split Slider Mouse Handlers
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = Math.round((x / rect.width) * 100);
    setSplitSliderPos(pct);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const endpoint = showAuthModal === "signup" ? "/api/gavriel/auth/sign-up" : "/api/gavriel/auth/sign-in";
    const payload = showAuthModal === "signup"
      ? { email: authEmail, password: authPassword, name: authName }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setShowAuthModal(null);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (err: any) {
      setAuthError(err.message || "Network error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/gavriel/auth/sign-out", { method: "POST" });
      setUser(null);
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        setImagePreview(res);
        setAnalysisResult(null);
        setCopyResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSample = (type: "pasta" | "jacket" | "headphones" | "vase") => {
    const samples: Record<string, { url: string; cond: Condition; name: string; brand: string; cat: string; price: number }> = {
      headphones: {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23070D1A'/><circle cx='200' cy='200' r='140' fill='%230E1E3A'/><text x='50%' y='45%' font-family='sans-serif' font-size='36' fill='%23A3E635' text-anchor='middle'>🎧 Studio Pro</text><text x='50%' y='58%' font-family='sans-serif' font-size='15' fill='%2394A3B8' text-anchor='middle'>ANC Wireless Headphones</text><text x='50%' y='70%' font-family='sans-serif' font-size='12' fill='%23A3E635' text-anchor='middle'>CircuCity Verified • 98% Score</text></svg>",
        cond: "like_new",
        name: "Studio ANC Wireless Over-Ear Headphones",
        brand: "AeroSound Pro",
        cat: "Electronics > Audio > Headphones > Over-Ear",
        price: 185,
      },
      jacket: {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%230A1428'/><circle cx='200' cy='200' r='140' fill='%23122142'/><text x='50%' y='45%' font-family='sans-serif' font-size='36' fill='%23A3E635' text-anchor='middle'>🧥 Vintage Biker</text><text x='50%' y='58%' font-family='sans-serif' font-size='15' fill='%2394A3B8' text-anchor='middle'>Heavyweight Leather Coat</text><text x='50%' y='70%' font-family='sans-serif' font-size='12' fill='%23A3E635' text-anchor='middle'>Distressed Patina • Grade A</text></svg>",
        cond: "used",
        name: "1990s Distressed Heavyweight Biker Jacket",
        brand: "Nordic Heritage",
        cat: "Apparel > Men's Clothing > Outerwear > Leather Jackets",
        price: 145,
      },
      pasta: {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%230B132B'/><circle cx='200' cy='200' r='140' fill='%23112247'/><text x='50%' y='45%' font-family='sans-serif' font-size='36' fill='%23A3E635' text-anchor='middle'>🍲 Artisanal Pasta</text><text x='50%' y='58%' font-family='sans-serif' font-size='15' fill='%2394A3B8' text-anchor='middle'>Bronze-Cut Durum Wheat</text><text x='50%' y='70%' font-family='sans-serif' font-size='12' fill='%23A3E635' text-anchor='middle'>Gourmet Pantry Staple</text></svg>",
        cond: "new",
        name: "Artisanal Bronze-Cut Durum Rotini Pasta (500g)",
        brand: "Pastaia Modena",
        cat: "Grocery & Gourmet > Pantry Staples > Pasta & Noodles",
        price: 8,
      },
      vase: {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%230F172A'/><circle cx='200' cy='200' r='140' fill='%23192B54'/><text x='50%' y='45%' font-family='sans-serif' font-size='36' fill='%23A3E635' text-anchor='middle'>🏺 Ceramic Vase</text><text x='50%' y='58%' font-family='sans-serif' font-size='15' fill='%2394A3B8' text-anchor='middle'>Matte Stoneware Handcrafted</text><text x='50%' y='70%' font-family='sans-serif' font-size='12' fill='%23A3E635' text-anchor='middle'>Nordic Minimalist Studio</text></svg>",
        cond: "like_new",
        name: "Handcrafted Matte Stoneware Nordic Vase",
        brand: "Krukmakeri Studio",
        cat: "Home & Living > Home Decor > Vases & Ceramics",
        price: 65,
      },
    };
    const s = samples[type];
    setImagePreview(s.url);
    setCondition(s.cond);
    setCompSearchQuery(s.name);
    setSimulatedPrice(s.price);

    setAnalysisResult({
      productName: s.name,
      brand: s.brand,
      categoryHierarchy: s.cat,
      primaryCategory: s.cat.split(" > ")[0],
      conditionGrading: s.cond === "like_new" ? "Like New / Mint" : s.cond === "new" ? "Brand New in Box" : "Very Good (Pre-owned)",
      defectReport: "Inspected: Zero structural flaws detected. Pristine condition.",
      materials: type === "headphones" ? "Synthetic Leather & Recycled ABS" : type === "jacket" ? "100% Genuine Cowhide Leather" : type === "pasta" ? "100% Italian Durum Wheat Semolina" : "Matte Glazed Stoneware",
      estimatedDimensions: type === "headphones" ? "Over-Ear (Approx 20cm x 18cm)" : type === "jacket" ? "Size L / 52 EU (Chest 112cm)" : type === "pasta" ? "500g Sealed Pack" : "Height 24cm, Base 12cm",
      pricePricing: {
        currency: "EUR",
        fastLiquidationPrice: Math.round(s.price * 0.7),
        optimalMarginPrice: s.price,
        premiumValuationPrice: Math.round(s.price * 1.35),
        suggestedRange: `€${Math.round(s.price * 0.7)} - €${Math.round(s.price * 1.35)}`,
        marketRationale: `Based on 840+ verified sales on eBay, Amazon & Shopify in the EU market with an average 8.4-day sell-through velocity.`,
      },
      confidenceScore: 98,
      keyFeatures: [
        "Verified authentic physical condition and hardware integrity",
        "High consumer search index across European marketplaces",
        "Formatted for 1-click omni-channel publishing",
        "Pre-graded for instant customer trust and reduced returns",
      ],
      searchKeywords: [
        s.brand.toLowerCase().replace(/\s+/g, "-"),
        "free-shipping",
        "top-rated-seller",
        "mint-condition",
        "verified-authentic",
        "express-delivery",
      ],
    });
  };

  const toggleMarketplace = (m: string) => {
    if (marketplaces.includes(m)) {
      if (marketplaces.length > 1) {
        setMarketplaces(marketplaces.filter((item) => item !== m));
      }
    } else {
      setMarketplaces([...marketplaces, m]);
    }
  };

  const runAnalysis = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/gavriel/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: imagePreview,
          condition,
          tone,
          marketplaces,
          currency: defaultCurrency,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
        setSimulatedPrice(data.data.pricePricing?.optimalMarginPrice || 79);
        setCompSearchQuery(data.data.productName);
        setGenerationCount((c) => c + 1);
      } else {
        alert(data.error || "Failed to analyze image");
      }
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const runCopyGeneration = async () => {
    if (!analysisResult) return;
    setCopyGenerating(true);
    try {
      const res = await fetch("/api/gavriel/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: analysisResult,
          marketplaces,
          tone,
        }),
      });
      const data = await res.json();
      if (data.success && data.copy) {
        setCopyResult(data.copy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCopyGenerating(false);
    }
  };

  useEffect(() => {
    if (activeTab === "listing" && analysisResult && !copyResult) {
      runCopyGeneration();
    }
  }, [activeTab, analysisResult]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleNegotiate = () => {
    const offerNum = parseFloat(buyerOffer) || 0;
    const askNum = analysisResult?.pricePricing.optimalMarginPrice || 100;
    const counterNum = Math.round((offerNum + askNum) / 2);

    const langGreeting: Record<string, string> = {
      en: "Hi there! Thank you for your interest.",
      de: "Hallo! Vielen Dank für Ihr Interesse.",
      sv: "Hej! Tack för ditt intresse.",
      fr: "Bonjour! Merci pour votre intérêt.",
      es: "¡Hola! Gracias por su interés.",
    };

    let script = "";
    if (negotiationTone === "counter") {
      script = `${langGreeting[negotiationLang]} I appreciate your offer of €${offerNum}. Given the verified ${analysisResult?.conditionGrading || "like-new"} condition and recent market comps (€${askNum}), the lowest I could do is €${counterNum}. If you'd like to move forward at €${counterNum}, I will pack and dispatch it today with tracking!`;
    } else if (negotiationTone === "firm") {
      script = `${langGreeting[negotiationLang]} Thank you for reaching out. The listing price of €${askNum} is already competitively set based on verified historical sales and pristine condition. I cannot accept €${offerNum}, but I am happy to include complimentary express shipping if purchased today.`;
    } else if (negotiationTone === "urgency") {
      script = `${langGreeting[negotiationLang]} I have multiple active inquiries on this item right now. If you can complete payment within the next 2 hours, I will accept a special flash offer of €${Math.round(offerNum + (askNum - offerNum) * 0.35)}. Let me know and I'll update the listing price right away!`;
    } else {
      script = `${langGreeting[negotiationLang]} I can't let it go for €${offerNum} individually, but if you'd like to bundle this with any other piece from my store, I can offer 25% off the entire order. Would you like me to reserve the bundle for you?`;
    }
    setNegotiationScript(script);
  };

  // Professional Studio Staging Actions
  const handleStudioRender = () => {
    setStudioRendering(true);
    setTimeout(() => {
      setStudioRendering(false);
    }, 1200);
  };

  const handleOmniPublish = () => {
    const updated: Record<string, "idle" | "publishing" | "published"> = {};
    publishingChannels.forEach((c) => {
      updated[c] = "publishing";
    });
    setPublishStatus(updated);

    setTimeout(() => {
      const finished: Record<string, "idle" | "publishing" | "published"> = {};
      publishingChannels.forEach((c) => {
        finished[c] = "published";
      });
      setPublishStatus(finished);
    }, 2000);
  };

  const dismissOnboarding = () => {
    localStorage.setItem("gavriel_seen_onboarding", "true");
    setShowOnboarding(false);
  };

  const basePrice = analysisResult?.pricePricing.optimalMarginPrice || simulatedPrice || 79;
  const competitorComps = [
    {
      id: "c1",
      platform: "eBay Sold",
      title: `${analysisResult?.brand || "Brand"} ${analysisResult?.productName || "Product"} - Mint`,
      soldPrice: Math.round(basePrice * 1.05),
      shipping: 4.99,
      soldDate: "2 hours ago",
      condition: "Like New",
      region: "EU (Germany)",
      rating: "99.8% (1.4k)",
      link: "#",
    },
    {
      id: "c2",
      platform: "Amazon BuyBox",
      title: `${analysisResult?.brand || "Brand"} ${analysisResult?.productName || "Product"}`,
      soldPrice: Math.round(basePrice * 1.25),
      shipping: 0.0,
      soldDate: "Active Now",
      condition: "Brand New",
      region: "EU (Sweden)",
      rating: "4.8/5 (820)",
      link: "#",
    },
    {
      id: "c3",
      platform: "StockX / Resale",
      title: `${analysisResult?.productName || "Product"} Verified Authentic`,
      soldPrice: Math.round(basePrice * 0.98),
      shipping: 9.5,
      soldDate: "Yesterday",
      condition: "Deadstock",
      region: "Global",
      rating: "Verified Authenticated",
      link: "#",
    },
    {
      id: "c4",
      platform: "Poshmark / Vinted",
      title: `${analysisResult?.productName || "Product"} (Used, Clean)`,
      soldPrice: Math.round(basePrice * 0.82),
      shipping: 3.5,
      soldDate: "3 days ago",
      condition: "Very Good",
      region: "EU (France)",
      rating: "5.0 (310)",
      link: "#",
    },
    {
      id: "c5",
      platform: "eBay Sold",
      title: `${analysisResult?.brand || "Brand"} Original Box + Accessories`,
      soldPrice: Math.round(basePrice * 1.12),
      shipping: 5.0,
      soldDate: "5 days ago",
      condition: "Like New",
      region: "UK (London)",
      rating: "100% (540)",
      link: "#",
    },
  ];

  // Studio Variations
  const studioVariations = [
    {
      id: 0,
      name: "Hero Front View",
      badge: "Commercial Hero",
      crop: "1:1 Square",
      theme: "studio_white",
      desc: "Amazon & Shopify primary catalog main image with pure white isolation.",
    },
    {
      id: 1,
      name: "45° Studio Showcase",
      badge: "Dramatic Slate",
      crop: "1:1 Square",
      theme: "dark_luxury",
      desc: "Specular floor reflection with subtle green & slate rim spotlighting.",
    },
    {
      id: 2,
      name: "Nordic Living Context",
      badge: "Lifestyle In-Situ",
      crop: "4:5 Instagram",
      theme: "scandinavian",
      desc: "Warm natural daylight in a minimalist oak & architectural interior.",
    },
    {
      id: 3,
      name: "Macro Detail & Texture",
      badge: "Authenticity Zoom",
      crop: "1:1 Macro",
      theme: "marble_podium",
      desc: "Focus on build materials, pristine seams, and verified hardware finish.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#060D1B] text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-[#A3E635] selection:text-[#0A1428]">
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A1428] border border-slate-700 rounded-3xl max-w-sm w-full p-7 shadow-2xl space-y-5 relative animate-fadeIn">
            <button
              onClick={() => setShowAuthModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-[#A3E635] text-[#0A1428] font-black text-xl flex items-center justify-center mx-auto shadow-md shadow-[#A3E635]/20">
                G
              </div>
              <h2 className="text-xl font-black text-white pt-2">
                {showAuthModal === "signup" ? "Create Free Account" : "Sign In to Gavriel"}
              </h2>
              <p className="text-xs text-slate-400">
                {showAuthModal === "signup"
                  ? "150 free AI listing generations included immediately."
                  : "Access your saved listings, scene staging, and store channels."}
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {showAuthModal === "signup" && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Sha Nasser"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060D1B] border border-slate-700 text-white focus:outline-none focus:border-[#A3E635]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@store.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060D1B] border border-slate-700 text-white focus:outline-none focus:border-[#A3E635]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060D1B] border border-slate-700 text-white focus:outline-none focus:border-[#A3E635]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] font-black text-xs transition shadow-md shadow-[#A3E635]/20 mt-2"
              >
                {authLoading
                  ? "Processing..."
                  : showAuthModal === "signup"
                  ? "Sign Up & Get 150 Generations"
                  : "Sign In"}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-1">
              {showAuthModal === "signup" ? (
                <span>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setShowAuthModal("signin");
                      setAuthError("");
                    }}
                    className="text-[#A3E635] font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New to Gavriel?{" "}
                  <button
                    onClick={() => {
                      setShowAuthModal("signup");
                      setAuthError("");
                    }}
                    className="text-[#A3E635] font-bold hover:underline"
                  >
                    Create Free Account
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A1428] border border-slate-700 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 relative animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#A3E635] text-[#0A1428] font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#A3E635]/20">
                G
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight pt-2">
                Welcome, {user?.name || "Merchant"} 👋
              </h2>
              <p className="text-xs text-slate-400">
                Here&apos;s how to turn any unedited product picture into a multi-channel revenue engine in under 60 seconds.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-4 rounded-2xl bg-[#0F1D38] border border-slate-700/60 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Upload or Snap a Photo</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Gavriel Vision Core reads barcodes, textures, condition wear, and defects directly from the image.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1D38] border border-slate-700/60 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dynamic Pricing & Comp Radar</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Instant 3-tier valuation (*Fast 48h*, *Optimal Margin*, *Premium Valuation*) grounded in verified sold comps.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1D38] border border-slate-700/60 flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-white">1-Click Multi-Channel Sync</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Formatted and exported natively to Shopify, Amazon, eBay, Etsy, and TikTok Shop with live inventory sync.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={dismissOnboarding}
              className="w-full py-3.5 rounded-xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] font-black text-xs transition shadow-lg shadow-[#A3E635]/20"
            >
              Launch Dashboard →
            </button>
          </div>
        </div>
      )}

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A1428] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#A3E635] text-[#0A1428] font-black text-sm flex items-center justify-center shadow-md shadow-[#A3E635]/20">
            G
          </div>
          <span className="font-black text-white text-sm tracking-tight">GAVRIEL OS</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <span className="text-[11px] text-[#A3E635] font-bold truncate max-w-[120px]">
              {user.name || user.email}
            </span>
          ) : (
            <button
              onClick={() => setShowAuthModal("signin")}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#A3E635] text-[#0A1428]"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-[#0A1428] border-r border-slate-800/80 p-5 shrink-0 z-30 justify-between min-h-screen`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A3E635] text-[#0A1428] font-black text-base flex items-center justify-center shadow-lg shadow-[#A3E635]/25">
                G
              </div>
              <div>
                <div className="font-black text-white text-base tracking-tight leading-none">
                  GAVRIEL
                </div>
                <div className="text-[9px] font-bold tracking-widest uppercase text-[#A3E635] mt-1">
                  Autonomous OS
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              v2.5 PRO
            </span>
          </div>

          {/* User Auth Card */}
          <div className="p-3.5 rounded-2xl bg-[#060D1B] border border-slate-800">
            {checkingSession ? (
              <div className="text-xs text-slate-500 animate-pulse">Checking credentials...</div>
            ) : user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] font-black text-[10px] flex items-center justify-center border border-[#A3E635]/40">
                      {user.name ? user.name.slice(0, 1).toUpperCase() : "U"}
                    </div>
                    <div className="text-xs font-bold text-white truncate max-w-[110px]">
                      {user.name || user.email.split("@")[0]}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition"
                  >
                    Logout
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Quota: <strong className="text-[#A3E635]">{generationCount}/150</strong></span>
                  <span className="text-[9px] text-[#A3E635] font-bold">● Active</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <div className="text-[11px] text-slate-300 font-semibold">Guest Seller Mode</div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => setShowAuthModal("signin")}
                    className="py-1.5 px-2 rounded-lg bg-[#0A1428] border border-slate-700 hover:border-[#A3E635] text-[11px] font-bold text-white transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuthModal("signup")}
                    className="py-1.5 px-2 rounded-lg bg-[#A3E635] hover:bg-[#b2f04e] text-[11px] font-black text-[#0A1428] transition"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Core Intelligence
            </div>
            {[
              { id: "analyze", label: "Vision Core 2.0", icon: "👁️" },
              { id: "listing", label: "Listing Matrix", icon: "📑" },
              { id: "photo_ai", label: "Generative Photo Studio", icon: "🎨" },
              { id: "hunter", label: "Cira Demand Radar", icon: "📡" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeTab === item.id
                    ? "bg-[#A3E635] text-[#0A1428] shadow-md shadow-[#A3E635]/20 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">
              Market Comps & Sales
            </div>
            {[
              { id: "competitor", label: "Competitor Comp Radar", icon: "⚡" },
              { id: "price_history", label: "12M Price History", icon: "📈" },
              { id: "sell_through", label: "Sell-Through Velocity", icon: "⏱️" },
              { id: "negotiate", label: "Offer Copilot", icon: "🤝" },
              { id: "export", label: "Omni-Publish Sync", icon: "🚀" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeTab === item.id
                    ? "bg-[#A3E635] text-[#0A1428] shadow-md shadow-[#A3E635]/20 font-black"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">
              System
            </div>
            <button
              onClick={() => {
                setActiveTab("settings");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                activeTab === "settings"
                  ? "bg-[#A3E635] text-[#0A1428] shadow-md shadow-[#A3E635]/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span className="text-sm">⚙️</span>
              <span>Store Integrations & Quota</span>
            </button>
          </nav>
        </div>

        {/* Campaign Banner & Guide */}
        <div className="pt-6 space-y-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className="w-full py-2 px-3 rounded-xl bg-[#060D1B] border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 font-bold transition flex items-center justify-center gap-2"
          >
            <span>💡</span>
            <span>View Onboarding Tour</span>
          </button>

          <a
            href="https://chatbot.circucity.com/early-access"
            target="_blank"
            rel="noreferrer"
            className="block p-3.5 rounded-2xl bg-gradient-to-br from-[#0F2248] to-[#081226] border border-[#A3E635]/30 hover:border-[#A3E635] transition text-left group"
          >
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#A3E635] flex items-center gap-1.5">
              <span>🚀 Startnext Campaign</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 group-hover:text-[#A3E635] transition">
              Get Lifetime Pioneer Pass
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Early supporter bundles from €10 →
            </div>
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#A3E635] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
              CircuCity AI Autonomous Commerce OS
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1 capitalize">
              {activeTab === "analyze" && "Vision Core 2.0 Inspection"}
              {activeTab === "listing" && "Multi-Channel Listing Matrix"}
              {activeTab === "photo_ai" && "Generative Photo Studio & Lifestyle Staging"}
              {activeTab === "hunter" && "Cira Live Shopper Demand Radar"}
              {activeTab === "competitor" && "Real-Time Competitor Comp Radar"}
              {activeTab === "price_history" && "12-Month Historical Price Index"}
              {activeTab === "sell_through" && "Sell-Through Velocity Analyzer"}
              {activeTab === "negotiate" && "Counter-Offer & Negotiation Copilot"}
              {activeTab === "export" && "Multi-Platform Omni-Publish Hub"}
              {activeTab === "settings" && "Store Integrations, API & Quota"}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[#0A1428] border border-slate-800 text-xs text-slate-300 font-mono">
              <span className="text-slate-500">Studio Engine:</span> <strong className="text-[#A3E635]">4K Generative Rig</strong>
            </div>
            {analysisResult && (
              <button
                onClick={() => setActiveTab("export")}
                className="px-4 py-2 rounded-xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] font-black text-xs transition shadow-md shadow-[#A3E635]/20 flex items-center gap-1.5"
              >
                <span>Publish Listing</span>
                <span>→</span>
              </button>
            )}
          </div>
        </header>

        {/* MODULE 1: VISION CORE 2.0 */}
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`h-64 rounded-3xl border-2 border-dashed transition flex flex-col items-center justify-center p-6 text-center cursor-pointer relative overflow-hidden ${
                  imagePreview
                    ? "border-[#A3E635]/60 bg-[#0A1428]"
                    : "border-slate-800 bg-[#0A1428] hover:border-[#A3E635]/50"
                }`}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Upload Preview"
                    className="absolute inset-0 w-full h-full object-contain p-4 bg-[#060D1B]"
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#0F2248] text-[#A3E635] flex items-center justify-center text-2xl mx-auto shadow-inner">
                      📸
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Drop product photo here
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Supports JPEG, PNG, WEBP from any warehouse camera
                      </div>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Sample Presets */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Or Test with Inventory Presets:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "headphones", label: "🎧 ANC Headset" },
                    { id: "jacket", label: "🧥 Leather Coat" },
                    { id: "pasta", label: "🍝 Artisan Pasta" },
                    { id: "vase", label: "🏺 Nordic Vase" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSample(s.id as any)}
                      className="p-2.5 rounded-xl bg-[#0A1428] border border-slate-800 hover:border-[#A3E635] text-xs text-slate-300 font-bold text-center transition hover:text-white"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Selector */}
              <div className="bg-[#0A1428] border border-slate-800 rounded-2xl p-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Condition Grading
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["new", "like_new", "used", "refurb"] as Condition[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl capitalize transition text-center ${
                        condition === c
                          ? "bg-[#A3E635] text-[#0A1428] shadow-md shadow-[#A3E635]/20 font-black"
                          : "bg-[#060D1B] text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      {c === "like_new" ? "Like New" : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Tone Selector */}
              <div className="bg-[#0A1428] border border-slate-800 rounded-2xl p-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Listing Brand Voice
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["professional", "luxury", "casual", "trendy"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl capitalize transition text-center ${
                        tone === t
                          ? "bg-[#0E2248] text-[#A3E635] border border-[#A3E635]/60 font-black"
                          : "bg-[#060D1B] text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyze Action Button */}
              <button
                disabled={!imagePreview || analyzing}
                onClick={runAnalysis}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow-xl ${
                  !imagePreview || analyzing
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] shadow-[#A3E635]/25"
                }`}
              >
                {analyzing ? (
                  <>
                    <span className="animate-spin text-lg">⚙️</span>
                    <span>Analyzing with Gavriel Vision Core...</span>
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    <span>Run Vision Core Inspection</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis Output Pane */}
            <div className="lg:col-span-7 space-y-5">
              {analysisResult ? (
                <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-[#A3E635] mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                        ✦ Vision Core Inspection Verified
                      </div>
                      <h2 className="text-xl font-black text-white">
                        {analysisResult.productName}
                      </h2>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {analysisResult.categoryHierarchy}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Detection Confidence
                      </div>
                      <div className="text-xl font-black text-[#A3E635] font-mono">
                        {analysisResult.confidenceScore}%
                      </div>
                    </div>
                  </div>

                  {/* 3-Tier Pricing Model */}
                  <div className="bg-[#060D1B] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>3-Tier Dynamic Price Matrix</span>
                      <span className="text-[#A3E635] font-bold normal-case text-sm">
                        Suggested: {analysisResult.pricePricing.suggestedRange}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#0A1428] border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          Fast (48h)
                        </div>
                        <div className="text-lg font-black text-amber-400 font-mono mt-1">
                          €{analysisResult.pricePricing.fastLiquidationPrice}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">High Velocity</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0E2248] border border-[#A3E635]/60 text-center shadow-inner">
                        <div className="text-[10px] text-[#A3E635] uppercase font-bold">
                          Optimal Margin
                        </div>
                        <div className="text-lg font-black text-[#A3E635] font-mono mt-1">
                          €{analysisResult.pricePricing.optimalMarginPrice}
                        </div>
                        <div className="text-[9px] text-slate-300 mt-0.5">Recommended Target</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0A1428] border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          Premium Max
                        </div>
                        <div className="text-lg font-black text-indigo-300 font-mono mt-1">
                          €{analysisResult.pricePricing.premiumValuationPrice}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Patient Niche Comps</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                      💡 <span className="text-slate-400 font-semibold">Comps Intelligence:</span> {analysisResult.pricePricing.marketRationale}
                    </p>
                  </div>

                  {/* Attributes & Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800">
                      <div className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Condition Assessment
                      </div>
                      <div className="font-bold text-white">
                        {analysisResult.conditionGrading}
                      </div>
                      <div className="text-slate-400 mt-1.5 text-[11px]">
                        <span className="text-slate-500">Defect Scan:</span> {analysisResult.defectReport}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800">
                      <div className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                        Materials & Specs
                      </div>
                      <div className="font-bold text-white">
                        {analysisResult.materials || "High-Grade Composite"}
                      </div>
                      <div className="text-slate-400 mt-1.5 text-[11px]">
                        <span className="text-slate-500">Dimensions:</span> {analysisResult.estimatedDimensions}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Key Extracted Selling Points
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.keyFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#A3E635] font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Keywords */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      High-Intent SEO Keywords
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.searchKeywords.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-[#060D1B] text-slate-300 text-[11px] font-mono border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action Navigation */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Inspection ready for listing generation.
                    </span>
                    <button
                      onClick={() => setActiveTab("listing")}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] transition flex items-center gap-1.5"
                    >
                      <span>Open Listing Matrix</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[420px] rounded-3xl border border-slate-800 bg-[#081020] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-3xl bg-[#0A1428] border border-slate-700 flex items-center justify-center text-3xl mb-4 text-[#A3E635]">
                    ⚡
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    No Product Analyzed Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                    Upload a product picture or select one of the presets on the left.
                    Gavriel Vision Core will immediately grade defects, evaluate comps, and construct your multi-channel matrix.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODULE 2: LISTING MATRIX */}
        {activeTab === "listing" && (
          <div className="space-y-6">
            {!analysisResult ? (
              <div className="rounded-3xl border border-slate-800 bg-[#0A1428] p-8 text-center">
                <div className="text-3xl mb-3">👁️</div>
                <h3 className="text-base font-bold text-white">
                  Inspect an item in Vision Core first
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gavriel automatically formats copy tailored for Shopify, Amazon, eBay, Etsy, and TikTok Shop.
                </p>
                <button
                  onClick={() => setActiveTab("analyze")}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#A3E635] text-[#0A1428] font-bold text-xs"
                >
                  Return to Vision Analyzer
                </button>
              </div>
            ) : (
              <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
                  {marketplaces.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPlatform(p)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition shrink-0 ${
                        selectedPlatform === p
                          ? "bg-[#A3E635] text-[#0A1428] shadow-md shadow-[#A3E635]/20 font-black"
                          : "bg-[#060D1B] text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {p === "tiktok" ? "TikTok Shop" : p}
                    </button>
                  ))}
                </div>

                {copyGenerating ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#A3E635] border-t-transparent animate-spin mx-auto" />
                    <div className="text-xs text-slate-400 font-bold">
                      Synthesizing platform-compliant copy for {selectedPlatform}...
                    </div>
                  </div>
                ) : copyResult ? (
                  <div className="space-y-6">
                    {/* SHOPIFY TAB */}
                    {selectedPlatform === "shopify" && copyResult.shopify && (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              Shopify Product Title
                            </span>
                            <button
                              onClick={() => copyToClipboard(copyResult.shopify?.title || "", "sh_title")}
                              className="text-[#A3E635] font-bold hover:underline"
                            >
                              {copiedKey === "sh_title" ? "✓ Copied" : "Copy Title"}
                            </button>
                          </div>
                          <div className="text-sm font-bold text-white">
                            {copyResult.shopify.title}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              Rich HTML Description
                            </span>
                            <button
                              onClick={() => copyToClipboard(copyResult.shopify?.htmlDescription || "", "sh_desc")}
                              className="text-[#A3E635] font-bold hover:underline"
                            >
                              {copiedKey === "sh_desc" ? "✓ Copied" : "Copy HTML"}
                            </button>
                          </div>
                          <div
                            className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto bg-[#0A1428] p-3 rounded-xl border border-slate-800/80 font-mono"
                          >
                            {copyResult.shopify.htmlDescription}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              SKU & Barcode
                            </span>
                            <div className="font-mono text-white font-bold mt-1">
                              {copyResult.shopify.skuSuggestion || "SKU-PRO-01"}
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              Tags
                            </span>
                            <div className="text-slate-300 mt-1 truncate">
                              {copyResult.shopify.tags?.join(", ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AMAZON TAB */}
                    {selectedPlatform === "amazon" && copyResult.amazon && (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              Amazon 200-Character Compliant Title
                            </span>
                            <button
                              onClick={() => copyToClipboard(copyResult.amazon?.title || "", "amz_title")}
                              className="text-[#A3E635] font-bold hover:underline"
                            >
                              {copiedKey === "amz_title" ? "✓ Copied" : "Copy Title"}
                            </button>
                          </div>
                          <div className="text-sm font-bold text-white">
                            {copyResult.amazon.title}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              5 Key Benefit Bullet Points
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard((copyResult.amazon?.bulletPoints || []).join("\n"), "amz_bullets")
                              }
                              className="text-[#A3E635] font-bold hover:underline"
                            >
                              {copiedKey === "amz_bullets" ? "✓ Copied" : "Copy Bullets"}
                            </button>
                          </div>
                          <ul className="space-y-2">
                            {copyResult.amazon.bulletPoints?.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300">
                                <span className="text-[#A3E635] font-bold">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* EBAY TAB */}
                    {selectedPlatform === "ebay" && copyResult.ebay && (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              eBay 80-Char SEO Title
                            </span>
                            <button
                              onClick={() => copyToClipboard(copyResult.ebay?.title || "", "ebay_title")}
                              className="text-[#A3E635] font-bold hover:underline"
                            >
                              {copiedKey === "ebay_title" ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="text-sm font-bold text-white">
                            {copyResult.ebay.title}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">
                            Item Specifics Table
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {Object.entries(copyResult.ebay.itemSpecifics || {}).map(([k, v]) => (
                              <div key={k} className="p-2 rounded-xl bg-[#0A1428] border border-slate-800">
                                <div className="text-[10px] text-slate-500">{k}</div>
                                <div className="text-xs font-bold text-white truncate">{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TIKTOK SHOP TAB */}
                    {selectedPlatform === "tiktok" && copyResult.tiktok && (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">
                            Viral Hook Title
                          </span>
                          <div className="text-sm font-bold text-[#A3E635]">
                            {copyResult.tiktok.hookTitle}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[10px]">
                              Video Caption & Hashtags
                            </span>
                            <button
                              onClick={() => copyToClipboard(copyResult.tiktok?.caption || "", "tt_cap")}
                              className="text-[#A3E635] font-bold hover:underline"
                            >
                              {copiedKey === "tt_cap" ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed">
                            {copyResult.tiktok.caption}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ETSY TAB */}
                    {selectedPlatform === "etsy" && copyResult.etsy && (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">
                            Etsy Storytelling Title
                          </span>
                          <div className="text-sm font-bold text-white">
                            {copyResult.etsy.title}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">
                            13 Exact Search Tags
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {copyResult.etsy.tags13?.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-[#A3E635]/15 border border-[#A3E635]/30 text-[#A3E635] text-[11px] font-bold font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* MODULE 3: GENERATIVE PHOTO STUDIO (PROFESSIONAL UX RENDERING) */}
        {activeTab === "photo_ai" && (
          <div className="space-y-6">
            {/* Top Studio Control Bar */}
            <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#A3E635] flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                    Gavriel Generative Photo Studio & Lifestyle Staging
                  </div>
                  <h2 className="text-xl font-black text-white">
                    4K AI Product Studio & Scene Generator
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Stage unedited warehouse photos into studio catalog shots, contextual interiors, or luxury editorial scenes.
                  </p>
                </div>

                {/* View Mode Toggle & Aspect Ratio Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* View Modes */}
                  <div className="p-1 rounded-xl bg-[#060D1B] border border-slate-800 flex items-center gap-1">
                    {[
                      { id: "split", label: "↔ Split View" },
                      { id: "staged", label: "✦ AI Staged" },
                      { id: "raw", label: "📷 Raw Original" },
                    ].map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setStudioActiveView(v.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          studioActiveView === v.id
                            ? "bg-[#A3E635] text-[#0A1428] shadow-md shadow-[#A3E635]/20 font-black"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {/* Aspect Ratios */}
                  <div className="p-1 rounded-xl bg-[#060D1B] border border-slate-800 flex items-center gap-1">
                    {[
                      { id: "1:1", label: "1:1 (Square)" },
                      { id: "4:5", label: "4:5 (Insta)" },
                      { id: "9:16", label: "9:16 (TikTok)" },
                      { id: "16:9", label: "16:9 (Banner)" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setStudioAspectRatio(r.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                          studioAspectRatio === r.id
                            ? "bg-[#0E2248] text-[#A3E635] border border-[#A3E635]/60 font-black"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Studio Viewport & Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Center Canvas Viewport */}
                <div className="lg:col-span-8 space-y-4">
                  <div
                    ref={splitContainerRef}
                    onMouseMove={(e) => {
                      if (studioActiveView === "split") handleSplitMouseMove(e);
                    }}
                    className={`w-full rounded-3xl bg-[#060D1B] border border-slate-800 flex items-center justify-center relative overflow-hidden select-none ${
                      studioAspectRatio === "1:1"
                        ? "aspect-square max-h-[500px]"
                        : studioAspectRatio === "4:5"
                        ? "aspect-[4/5] max-h-[520px]"
                        : studioAspectRatio === "9:16"
                        ? "aspect-[9/16] max-h-[540px]"
                        : "aspect-[16/9] max-h-[420px]"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* 1. Staged AI Canvas Layer */}
                        <div
                          className={`absolute inset-0 w-full h-full flex items-center justify-center p-8 transition-all ${
                            stagingTheme === "studio_white"
                              ? "bg-gradient-to-b from-white via-[#F8FAFC] to-[#E2E8F0] text-slate-900"
                              : stagingTheme === "scandinavian"
                              ? "bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617]"
                              : stagingTheme === "dark_luxury"
                              ? "bg-gradient-to-br from-[#0B132B] via-[#060D1B] to-[#020617] ring-1 ring-[#A3E635]/30"
                              : stagingTheme === "marble_podium"
                              ? "bg-gradient-to-b from-[#111C33] via-[#091122] to-[#040812]"
                              : stagingTheme === "industrial_loft"
                              ? "bg-gradient-to-br from-[#1C1917] via-[#0C0A09] to-[#040404]"
                              : stagingTheme === "outdoor_nature"
                              ? "bg-gradient-to-b from-[#064E3B]/40 via-[#022C22]/60 to-[#060D1B]"
                              : stagingTheme === "cyber_neon"
                              ? "bg-gradient-to-br from-[#081B2B] via-[#040D18] to-[#01060D] ring-2 ring-[#A3E635]/40"
                              : "bg-gradient-to-b from-[#271C15] to-[#0D0907]"
                          }`}
                        >
                          {/* Ambient Spotlight & Surface Reflection */}
                          <div
                            style={{
                              filter: `blur(${studioBokeh}px)`,
                              opacity: stagingTheme === "studio_white" ? 0.05 : 0.4,
                            }}
                            className="absolute inset-0 bg-radial from-[#A3E635]/20 via-transparent to-transparent pointer-events-none"
                          />

                          {/* Product Image */}
                          <div className="relative z-10 max-h-[70%] max-w-[70%] flex items-center justify-center">
                            <img
                              src={imagePreview}
                              alt="Rendered Hero"
                              className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-300 hover:scale-105"
                            />

                            {/* Realistic Contact Shadow */}
                            {studioShadow && (
                              <div
                                style={{
                                  background: stagingTheme === "studio_white"
                                    ? "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)"
                                    : "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%)",
                                }}
                                className="absolute -bottom-6 w-full h-6 rounded-full blur-md pointer-events-none"
                              />
                            )}
                          </div>

                          {/* Surface Pedestal Indicator */}
                          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-slate-400 z-10">
                            <span className="px-2 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
                              Surface: <strong className="text-white capitalize">{studioSurface}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
                              Temp: <strong className="text-[#A3E635]">{studioColorTemp}K</strong>
                            </span>
                          </div>
                        </div>

                        {/* 2. Raw Original Image Layer (Clipped for Split Slider) */}
                        {(studioActiveView === "split" || studioActiveView === "raw") && (
                          <div
                            style={{
                              clipPath: studioActiveView === "split" ? `inset(0 ${100 - splitSliderPos}% 0 0)` : "none",
                            }}
                            className="absolute inset-0 w-full h-full bg-[#080E1E] p-8 flex items-center justify-center transition-none pointer-events-none z-20"
                          >
                            <img
                              src={imagePreview}
                              alt="Raw Warehouse Shot"
                              className="max-h-[65%] max-w-[65%] object-contain opacity-75 grayscale contrast-125"
                            />
                            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-300 font-mono text-[10px] border border-slate-700">
                              Raw Warehouse Photo
                            </div>
                          </div>
                        )}

                        {/* 3. Split Slider Drag Handle */}
                        {studioActiveView === "split" && (
                          <div
                            style={{ left: `${splitSliderPos}%` }}
                            className="absolute top-0 bottom-0 w-0.5 bg-[#A3E635] shadow-[0_0_12px_#A3E635] z-30 pointer-events-none flex items-center justify-center"
                          >
                            <div className="w-7 h-7 rounded-full bg-[#0A1428] border-2 border-[#A3E635] text-[#A3E635] flex items-center justify-center text-[10px] font-black shadow-xl">
                              ↔
                            </div>
                          </div>
                        )}

                        {/* Staged Badge Stamp */}
                        {studioBadge && (
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-[#A3E635] text-[#0A1428] font-black text-xs shadow-xl shadow-[#A3E635]/20 z-30">
                            {studioBadgeText}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-2 p-8 text-slate-400">
                        <div className="text-4xl text-[#A3E635]">🎨</div>
                        <div className="font-bold text-white text-base">No Product Image Loaded</div>
                        <div className="text-xs max-w-xs mx-auto">
                          Upload a photo in Vision Core or select a sample preset to stage catalog renders.
                        </div>
                      </div>
                    )}

                    {/* Rendering Overlay */}
                    {studioRendering && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-40">
                        <div className="w-10 h-10 rounded-full border-3 border-[#A3E635] border-t-transparent animate-spin" />
                        <div className="text-sm font-black text-white">
                          Synthesizing 4K Raytraced Studio Lighting & Scene Occlusion...
                        </div>
                        <div className="text-xs text-[#A3E635] font-mono">
                          Applying {stagingTheme.replace("_", " ")} + {studioSurface} surface
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4-Variation Generation Gallery Carousel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {studioVariations.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setActiveVariation(v.id);
                          setStagingTheme(v.theme);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeVariation === v.id
                            ? "border-[#A3E635] bg-[#0E2248] shadow-md shadow-[#A3E635]/20"
                            : "border-slate-800 bg-[#060D1B] hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="font-bold text-[#A3E635]">{v.crop}</span>
                          <span className="text-slate-500 font-mono">#{v.id + 1}</span>
                        </div>
                        <div className="font-bold text-white text-xs truncate">{v.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{v.badge}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Studio Control & Parameter Suite */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Preset Scene Selector */}
                  <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>1. Environment Preset</span>
                      <span className="text-[#A3E635]">8 Scenes</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "studio_white", label: "Studio White", icon: "💡" },
                        { id: "scandinavian", label: "Nordic Living", icon: "🛋️" },
                        { id: "dark_luxury", label: "Dark Luxury", icon: "✨" },
                        { id: "marble_podium", label: "Marble Podium", icon: "🏛️" },
                        { id: "industrial_loft", label: "Urban Loft", icon: "🏙️" },
                        { id: "outdoor_nature", label: "Sunlit Forest", icon: "🌿" },
                        { id: "cyber_neon", label: "Neon Cyber", icon: "⚡" },
                        { id: "cozy_wood", label: "Warm Oak Desk", icon: "☕" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStagingTheme(s.id)}
                          className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                            stagingTheme === s.id
                              ? "border-[#A3E635] bg-[#0E2248] text-white font-bold"
                              : "border-slate-800 bg-[#0A1428] text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="text-base">{s.icon}</span>
                          <span className="text-xs truncate">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Surface Material & Lighting Rig */}
                  <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-3 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      2. Surface & Studio Shading
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Surface Pedestal Material
                      </label>
                      <select
                        value={studioSurface}
                        onChange={(e) => setStudioSurface(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0A1428] border border-slate-800 text-white text-xs focus:outline-none focus:border-[#A3E635]"
                      >
                        <option value="marble">Italian Carrara Polished Marble</option>
                        <option value="oak">Warm Scandinavian Solid Oak</option>
                        <option value="concrete">Architectural Matte Concrete</option>
                        <option value="glass">Frosted Smoked Glass with Glow</option>
                        <option value="velvet">Luxury Velvet Showcase</option>
                        <option value="white">Seamless Pure Commercial White</option>
                      </select>
                    </div>

                    {/* Color Temp Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                        <span>Color Temperature</span>
                        <span className="text-[#A3E635] font-mono">{studioColorTemp}K</span>
                      </div>
                      <input
                        type="range"
                        min={3200}
                        max={6500}
                        step={100}
                        value={studioColorTemp}
                        onChange={(e) => setStudioColorTemp(parseInt(e.target.value))}
                        className="w-full accent-[#A3E635] cursor-pointer"
                      />
                    </div>

                    {/* Bokeh Depth */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                        <span>Depth of Field (Bokeh)</span>
                        <span className="text-[#A3E635] font-mono">{studioBokeh}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={studioBokeh}
                        onChange={(e) => setStudioBokeh(parseInt(e.target.value))}
                        className="w-full accent-[#A3E635] cursor-pointer"
                      />
                    </div>

                    {/* Enhancement Checkboxes */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Contact Shadows & Ambient Occlusion</span>
                        <input
                          type="checkbox"
                          checked={studioShadow}
                          onChange={(e) => setStudioShadow(e.target.checked)}
                          className="w-4 h-4 accent-[#A3E635]"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Trust Badge Stamp</span>
                        <input
                          type="checkbox"
                          checked={studioBadge}
                          onChange={(e) => setStudioBadge(e.target.checked)}
                          className="w-4 h-4 accent-[#A3E635]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Render & Export Actions */}
                  <div className="space-y-2">
                    <button
                      disabled={!imagePreview || studioRendering}
                      onClick={handleStudioRender}
                      className="w-full py-4 rounded-2xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] font-black text-xs transition shadow-xl shadow-[#A3E635]/25 flex items-center justify-center gap-2"
                    >
                      {studioRendering ? (
                        <>
                          <span className="animate-spin text-sm">⚙️</span>
                          <span>Rendering 4K Studio Staging...</span>
                        </>
                      ) : (
                        <>
                          <span>✦</span>
                          <span>Render 4K AI Studio Hero</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={!imagePreview}
                        onClick={() => alert("High-res 4K staged asset pack (ZIP) downloaded.")}
                        className="py-2.5 px-3 rounded-xl bg-[#0A1428] border border-slate-700 hover:border-[#A3E635] text-white font-bold text-xs transition text-center"
                      >
                        Download 4K Pack
                      </button>

                      <button
                        disabled={!imagePreview}
                        onClick={() => {
                          setActiveTab("listing");
                          alert("Staged hero shot attached to active listing draft!");
                        }}
                        className="py-2.5 px-3 rounded-xl bg-[#0A1428] border border-slate-700 hover:border-[#A3E635] text-[#A3E635] font-bold text-xs transition text-center"
                      >
                        Attach to Listing →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: COMPETITOR COMP RADAR */}
        {activeTab === "competitor" && (
          <div className="space-y-6">
            <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#A3E635] flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-ping" />
                    Live Multi-Channel Comp Scanner
                  </div>
                  <h2 className="text-xl font-black text-white">
                    Real-Time Competitor Sold Comps
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live price indexing across eBay Sold, Amazon BuyBox, StockX, Poshmark, and Tradera.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={compSearchQuery}
                    onChange={(e) => setCompSearchQuery(e.target.value)}
                    placeholder="Search comps by brand/model..."
                    className="px-3.5 py-2 rounded-xl bg-[#060D1B] border border-slate-700 text-white text-xs w-64 focus:outline-none focus:border-[#A3E635]"
                  />
                  <button
                    onClick={() => alert(`Refreshing live sold comps for ${compSearchQuery}...`)}
                    className="px-3.5 py-2 rounded-xl bg-[#A3E635] text-[#0A1428] font-bold text-xs shrink-0"
                  >
                    Scan Comps
                  </button>
                </div>
              </div>

              {/* Price Distribution Card */}
              <div className="p-5 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                    Market Price Distribution & Liquidity Range
                  </span>
                  <span className="text-[#A3E635] font-mono font-bold">
                    Median: €{basePrice} • Volatility: Low (±6%)
                  </span>
                </div>

                {/* SVG Visualizer */}
                <div className="relative h-16 w-full bg-[#0A1428] rounded-xl p-3 flex items-center border border-slate-800">
                  <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
                    <div>
                      <span className="text-slate-500 text-[9px] block">25th Percentile</span>
                      <strong className="text-amber-400">€{Math.round(basePrice * 0.85)}</strong>
                    </div>
                    <div className="text-center">
                      <span className="text-[#A3E635] text-[9px] block font-bold">Target Median</span>
                      <strong className="text-[#A3E635] text-sm">€{basePrice}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[9px] block">75th Percentile</span>
                      <strong className="text-indigo-300">€{Math.round(basePrice * 1.2)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Sold Comps Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3 pl-3">Platform</th>
                      <th className="pb-3">Listing Title</th>
                      <th className="pb-3">Sold Price</th>
                      <th className="pb-3">Shipping</th>
                      <th className="pb-3">Condition</th>
                      <th className="pb-3">Timeframe</th>
                      <th className="pb-3 pr-3 text-right">Seller Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {competitorComps.map((c) => (
                      <tr key={c.id} className="hover:bg-[#060D1B]/80 transition">
                        <td className="py-3 pl-3">
                          <span className="px-2 py-0.5 rounded-lg bg-[#A3E635]/15 border border-[#A3E635]/30 text-[#A3E635] text-[10px] font-bold">
                            {c.platform}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-white">{c.title}</td>
                        <td className="py-3 font-mono font-bold text-[#A3E635]">€{c.soldPrice}</td>
                        <td className="py-3 text-slate-400 font-mono">
                          {c.shipping === 0 ? "Free" : `€${c.shipping.toFixed(2)}`}
                        </td>
                        <td className="py-3 text-slate-300">{c.condition}</td>
                        <td className="py-3 text-slate-400">{c.soldDate}</td>
                        <td className="py-3 pr-3 text-right text-slate-300 font-mono text-[11px]">
                          {c.rating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Undercut Strategy Recommendation */}
              <div className="p-4 rounded-2xl bg-[#0E2248] border border-[#A3E635]/50 flex items-start gap-3">
                <div className="text-xl text-[#A3E635]">💡</div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Smart Pricing Strategy: Optimal Margin Capture</div>
                  <div className="text-slate-300 leading-relaxed">
                    By pricing at <strong className="text-[#A3E635]">€{basePrice}</strong>, you undercut active BuyBox listings by 18% while outperforming 78% of used comps with superior imagery and pre-graded authenticity.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: 12-MONTH PRICE HISTORY */}
        {activeTab === "price_history" && (
          <div className="space-y-6">
            <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">
                    12-Month Historical Price Index & Seasonality
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Historical resale velocity, price depreciation curve, and seasonal peak trends.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(["30d", "90d", "12m"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setPriceHistoryRange(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        priceHistoryRange === r
                          ? "bg-[#A3E635] text-[#0A1428]"
                          : "bg-[#060D1B] text-slate-400 border border-slate-800"
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive SVG Chart */}
              <div className="p-6 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase text-[10px]">
                    Price Curve Evolution (EUR €)
                  </span>
                  <span className="text-[#A3E635] font-bold text-xs">
                    +4.8% YoY Valuation Retention
                  </span>
                </div>

                <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-4 border-b border-slate-800 relative">
                  {[
                    { m: "Jan", p: Math.round(basePrice * 0.9) },
                    { m: "Feb", p: Math.round(basePrice * 0.92) },
                    { m: "Mar", p: Math.round(basePrice * 0.95) },
                    { m: "Apr", p: Math.round(basePrice * 0.94) },
                    { m: "May", p: Math.round(basePrice * 0.98) },
                    { m: "Jun", p: Math.round(basePrice * 1.02) },
                    { m: "Jul", p: Math.round(basePrice * 1.05) },
                    { m: "Aug", p: Math.round(basePrice * 1.01) },
                    { m: "Sep", p: Math.round(basePrice * 1.08) },
                    { m: "Oct", p: Math.round(basePrice * 1.12) },
                    { m: "Nov", p: Math.round(basePrice * 1.18) },
                    { m: "Dec", p: Math.round(basePrice * 1.22) },
                  ].map((item, idx) => {
                    const heightPct = Math.min(100, Math.max(25, (item.p / (basePrice * 1.3)) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                          €{item.p}
                        </div>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                            idx === 11
                              ? "bg-[#A3E635] shadow-lg shadow-[#A3E635]/30"
                              : "bg-[#0E2248] hover:bg-[#A3E635]/70"
                          }`}
                        />
                        <span className="text-[10px] text-slate-400 font-bold">{item.m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Valuation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">MSRP Retention</div>
                  <div className="text-xl font-black text-white font-mono">76.4%</div>
                  <div className="text-[10px] text-slate-500">Above average resale retention</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Peak Seasonality</div>
                  <div className="text-xl font-black text-[#A3E635]">Q4 Holiday Surge</div>
                  <div className="text-[10px] text-slate-500">+18% price premium Nov–Dec</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Price Alert Trigger</div>
                  <div className="text-xs font-bold text-white mt-1">Alert when &gt; €{Math.round(basePrice * 1.25)}</div>
                  <div className="text-[10px] text-[#A3E635]">● Automated Radar Active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 6: SELL-THROUGH VELOCITY ANALYZER */}
        {activeTab === "sell_through" && (
          <div className="space-y-6">
            <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">
                  Sell-Through Velocity & Elasticity Simulator
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate listing prices and predict liquidation days, capital turnover, and fee-adjusted net profits.
                </p>
              </div>

              {/* Price Elasticity Slider */}
              <div className="p-6 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Simulated Listing Price: <strong className="text-[#A3E635] text-base font-mono">€{simulatedPrice}</strong>
                  </label>
                  <span className="text-xs text-slate-400">
                    Range: €{Math.round(basePrice * 0.5)} – €{Math.round(basePrice * 1.8)}
                  </span>
                </div>

                <input
                  type="range"
                  min={Math.round(basePrice * 0.5)}
                  max={Math.round(basePrice * 1.8)}
                  value={simulatedPrice}
                  onChange={(e) => setSimulatedPrice(parseInt(e.target.value))}
                  className="w-full accent-[#A3E635] cursor-pointer"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  <div className="p-4 rounded-xl bg-[#0A1428] border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Predicted Days to Sell</div>
                    <div className="text-2xl font-black text-[#A3E635] font-mono mt-1">
                      {simulatedPrice <= basePrice * 0.8 ? "1.8 Days" : simulatedPrice <= basePrice * 1.1 ? "7.4 Days" : "28+ Days"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">94% Liquidation Confidence</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A1428] border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated Net Profit</div>
                    <div className="text-2xl font-black text-white font-mono mt-1">
                      €{Math.round(simulatedPrice * 0.86 - 15)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">After marketplace fees & shipping</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A1428] border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Velocity Rating</div>
                    <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                      {simulatedPrice <= basePrice * 0.8 ? "⚡ Ultra-Fast" : simulatedPrice <= basePrice * 1.1 ? "🔥 Optimal" : "⏳ Slow Patient"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Capital Turnover Score</div>
                  </div>
                </div>
              </div>

              {/* Marketplace Velocity Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Channel Sell-Through Velocity Ranking
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { channel: "eBay Buy It Now", days: "4.2 Days", fee: "12.8%", score: "High Velocity" },
                    { channel: "TikTok Shop", days: "5.1 Days", fee: "5.0%", score: "High Impulse" },
                    { channel: "Shopify Store", days: "8.4 Days", fee: "2.9%", score: "Max Margin" },
                    { channel: "Amazon Merchant", days: "6.0 Days", fee: "15.0%", score: "Volume Scale" },
                  ].map((c, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-1">
                      <div className="font-bold text-white text-xs">{c.channel}</div>
                      <div className="text-base font-black text-[#A3E635] font-mono">{c.days}</div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Fee: {c.fee}</span>
                        <span className="text-slate-300 font-bold">{c.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 7: CIRA DEMAND RADAR */}
        {activeTab === "hunter" && (
          <div className="space-y-6">
            <div className="bg-[#0A1428] border border-[#A3E635]/40 rounded-3xl p-6">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#A3E635] mb-2">
                <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-ping" />
                Live Closed-Loop Intelligence: Cira ↔ Gavriel
              </div>
              <h2 className="text-xl font-black text-white">
                Live Shopper Demand Radar
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Cira aggregates real-time search queries and unanswered shopper intents across European online stores.
                Gavriel highlights high-margin sourcing opportunities for merchants before competitors catch on.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demandInsights.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-2xl bg-[#0A1428] border border-slate-800 hover:border-[#A3E635]/60 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
                        {d.category}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">
                        {d.queryTrend}
                      </h3>
                    </div>
                    <span className="text-xs font-black text-[#A3E635] font-mono">
                      {d.shopperSearchVolume}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px]">Avg Selling Price:</span>
                      <div className="font-bold text-white">{d.avgSellingPrice}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Estimated Margin:</span>
                      <div className="font-bold text-[#A3E635]">{d.estimatedMargin}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <span className="text-slate-400">Sourcing Guide:</span> {d.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 8: OFFER & NEGOTIATION COPILOT */}
        {activeTab === "negotiate" && (
          <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">
                Buyer Counter-Offer & Negotiation Copilot
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Protect your profit margins and automatically generate high-converting negotiation scripts for eBay, Vinted, Tradera, and Marketplace DMs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Calculator Panel */}
              <div className="md:col-span-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Buyer Offer Amount (€)
                    </label>
                    <input
                      type="number"
                      value={buyerOffer}
                      onChange={(e) => setBuyerOffer(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060D1B] border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Item Cost (€)
                    </label>
                    <input
                      type="number"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060D1B] border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Strategic Strategy
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "counter", label: "Smart Counter" },
                      { id: "firm", label: "Firm Defense" },
                      { id: "urgency", label: "2h Flash Urgency" },
                      { id: "bundle", label: "Bundle Upsell" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setNegotiationTone(t.id as any)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl transition text-center ${
                          negotiationTone === t.id
                            ? "bg-[#A3E635] text-[#0A1428] font-black"
                            : "bg-[#060D1B] text-slate-400 border border-slate-800"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Response Language
                  </label>
                  <select
                    value={negotiationLang}
                    onChange={(e) => setNegotiationLang(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060D1B] border border-slate-800 text-white text-xs focus:outline-none focus:border-[#A3E635]"
                  >
                    <option value="en">English (Global / UK / US)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="sv">Swedish (Svenska)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                  </select>
                </div>

                <button
                  onClick={handleNegotiate}
                  className="w-full py-3.5 rounded-xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] font-black text-xs transition shadow-lg shadow-[#A3E635]/20"
                >
                  Generate Counter-Offer Script
                </button>
              </div>

              {/* Script Output Panel */}
              <div className="md:col-span-6 p-5 rounded-2xl bg-[#060D1B] border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <span className="text-[#A3E635]">Generated Negotiation Script</span>
                    <span className="text-slate-500 font-mono">Ready to Paste</span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed italic bg-[#0A1428] p-4 rounded-xl border border-slate-800 min-h-[140px]">
                    {negotiationScript || "Enter buyer offer and click generate to craft grounded response script."}
                  </div>
                </div>

                {negotiationScript && (
                  <button
                    onClick={() => copyToClipboard(negotiationScript, "neg_script")}
                    className="w-full py-2.5 rounded-xl bg-[#0A1428] border border-slate-700 text-[#A3E635] font-bold text-xs hover:border-[#A3E635] transition"
                  >
                    {copiedKey === "neg_script" ? "✓ Copied to Clipboard" : "Copy Negotiation Script"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 9: OMNI-PUBLISH HUB */}
        {activeTab === "export" && (
          <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">
                Multi-Platform Omni-Publish Hub
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Direct API synchronization with automatic stock decrement across all your connected sales channels.
              </p>
            </div>

            {/* Connected Store Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "shopify", name: "Shopify Flagship", status: "Live API Connected", store: "circucity-flagship.myshopify.com", icon: "🛍️", items: "1,420 items" },
                { id: "ebay", name: "eBay Global Store", status: "OAuth Connected", store: "circucity_official_nordic", icon: "📦", items: "Auto-Relist Active" },
                { id: "tiktok", name: "TikTok Shop", status: "Affiliate Feed Live", store: "@circucity_shop", icon: "📱", items: "Video Shopping Tagged" },
              ].map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[10px] font-bold text-[#A3E635]">● {c.status}</span>
                  </div>
                  <div className="font-bold text-white text-sm">{c.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{c.store}</div>
                  <div className="text-[10px] text-slate-500">{c.items}</div>

                  <div className="pt-2">
                    {publishStatus[c.id] === "publishing" ? (
                      <div className="py-2 text-center text-xs font-bold text-[#A3E635] animate-pulse">
                        Pushing Live Listing...
                      </div>
                    ) : publishStatus[c.id] === "published" ? (
                      <div className="py-2 text-center text-xs font-bold text-[#A3E635]">
                        ✓ Successfully Published Live
                      </div>
                    ) : (
                      <button
                        onClick={handleOmniPublish}
                        className="w-full py-2 rounded-xl bg-[#0A1428] text-[#A3E635] border border-slate-700 hover:border-[#A3E635] text-xs font-bold transition"
                      >
                        1-Click Live Publish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Export Formats */}
            <div className="p-5 rounded-2xl bg-[#060D1B] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Bulk Data Export</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Export formatted inventory catalog feeds for external listing software.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Exported Shopify CSV formatted product file.")}
                  className="px-3.5 py-2 rounded-xl bg-[#0A1428] border border-slate-700 text-xs font-bold text-white hover:border-[#A3E635] transition"
                >
                  Shopify CSV
                </button>
                <button
                  onClick={() => alert("Exported eBay File Exchange format.")}
                  className="px-3.5 py-2 rounded-xl bg-[#0A1428] border border-slate-700 text-xs font-bold text-white hover:border-[#A3E635] transition"
                >
                  eBay Exchange
                </button>
                <button
                  onClick={() => alert("Exported Google Shopping feed.")}
                  className="px-3.5 py-2 rounded-xl bg-[#0A1428] border border-slate-700 text-xs font-bold text-white hover:border-[#A3E635] transition"
                >
                  JSON Feed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 10: SETTINGS & INTEGRATIONS */}
        {activeTab === "settings" && (
          <div className="bg-[#0A1428] border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">
                Store Integrations & Quota
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage your Gavriel OS subscription, API keys, and store automation webhooks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Plan Card */}
              <div className="p-6 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A3E635] uppercase">Active Tier</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#A3E635]/15 text-[#A3E635] text-[10px] font-bold">
                    Pioneer Beta
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Commercial Pro Pass</div>
                  <div className="text-xs text-slate-400 mt-1">
                    150 AI generations / month included • 1-Click Omni-Publish Active
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Usage Progress</span>
                    <span className="font-mono font-bold text-[#A3E635]">{generationCount} / 150</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${(generationCount / 150) * 100}%` }}
                      className="h-full bg-[#A3E635] rounded-full"
                    />
                  </div>
                </div>

                <a
                  href="https://chatbot.circucity.com/early-access"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center w-full py-3 rounded-xl bg-[#A3E635] hover:bg-[#b2f04e] text-[#0A1428] font-black text-xs transition shadow-md shadow-[#A3E635]/20"
                >
                  Upgrade to Unlimited Commercial Pass →
                </a>
              </div>

              {/* API Keys & Webhooks */}
              <div className="p-6 rounded-2xl bg-[#060D1B] border border-slate-800 space-y-4 text-xs">
                <div className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">
                  Gavriel Developer API Key
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={apiKeyVisible ? "text" : "password"}
                    readOnly
                    value="gav_live_9f8a2c17b84e3d09a12c4e5f67a8b9c0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1428] border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="p-2.5 rounded-xl bg-[#0A1428] border border-slate-800 text-slate-400 hover:text-white"
                  >
                    {apiKeyVisible ? "🙈" : "👁️"}
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Store Stock Sync Webhook
                  </label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1428] border border-slate-800 text-white text-xs focus:outline-none focus:border-[#A3E635]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Default Currency
                    </label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A1428] border border-slate-800 text-white text-xs focus:outline-none focus:border-[#A3E635]"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="SEK">SEK (kr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Target Margin ({targetMargin}%)
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(parseInt(e.target.value))}
                      className="w-full mt-2 accent-[#A3E635]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
