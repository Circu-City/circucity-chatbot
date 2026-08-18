'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
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
  Clock,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bot,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/lib/actions/auth';

type Tab = 'overview' | 'referrals' | 'commissions' | 'payouts' | 'settings';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [partner, setPartner] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/partner');
      const data = await res.json();
      if (!data.success) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      setPartner(data.data.partner);
      setConfig(data.data.config);

      if (data.data.partner) {
        const [refRes, comRes, payRes] = await Promise.all([
          fetch('/api/client/partner/referrals'),
          fetch('/api/client/partner/commissions'),
          fetch('/api/client/partner/payouts'),
        ]);
        const refData = await refRes.json();
        const comData = await comRes.json();
        const payData = await payRes.json();
        if (refData.success) setReferrals(refData.data);
        if (comData.success) {
          setCommissions(comData.data);
          setCommissionSummary(comData.summary);
        }
        if (payData.success) setPayouts(payData.data);
      }
    } catch {
      setAuthError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copyReferralLink = () => {
    const link = origin + '/?ref=' + (partner?.referralCode || '');
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async () => {
    setPayoutError('');
    setPayoutSuccess('');
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      setPayoutError('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/client/partner/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, notes: '' }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutSuccess('Payout of $' + amount.toFixed(2) + ' requested successfully');
        setShowRequestPayout(false);
        setPayoutAmount('');
        fetchAll();
      } else {
        setPayoutError(data.error || 'Failed to request payout');
      }
    } catch {
      setPayoutError('Failed to request payout');
    }
    setSaving(false);
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch('/api/client/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) setPartner(json.data);
    } catch {}
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': case 'paid': case 'approved': case 'completed': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-amber-400 bg-amber-500/20';
      case 'clicked': return 'text-blue-400 bg-blue-500/20';
      case 'converted': return 'text-lemon-green bg-lemon-green/20';
      case 'cancelled': case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
    { id: 'payouts', label: 'Payouts', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const balance = partner?.totalEarned || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1428] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#A3E635]" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#0A1428] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Not Signed In</h1>
          <p className="text-gray-400 mb-6">You need to sign in to access the partner dashboard.</p>
          <Link
            href="/sign-in?redirect=/partner/dashboard"
            className="inline-flex items-center gap-2 bg-[#A3E635] text-[#0A1428] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#8DC92E] transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1428]">
      {/* Top nav */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 bg-[#0A1428]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#A3E635] rounded-lg flex items-center justify-center">
              <Bot className="text-[#0A1428] w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">Partner Program</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            CircuCity AI
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        {/* Partner status badge */}
        {partner && (
          <div className="mb-6">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold', statusColor(partner.status))}>
              <span className={cn('w-1.5 h-1.5 rounded-full', partner.status === 'active' ? 'bg-green-400' : 'bg-amber-400')} />
              {partner.status.toUpperCase()}
            </span>
          </div>
        )}

        {!partner ? (
          <div className="text-center py-20">
            <Handshake className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-white mb-3">No Partner Account Found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You don't have a partner account linked to your user. Apply to join the program.
            </p>
            <Link
              href="/partners/apply"
              className="inline-flex items-center gap-2 bg-[#A3E635] text-[#0A1428] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#8DC92E] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Apply Now
            </Link>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0',
                    activeTab === tab.id
                      ? 'bg-[#A3E635] text-[#0A1428]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Wallet className="w-4 h-4" /> Available Balance
                    </div>
                    <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <DollarSign className="w-4 h-4" /> Total Earned
                    </div>
                    <p className="text-2xl font-bold text-[#A3E635]">${(partner.totalEarned || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <MousePointerClick className="w-4 h-4" /> Clicks
                    </div>
                    <p className="text-2xl font-bold text-white">{partner.clickCount || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" /> Conversion Rate
                    </div>
                    <p className="text-2xl font-bold text-white">{partner.conversionRate || 0}%</p>
                  </div>
                </div>

                {/* Referral link card */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Your Referral Link</p>
                      <p className="text-white font-mono text-sm break-all">
                        {origin}/?ref={partner.referralCode}
                      </p>
                    </div>
                    <button onClick={copyReferralLink} className="bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shrink-0">
                      {copied ? <Check className="w-4 h-4 text-[#A3E635]" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Recent commissions */}
                <div className="bg-white/5 rounded-xl border border-white/5">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-white font-bold text-lg">Recent Commissions</h3>
                  </div>
                  <div className="p-4">
                    {commissions.length === 0 ? (
                      <p className="text-gray-500 text-sm">No commissions yet. Share your referral link to start earning.</p>
                    ) : (
                      <div className="space-y-3">
                        {commissions.slice(0, 5).map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div>
                              <p className="text-white text-sm font-medium">{c.description || 'Referral commission'}</p>
                              <p className="text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#A3E635] font-bold">+${c.amount.toFixed(2)}</span>
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', statusColor(c.status))}>{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Referrals */}
            {activeTab === 'referrals' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Your Referral Link</p>
                      <p className="text-white font-mono text-sm break-all">{origin}/?ref={partner.referralCode}</p>
                    </div>
                    <button onClick={copyReferralLink} className="bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shrink-0">
                      {copied ? <Check className="w-4 h-4 text-[#A3E635]" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/5">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-white font-bold text-lg">Referral History</h3>
                  </div>
                  <div className="p-4">
                    {referrals.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-500">No referrals yet. Start sharing your link!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 text-gray-400 font-medium">Email</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Name</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Source</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {referrals.map((r: any) => (
                              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 text-white">{r.referredEmail || '-'}</td>
                                <td className="py-3 text-gray-400">{r.referredName || '-'}</td>
                                <td className="py-3 text-gray-400">{r.source || 'direct'}</td>
                                <td className="py-3">
                                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', statusColor(r.status))}>{r.status}</span>
                                </td>
                                <td className="py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Commissions */}
            {activeTab === 'commissions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                      <Clock className="w-4 h-4" /> Pending
                    </div>
                    <p className="text-2xl font-bold text-white">${(commissionSummary?.pending || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Approved
                    </div>
                    <p className="text-2xl font-bold text-white">${(commissionSummary?.approved || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-[#A3E635] text-sm mb-1">
                      <DollarSign className="w-4 h-4" /> Paid
                    </div>
                    <p className="text-2xl font-bold text-[#A3E635]">${(commissionSummary?.paid || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/5">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-white font-bold text-lg">All Commissions</h3>
                  </div>
                  <div className="p-4">
                    {commissions.length === 0 ? (
                      <p className="text-gray-500 text-sm">No commissions recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 text-gray-400 font-medium">Description</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {commissions.map((c: any) => (
                              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 text-white">{c.description || '-'}</td>
                                <td className="py-3 text-[#A3E635] font-bold">${c.amount.toFixed(2)}</td>
                                <td className="py-3">
                                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', statusColor(c.status))}>{c.status}</span>
                                </td>
                                <td className="py-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payouts */}
            {activeTab === 'payouts' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Available Balance</p>
                      <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setShowRequestPayout(!showRequestPayout)}
                      className="bg-[#A3E635] text-[#0A1428] px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#8DC92E] transition-all flex items-center gap-2"
                      disabled={balance < (config?.minPayout || 50)}
                    >
                      <Plus className="w-4 h-4" />
                      Request Payout
                    </button>
                  </div>
                  {balance < (config?.minPayout || 50) && (
                    <p className="text-amber-400 text-xs mt-2">Minimum payout is ${(config?.minPayout || 50)}</p>
                  )}
                </div>

                {showRequestPayout && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
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
                        <input
                          type="number"
                          step="0.01"
                          min={config?.minPayout || 50}
                          max={balance}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder={'Min $' + (config?.minPayout || 50)}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/40"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleRequestPayout} disabled={saving} className="bg-[#A3E635] text-[#0A1428] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#8DC92E] transition-all">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                          Submit Request
                        </button>
                        <button onClick={() => { setShowRequestPayout(false); setPayoutError(''); setPayoutSuccess(''); }} className="text-gray-400 hover:text-white px-4 py-2 text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white/5 rounded-xl border border-white/5">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-white font-bold text-lg">Payout History</h3>
                  </div>
                  <div className="p-4">
                    {payouts.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-500">No payouts yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Method</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                              <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payouts.map((p: any) => (
                              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 text-white font-bold">${p.amount.toFixed(2)}</td>
                                <td className="py-3 text-gray-400 capitalize">{p.paymentMethod?.replace(/_/g, ' ') || '-'}</td>
                                <td className="py-3">
                                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', statusColor(p.status))}>{p.status}</span>
                                </td>
                                <td className="py-3 text-gray-400">{new Date(p.requestedAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div className="bg-white/5 rounded-xl border border-white/5 p-6">
                <form onSubmit={handleSettingsSave} className="space-y-6 max-w-lg">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Partner Type</label>
                    <select name="type" defaultValue={partner.type} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50">
                      <option value="affiliate">Global Sales Partner</option>
                      <option value="agency">Agency</option>
                      <option value="ambassador">Ambassador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Payment Email</label>
                    <input name="paymentEmail" type="email" defaultValue={partner.paymentEmail || ''} placeholder="payments@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Payment Method</label>
                    <select name="paymentMethod" defaultValue={partner.paymentMethod || 'bank_transfer'} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50">
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Tax Info (optional)</label>
                    <input name="taxInfo" defaultValue={partner.taxInfo || ''} placeholder="Tax ID / VAT number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Website (optional)</label>
                    <input name="website" type="url" defaultValue={partner.website || ''} placeholder="https://yourwebsite.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Bio / Description</label>
                    <textarea name="bio" rows={3} defaultValue={partner.bio || ''} placeholder="Tell us about yourself..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50 resize-none" />
                  </div>
                  <button type="submit" disabled={saving} className="bg-[#A3E635] text-[#0A1428] px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#8DC92E] transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                    Save Settings
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
