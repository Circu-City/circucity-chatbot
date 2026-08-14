"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Download,
  ShieldCheck,
  Loader2,
  PartyPopper,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans-config";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}

export default function Billing({ paymentSuccess }: { paymentSuccess?: boolean }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [dismissSuccess, setDismissSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setFetchError(true);
        setLoading(false);
      }
    }, 15000);

    Promise.all([
      fetch("/api/client/subscription").then(r => r.ok ? r.json() : { success: false }),
      fetch("/api/client/store").then(r => r.ok ? r.json() : { success: false }),
      fetch("/api/client/analytics").then(r => r.ok ? r.json() : { success: false }),
      fetch("/api/stripe/invoices").then(r => r.ok ? r.json() : { success: false }),
      fetch("/api/stripe/payment-method").then(r => r.ok ? r.json() : { success: false }),
    ]).then(([sub, storeRes, analyticsRes, inv, pm]) => {
      if (sub.success) setSubscription(sub.data);
      if (storeRes.success) setStore(storeRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (inv.success) setInvoices(inv.data || []);
      if (pm.success) setPaymentMethod(pm.data);
    }).catch(() => {
      setFetchError(true);
    }).finally(() => {
      setLoading(false);
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async (planName: string) => {
    const plan = PLANS.find(p => p.name === planName);
    if (!plan || !plan.href) return;
    setCheckoutLoading(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = plan.href;
      }
    } catch {
      window.location.href = plan.href;
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      window.location.href = "/contact";
    } finally {
      setPortalLoading(false);
    }
  };

  const rawPlan = (subscription?.plan || "free").toLowerCase();
  const planNameMap: Record<string, string> = { free: "starter" };
  const currentPlan = planNameMap[rawPlan] || rawPlan;
  const currentPlanMeta = PLANS.find(p => p.name.toLowerCase() === currentPlan) || PLANS[0];
  const isFreePlan = currentPlan === "starter" && (currentPlanMeta?.price === 0);
  const nextRenewal = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { 
        month: "long", 
        day: "numeric", 
        year: "numeric" 
      })
    : isFreePlan ? "No renewal (free plan)" : "N/A";

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-slate-600 text-sm">Failed to load billing data. Please try again.</p>
          <Button variant="outline" onClick={() => { setFetchError(false); setLoading(true); window.location.reload(); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {paymentSuccess && !dismissSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PartyPopper className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Payment successful!</p>
                  <p className="text-xs text-emerald-600">Your subscription has been updated.</p>
                </div>
              </div>
              <button onClick={() => setDismissSuccess(true)} className="text-emerald-500 hover:text-emerald-700 text-xl leading-none shrink-0 ml-3">&times;</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-dark-navy">Billing & Plans</h2>
              <p className="text-muted-foreground text-sm">Manage your subscription and payment methods.</p>
            </div>
            <Button variant="outline" className="flex items-center gap-2 shrink-0" onClick={() => openPortal()}>
              <Download className="w-4 h-4" />
              Stripe Portal
            </Button>
          </div>

          <div className="p-5 bg-dark-navy text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex items-center gap-3 z-10">
              <div className="p-2.5 bg-primary rounded-xl shrink-0">
                <Zap className="w-5 h-5 text-dark-navy" />
              </div>
              <div>
                <p className="text-primary font-semibold text-[11px] uppercase tracking-wider">Current Plan</p>
                <h3 className="text-lg font-bold capitalize mt-0.5">{isFreePlan ? "Free" : currentPlanMeta?.name} Plan</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 z-10 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <p className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">Renewal</p>
                <p className="text-sm font-medium">{nextRenewal}</p>
              </div>
              <Button variant="outline" onClick={() => openPortal()} disabled={portalLoading} className="shrink-0 text-sm">
                {portalLoading ? "Opening..." : "Manage"}
              </Button>
            </div>
          </div>

          {/* Plans */}
          <div>
            <h3 className="text-base font-bold text-dark-navy mb-3">Plans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PLANS.map((plan, i) => {
                const isCurrent = plan.name.toLowerCase() === currentPlan;
                return (
                  <div key={i} className={cn(
                    "flex flex-col rounded-xl p-4 sm:p-5 border transition-all duration-200",
                    isCurrent
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-white shadow-sm hover:shadow-md hover:border-gray-300"
                  )}>
                    {isCurrent && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Current Plan
                      </div>
                    )}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-dark-navy">{plan.name}</h3>
                      <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed line-clamp-2">{plan.description}</p>
                    </div>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-dark-navy">
                        {plan.price === 0 ? "Free" : plan.priceLabel}
                      </span>
                      {plan.price !== null && plan.price > 0 && <span className="text-muted-foreground text-xs ml-0.5">/mo</span>}
                    </div>
                    <div className="space-y-2 mb-5 flex-1">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant={isCurrent ? "outline" : "primary"} 
                      className="w-full text-sm h-10" 
                      disabled={isCurrent || checkoutLoading === plan.name}
                      onClick={() => handleSubscribe(plan.name)}
                    >
                      {checkoutLoading === plan.name ? "Redirecting..." : 
                       isCurrent ? "Active Plan" : 
                       plan.price === null ? "Contact Sales" :
                       "Choose " + plan.name}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-dark-navy" />
                  <h3 className="font-semibold text-dark-navy text-sm">Payment Method</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openPortal()} disabled={portalLoading} className="text-xs">
                  {portalLoading ? "Opening..." : "Update"}
                </Button>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-border text-sm">
                {paymentMethod ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 bg-dark-navy rounded flex items-center justify-center text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                        {paymentMethod.brand?.toUpperCase().slice(0,4) || "CARD"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-navy">{paymentMethod.brand} ending in {paymentMethod.last4}</p>
                        <p className="text-xs text-muted-foreground">Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openPortal()} disabled={portalLoading}>Edit</Button>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <div className="w-10 h-7 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-[9px] font-bold uppercase mx-auto mb-2">CARD</div>
                    <p className="text-sm text-muted-foreground mb-1">No card on file</p>
                    <p className="text-xs text-muted-foreground mb-3">Your card will be saved after your first paid checkout. You can also add one now.</p>
                    <Button onClick={() => openPortal()} disabled={portalLoading} size="sm">
                      {portalLoading ? "Opening..." : "Add Card"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 border-border shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldCheck className="w-4 h-5 text-dark-navy" />
                <h3 className="font-semibold text-dark-navy text-sm">Plan Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-border text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-dark-navy capitalize">{isFreePlan ? "Free" : currentPlan}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-border text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200 capitalize text-xs font-medium">
                    {subscription?.status || "Active"}
                  </Badge>
                </div>
                <Button onClick={() => openPortal()} disabled={portalLoading} className="w-full mt-1 text-sm">
                  {portalLoading ? "Opening..." : "Manage in Stripe"}
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-5 border-border shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <Zap className="w-4 h-5 text-dark-navy" />
              <h3 className="font-semibold text-dark-navy text-sm">Usage This Period</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground">Messages Used</p>
                <p className="text-xl font-bold text-dark-navy mt-1">{analytics?.totalMessages?.toLocaleString() || "0"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">this month</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="text-sm font-medium mt-1">
                  {subscription?.currentPeriodEnd 
                    ? `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : "N/A"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-border flex items-center">
                <p className="text-xs text-muted-foreground">Usage-based billing coming soon. Plans are fixed monthly.</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-5 text-dark-navy" />
                <h3 className="font-semibold text-dark-navy text-sm">Invoice History</h3>
              </div>
              {invoices.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => openPortal()} className="text-xs">
                  View All in Portal
                </Button>
              )}
            </div>
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 pr-4 font-medium">Invoice</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Amount</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30">
                        <td className="py-3 pr-4 font-medium text-dark-navy text-sm">{inv.number || inv.id.slice(0,12)}</td>
                        <td className="py-3 pr-4 text-muted-foreground text-sm">
                          {new Date(inv.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 pr-4 font-medium text-sm">{inv.amount} {inv.currency}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={inv.status === "paid" ? "primary" : "outline"} className="capitalize text-xs font-medium">{inv.status}</Badge>
                        </td>
                        <td className="py-3 text-right text-sm">
                          {inv.hostedUrl && <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mr-3 text-xs">View</a>}
                          {inv.pdfUrl && <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">PDF</a>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No invoices yet. They will appear here after your first paid subscription.
              </div>
            )}
          </Card>
        </>
      )}
    </Wrapper>
  );
}
