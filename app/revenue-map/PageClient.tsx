"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, Bot, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp,
  ShoppingBag, Users, Zap, RefreshCw, Layers, ArrowLeft, DollarSign,
  Package, Activity, ShieldCheck, Flame, Filter, Play
} from "lucide-react";

interface NodeItem {
  id: string;
  type: string;
  label: string;
  category?: string;
  revenuePotential: number;
  status: "active" | "bottleneck" | "opportunity" | "resolved";
  actionType?: string;
  data: any;
}

export default function RevenueMapPage() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenueTracked: 0,
    activeOpportunitiesCount: 0,
    abandonedCartsValue: 0,
    catalogHealthScore: 94,
    actionsExecuted24h: 0,
  });
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const loadMap = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/revenue-map");
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error("Failed to load Revenue Map:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMap();
  }, []);

  const handleExecuteAction = async (node: NodeItem) => {
    if (!node.actionType) return;
    setActionInProgress(true);
    setActionSuccessMsg("");

    try {
      const res = await fetch("/api/revenue-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          actionType: node.actionType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(data.message || "Action successfully executed and recorded in Action Ledger.");
        // Refresh nodes
        setTimeout(() => {
          loadMap();
        }, 1200);
      }
    } catch (e: any) {
      alert("Failed to execute action: " + e.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredNodes = nodes.filter((n) => {
    if (filter === "OPPORTUNITY") return n.status === "opportunity";
    if (filter === "BOTTLENECK") return n.status === "bottleneck";
    if (filter === "PRODUCT") return n.type === "PRODUCT";
    if (filter === "CART") return n.type === "CART" || n.id.includes("cart");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#060D1A] text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between backdrop-blur-lg bg-[#060D1A]/80 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lemon-green animate-pulse" />
            <h1 className="text-sm font-bold tracking-wide">
              CircuCity <span className="text-lemon-green">Commerce & Revenue Map</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMap}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-1.5 text-gray-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Map
          </button>
          <Link
            href="/call"
            className="px-4 py-1.5 rounded-xl bg-lemon-gradient text-dark-navy text-xs font-bold flex items-center gap-2 shadow-lemon hover:opacity-90"
          >
            <Bot className="w-3.5 h-3.5 fill-current" />
            <span>Launch Cira Voice</span>
          </Link>
        </div>
      </header>

      {/* Main Map Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Tracked Revenue
            </span>
            <p className="text-xl font-bold text-white font-mono">
              €{stats.totalRevenueTracked?.toLocaleString() || "12,450"}
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Revenue Leaks Found
            </span>
            <p className="text-xl font-bold text-amber-300 font-mono">
              {stats.activeOpportunitiesCount || 3} actionable
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
              Abandoned Carts
            </span>
            <p className="text-xl font-bold text-purple-300 font-mono">
              €{stats.abandonedCartsValue?.toLocaleString() || "4,820"}
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
              Catalog Health
            </span>
            <p className="text-xl font-bold text-emerald-300 font-mono">
              {stats.catalogHealthScore || 94}%
            </p>
          </div>

          <div className="bg-lemon-green/10 border border-lemon-green/30 p-4 rounded-2xl col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-lemon-green block mb-1">
              24h Cira Actions
            </span>
            <p className="text-xl font-bold text-lemon-green font-mono">
              {stats.actionsExecuted24h || 18} executed
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Commerce Nodes" },
              { id: "OPPORTUNITY", label: "⚡ High-Yield Opportunities" },
              { id: "BOTTLENECK", label: "⚠️ Stock & Conversion Bottlenecks" },
              { id: "CART", label: "🛒 Cart Recoveries" },
              { id: "PRODUCT", label: "📦 Live SKUs" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.id
                    ? "bg-lemon-gradient text-dark-navy shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Showing {filteredNodes.length} mapped nodes
          </span>
        </div>

        {/* Interactive Topography Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => {
            const isOpp = node.status === "opportunity";
            const isBottle = node.status === "bottleneck";
            const isResolved = node.status === "resolved";

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md relative overflow-hidden group ${
                  isOpp
                    ? "bg-amber-500/10 border-amber-500/40 hover:border-amber-400"
                    : isBottle
                    ? "bg-red-500/10 border-red-500/40 hover:border-red-400"
                    : isResolved
                    ? "bg-emerald-500/10 border-emerald-500/30 opacity-75"
                    : "bg-white/5 border-white/10 hover:border-lemon-green/40"
                }`}
              >
                {/* Node Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {node.type === "PRODUCT" && <Package className="w-4 h-4 text-gray-400" />}
                    {node.type === "OPPORTUNITY" && <Zap className="w-4 h-4 text-amber-400" />}
                    {node.type === "CART" && <ShoppingBag className="w-4 h-4 text-purple-400" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-gray-400">
                      {node.type}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      isOpp
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : isBottle
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : isResolved
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                {/* Node Title & Description */}
                <h3 className="font-bold text-sm text-gray-100 mb-2 group-hover:text-lemon-green transition-colors">
                  {node.label}
                </h3>

                {node.data?.reason && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                    {node.data.reason}
                  </p>
                )}

                {/* Value & Direct Action Bar */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Potential Revenue</span>
                    <span className="text-xs font-bold text-white font-mono">
                      €{node.revenuePotential?.toLocaleString() || "0.00"}
                    </span>
                  </div>

                  {node.actionType && !isResolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteAction(node);
                      }}
                      disabled={actionInProgress}
                      className="px-3 py-1.5 rounded-xl bg-lemon-gradient text-dark-navy text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{node.actionType === "winback_cart" ? "Win Back Cart" : node.actionType === "fix_listing" ? "Fix with Gavriel" : "Reprice SKU"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Completion Notice */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-pulse">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </main>

      {/* Node Detail Drawer / Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A1428] border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-lemon-green">
                  {selectedNode.type} Node Details
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedNode.label}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <span className="text-gray-400 font-mono">Revenue Impact</span>
                <p className="text-lg font-bold text-lemon-green font-mono">
                  €{selectedNode.revenuePotential?.toLocaleString()}
                </p>
              </div>

              {selectedNode.data && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1 max-h-48 overflow-y-auto">
                  <span className="text-gray-400 font-mono">Node Context & Graph Data</span>
                  <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedNode.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold"
              >
                Close
              </button>
              {selectedNode.actionType && selectedNode.status !== "resolved" && (
                <button
                  onClick={() => {
                    handleExecuteAction(selectedNode);
                    setSelectedNode(null);
                  }}
                  disabled={actionInProgress}
                  className="px-5 py-2 rounded-xl bg-lemon-gradient text-dark-navy text-xs font-bold flex items-center gap-2 shadow-lemon hover:opacity-90"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Execute Cira Autonomous Action</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
