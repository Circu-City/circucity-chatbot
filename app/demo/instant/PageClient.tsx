"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles, Bot, ArrowRight, Zap, CheckCircle2, ShieldCheck,
  Search, PhoneCall, TrendingUp, RefreshCw, Play, ArrowLeft, Layers
} from "lucide-react";

export default function InstantDemoPage() {
  const [storeUrl, setStoreUrl] = useState("");
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeUrl.trim()) return;

    setIsScanning(true);
    setScanProgress(15);

    const interval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const res = await fetch("/api/demo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: storeUrl, email }),
      });
      const data = await res.json();
      clearInterval(interval);
      setScanProgress(100);

      if (data.success) {
        setScanResult(data);
      }
    } catch (err) {
      clearInterval(interval);
      alert("Scan failed. Please check the URL.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060D1A] text-white flex flex-col justify-between">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between backdrop-blur-lg bg-[#060D1A]/80 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lemon-green animate-pulse" />
            <span className="text-sm font-bold tracking-wide">
              CircuCity <span className="text-lemon-green">Instant Commerce Simulator</span>
            </span>
          </div>
        </div>

        <Link
          href="/sign-up"
          className="px-4 py-1.5 rounded-xl bg-lemon-gradient text-dark-navy text-xs font-bold flex items-center gap-1.5 shadow-lemon hover:opacity-90"
        >
          <span>Start Free Trial</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col justify-center items-center">
        {!scanResult ? (
          <div className="w-full text-center space-y-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lemon-green/10 border border-lemon-green/30 text-lemon-green text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> 30-Second Instant Storefront Scanner
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                See Your Store as a <br />
                <span className="text-lemon-green">Live Commerce Map</span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
                Paste your store URL below. CircuCity will map your products, detect immediate revenue bottlenecks, and activate Cira with your live catalog in 30 seconds.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={startScan} className="max-w-xl mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="e.g. gymshark.com, yourbrand.myshopify.com"
                  className="flex-1 px-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lemon-green font-mono"
                />
                <button
                  type="submit"
                  disabled={isScanning}
                  className="px-6 py-3.5 bg-lemon-gradient text-dark-navy font-bold rounded-2xl hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2 shadow-lemon active:scale-95 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning Store…</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Scan My Store</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar */}
              {isScanning && (
                <div className="space-y-1.5 pt-2">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-lemon-gradient transition-all duration-300 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-lemon-green font-mono">
                    Indexing catalog SKUs • Calculating conversion bottlenecks • Initializing Cira Brain…
                  </p>
                </div>
              )}
            </form>

            {/* Quick Demo Pre-fills */}
            <div className="pt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-gray-500">
              <span>Try with demo store:</span>
              {["gymshark.com", "allbirds.com", "kith.com"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStoreUrl(s)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-lemon-green/40 hover:text-white transition-colors font-mono text-[11px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Scan Results Dashboard */
          <div className="w-full space-y-6 animate-fadeIn">
            {/* Success Summary Header */}
            <div className="bg-gradient-to-tr from-[#0A1428] to-[#1E293B] border border-lemon-green/40 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lemon-green font-mono block mb-1">
                    Store Map Complete • {scanResult.domain}
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {scanResult.storeName} Commerce Operating Map
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/call"
                    className="px-6 py-3 bg-lemon-gradient text-dark-navy font-bold rounded-2xl shadow-lemon hover:opacity-90 flex items-center gap-2 text-sm transition-all"
                  >
                    <PhoneCall className="w-4 h-4 fill-current" />
                    <span>Call Cira with Scanned Catalog</span>
                  </Link>
                </div>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Products Indexed</span>
                  <p className="text-2xl font-bold text-white font-mono">{scanResult.productsIndexed}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Revenue Leaks</span>
                  <p className="text-2xl font-bold text-amber-400 font-mono">{scanResult.opportunitiesFound}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Projected Revenue Lift</span>
                  <p className="text-2xl font-bold text-lemon-green font-mono">{scanResult.potentialRevenueLift}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Cira Voice Status</span>
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready for Live Calls
                  </p>
                </div>
              </div>
            </div>

            {/* Mapped Nodes Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-lemon-green" /> Immediate Actionable Bottlenecks Detected
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scanResult.nodes?.map((n: any) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-gray-400">{n.type}</span>
                      <span className="text-xs font-bold text-lemon-green font-mono">
                        €{n.revenuePotential?.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{n.label}</h4>
                    {n.data?.reason && (
                      <p className="text-xs text-gray-400 leading-relaxed">{n.data.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rescan or Go to Map */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => setScanResult(null)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-medium"
              >
                ← Scan another storefront
              </button>

              <Link
                href="/revenue-map"
                className="text-xs text-lemon-green hover:underline flex items-center gap-1 font-bold"
              >
                Open Full Interactive Revenue Map →
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-white/10 text-center text-xs text-gray-500">
        CircuCity Autonomous Commerce Operating System • Zero Per-Minute Voice Fees • On-Prem Speech (Kokoro + Whisper)
      </footer>
    </div>
  );
}
