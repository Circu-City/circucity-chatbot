"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Handshake,
  Copy,
  Check,
  Users,
  DollarSign,
  MousePointerClick,
  TrendingUp,
  Wallet,
  Settings,
  ExternalLink,
  Loader2,
  Plus,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Globe,
  Mail,
  CreditCard,
} from "lucide-react";

type Tab = "overview" | "referrals" | "commissions" | "payouts" | "settings";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 max-w-full overflow-hidden">
      {children}
    </div>
  );
}

export default function PartnerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [partner, setPartner] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [partnerRes, referralsRes, commissionsRes, payoutsRes] = await Promise.all([
        fetch("/api/client/partner"),
        fetch("/api/client/partner/referrals"),
        fetch("/api/client/partner/commissions"),
        fetch("/api/client/partner/payouts"),
      ]);
      const partnerData = await partnerRes.json();
      const referralsData = await referralsRes.json();
      const commissionsData = await commissionsRes.json();
      const payoutsData = await payoutsRes.json();

      if (partnerData.success) {
        setPartner(partnerData.data.partner);
        setConfig(partnerData.data.config);
      }
      if (referralsData.success) setReferrals(referralsData.data);
      if (commissionsData.success) {
        setCommissions(commissionsData.data);
        setCommissionSummary(commissionsData.summary);
      }
      if (payoutsData.success) setPayouts(payoutsData.data);
    } catch (e) {
      console.error("Failed to fetch partner data", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copyReferralLink = () => {
    const link = origin + "/?ref=" + (partner?.referralCode || "");
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    router.push("/partners/apply");
  };

  const handleRequestPayout = async () => {
    setPayoutError("");
    setPayoutSuccess("");
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      setPayoutError("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/client/partner/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, notes: "" }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutSuccess("Payout of $" + amount.toFixed(2) + " requested successfully");
        setShowRequestPayout(false);
        setPayoutAmount("");
        fetchAll();
      } else {
        setPayoutError(data.error || "Failed to request payout");
      }
    } catch (e) {
      setPayoutError("Failed to request payout");
    }
    setSaving(false);
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("/api/client/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setPartner(json.data);
      }
    } catch (e) {}
    setSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "referrals", label: "Referrals", icon: Users },
    { id: "commissions", label: "Commissions", icon: DollarSign },
    { id: "payouts", label: "Payouts", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case "active": case "paid": case "approved": case "completed": return "text-green-400 bg-green-500/20";
      case "pending": return "text-amber-400 bg-amber-500/20";
      case "clicked": return "text-blue-400 bg-blue-500/20";
      case "converted": return "text-lemon-green bg-lemon-green/20";
      case "cancelled": case "failed": return "text-red-400 bg-red-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  const balance = partner?.availableBalance || 0;

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lemon-gradient/15 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-lemon-green" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-navy">Partner Program</h2>
                <p className="text-xs text-gray-500">Refer businesses & earn commissions</p>
              </div>
            </div>
            {partner && (
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider self-start", statusColor(partner?.status || ''))}>
                <span className={cn("w-1.5 h-1.5 rounded-full", partner?.status === 'active' ? 'bg-green-400' : 'bg-amber-400')} />
                {partner?.status}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex gap-0 -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 shrink-0",
                    activeTab === tab.id
                      ? "text-lemon-green border-lemon-green"
                      : "text-gray-500 border-transparent hover:text-dark-navy hover:border-gray-400"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {!partner && (
            <Card className="bg-dark-navy border-white/10">
              <CardContent className="p-8 text-center">
                <Handshake className="w-16 h-16 mx-auto mb-4 text-lemon-green opacity-50" />
                <h2 className="text-xl font-bold text-white mb-2">Join the Partner Program</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Earn commissions by referring other businesses to CircuCity AI.
                </p>
                <Button onClick={handleJoin} className="bg-lemon-gradient text-dark-navy font-bold shadow-lemon hover:opacity-90 gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "overview" && partner && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Wallet className="w-4 h-4" /> Available Balance
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${balance.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <DollarSign className="w-4 h-4" /> Total Earned
                    </div>
                    <p className="text-2xl font-bold text-lemon-green">${(partner.totalEarned || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <MousePointerClick className="w-4 h-4" /> Clicks
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{partner.clickCount || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" /> Conversion Rate
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{partner.conversionRate || 0}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Your Referral Link</p>
                      <p className="text-gray-900 font-mono text-sm break-all">
                        {origin}/?ref={partner.referralCode}
                      </p>
                    </div>
                    <Button onClick={copyReferralLink} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 gap-2 shrink-0">
                      {copied ? <Check className="w-4 h-4 text-lemon-green" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Recent Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {commissions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No commissions yet. Share your referral link to start earning.</p>
                  ) : (
                    <div className="space-y-3">
                      {commissions.slice(0, 5).map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{c.description || "Referral commission"}</p>
                            <p className="text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lemon-green font-bold">+${c.amount.toFixed(2)}</span>
                            <Badge className={cn("text-[10px] font-bold border-0", statusColor(c.status))}>{c.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "referrals" && partner && (
            <div className="space-y-4">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Your Referral Link</p>
                      <p className="text-gray-900 font-mono text-sm break-all">
                        {origin}/?ref={partner.referralCode}
                      </p>
                    </div>
                    <Button onClick={copyReferralLink} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 gap-2 shrink-0">
                      {copied ? <Check className="w-4 h-4 text-lemon-green" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Referral History</CardTitle>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-500">No referrals yet. Start sharing your link!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 text-gray-400 font-medium">Email</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Name</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Source</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referrals.map((r: any) => (
                            <tr key={r.id} className="border-b border-gray-100 hover:bg-white/5">
                              <td className="py-3 text-white">{r.referredEmail || "-"}</td>
                              <td className="py-3 text-gray-400">{r.referredName || "-"}</td>
                              <td className="py-3 text-gray-400">{r.source || "direct"}</td>
                              <td className="py-3">
                                <Badge className={cn("text-[10px] font-bold border-0", statusColor(r.status))}>{r.status}</Badge>
                              </td>
                              <td className="py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "commissions" && partner && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                      <Clock className="w-4 h-4" /> Pending
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${(commissionSummary?.pending || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Approved
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${(commissionSummary?.approved || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-lemon-green text-sm mb-1">
                      <DollarSign className="w-4 h-4" /> Paid
                    </div>
                    <p className="text-2xl font-bold text-lemon-green">${(commissionSummary?.paid || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">All Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {commissions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No commissions recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 text-gray-400 font-medium">Description</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Paid At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commissions.map((c: any) => (
                            <tr key={c.id} className="border-b border-gray-100 hover:bg-white/5">
                              <td className="py-3 text-white">{c.description || "-"}</td>
                              <td className="py-3 text-lemon-green font-bold">${c.amount.toFixed(2)}</td>
                              <td className="py-3">
                                <Badge className={cn("text-[10px] font-bold border-0", statusColor(c.status))}>{c.status}</Badge>
                              </td>
                              <td className="py-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 text-gray-400">{c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "payouts" && partner && (
            <div className="space-y-4">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Available Balance</p>
                      <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={() => setShowRequestPayout(!showRequestPayout)}
                      className="bg-lemon-gradient text-dark-navy font-bold shadow-lemon hover:opacity-90 gap-2"
                      disabled={balance < (config?.minPayout || 50)}
                    >
                      <Plus className="w-4 h-4" />
                      Request Payout
                    </Button>
                  </div>
                  {balance < (config?.minPayout || 50) && (
                    <p className="text-amber-400 text-xs mt-2">Minimum payout is ${(config?.minPayout || 50)}</p>
                  )}
                </CardContent>
              </Card>

              {showRequestPayout && (
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-white font-bold mb-4">Request a Payout</h3>
                    {payoutSuccess && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg mb-4 text-sm">{payoutSuccess}</div>
                    )}
                    {payoutError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{payoutError}</div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Amount (USD)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min={config?.minPayout || 50}
                          max={balance}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder={"Min $" + (config?.minPayout || 50)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleRequestPayout} disabled={saving} className="bg-lemon-gradient text-dark-navy font-bold shadow-lemon hover:opacity-90">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Submit Request
                        </Button>
                        <Button onClick={() => { setShowRequestPayout(false); setPayoutError(""); setPayoutSuccess(""); }} variant="ghost" className="text-gray-400 hover:text-white">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payouts.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-500">No payouts yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Method</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Requested</th>
                            <th className="text-left py-3 text-gray-400 font-medium">Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payouts.map((p: any) => (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-white/5">
                              <td className="py-3 text-white font-bold">${p.amount.toFixed(2)}</td>
                              <td className="py-3 text-gray-400 capitalize">{p.paymentMethod?.replace(/_/g, " ") || "-"}</td>
                              <td className="py-3">
                                <Badge className={cn("text-[10px] font-bold border-0", statusColor(p.status))}>{p.status}</Badge>
                              </td>
                              <td className="py-3 text-gray-400">{new Date(p.requestedAt).toLocaleDateString()}</td>
                              <td className="py-3 text-gray-400">{p.completedAt ? new Date(p.completedAt).toLocaleDateString() : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && partner && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <form onSubmit={handleSettingsSave} className="space-y-6 max-w-lg">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Partner Type</label>
                    <select name="type" defaultValue={partner.type} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lemon-green/50">
                      <option value="affiliate">Affiliate</option>
                      <option value="agency">Agency</option>
                      <option value="ambassador">Ambassador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Payment Email</label>
                    <Input name="paymentEmail" type="email" defaultValue={partner.paymentEmail || ""} placeholder="payments@example.com" className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Payment Method</label>
                    <select name="paymentMethod" defaultValue={partner.paymentMethod || "bank_transfer"} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lemon-green/50">
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Tax Info (optional)</label>
                    <Input name="taxInfo" defaultValue={partner.taxInfo || ""} placeholder="Tax ID / VAT number" className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Website (optional)</label>
                    <Input name="website" type="url" defaultValue={partner.website || ""} placeholder="https://yourwebsite.com" className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Bio / Description (optional)</label>
                    <textarea
                      name="bio"
                      rows={3}
                      defaultValue={partner.bio || ""}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lemon-green/50 resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="bg-lemon-gradient text-dark-navy font-bold shadow-lemon hover:opacity-90">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Wrapper>
  );
}
