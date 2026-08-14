"use client";

import React, { useState, useCallback } from "react";
import { Search, CreditCard, ChevronLeft, ChevronRight, Edit3, Clock, XCircle } from "lucide-react";
import { extendSubscription, cancelSubscription } from "@/lib/actions/admin";

interface SubItem {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  stripeId: string | null;
  createdAt: Date;
  store: { id: string; name: string; user: { name: string | null; email: string } };
}

interface PaginatedResult {
  subscriptions: SubItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SubscriptionsClient({ initialData }: { initialData: PaginatedResult }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editSub, setEditSub] = useState<SubItem | null>(null);
  const [editForm, setEditForm] = useState({ plan: "", status: "", currentPeriodEnd: "" });

  const fetchData = useCallback(async (page: number, plan?: string, status?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (plan && plan !== "all") params.set("plan", plan);
    if (status && status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/subscriptions?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const handleUpdate = async () => {
    if (!editSub) return;
    setLoading(true);

    const payload: any = { plan: editForm.plan, status: editForm.status };
    if (editForm.currentPeriodEnd) {
      payload.currentPeriodEnd = editForm.currentPeriodEnd;
    }

    const res = await fetch(`/api/admin/subscriptions/${editSub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setEditSub(null);
      fetchData(data.page, planFilter, statusFilter);
    }
  };

  const handleExtend30Days = async (sub: SubItem) => {
    if (!confirm(`Extend subscription for ${sub.store.name} by 30 days?`)) return;
    setLoading(true);
    try {
      await extendSubscription(sub.id, 30);
      fetchData(data.page, planFilter, statusFilter);
    } catch (err: any) {
      alert(err.message || "Failed to extend subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithReason = async (sub: SubItem) => {
    const reason = prompt(`Cancel subscription for ${sub.store.name}?\n\nEnter cancellation reason:`);
    if (!reason) return;

    setLoading(true);
    try {
      await cancelSubscription(sub.id, reason);
      fetchData(data.page, planFilter, statusFilter);
    } catch (err: any) {
      alert(err.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "canceled": return "bg-red-100 text-red-700";
      case "past_due": return "bg-amber-100 text-amber-700";
      case "trialing": return "bg-blue-100 text-blue-700";
      case "incomplete": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {editSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditSub(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Edit Subscription</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="trialing">Trialing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Period End Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={editForm.currentPeriodEnd ? new Date(editForm.currentPeriodEnd).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, currentPeriodEnd: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to keep current date</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditSub(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdate} disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">
                  {loading ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Subscriptions</h2>
          <p className="text-sm text-slate-500">{data.total} total subscriptions</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); fetchData(1, e.target.value, statusFilter); }}>
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchData(1, planFilter, e.target.value); }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past Due</option>
          <option value="trialing">Trialing</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Period End</th>
                <th className="px-6 py-3">Stripe ID</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{sub.store.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{sub.store.user.name || sub.store.user.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{sub.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(sub.status)}`}>{sub.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "-"}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">{sub.stripeId ? sub.stripeId.substring(0, 20) + "..." : "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleExtend30Days(sub)} 
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-blue-600 transition-colors" 
                      title="Extend 30 days">
                      <Clock className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleCancelWithReason(sub)} 
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-red-600 transition-colors" 
                      title="Cancel with reason">
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => { 
                      setEditSub(sub); 
                      setEditForm({ 
                        plan: sub.plan, 
                        status: sub.status,
                        currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString().split('T')[0] : ''
                      }); 
                    }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.subscriptions.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No subscriptions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={data.page <= 1} onClick={() => fetchData(data.page - 1, planFilter, statusFilter)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button disabled={data.page >= data.totalPages} onClick={() => fetchData(data.page + 1, planFilter, statusFilter)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}