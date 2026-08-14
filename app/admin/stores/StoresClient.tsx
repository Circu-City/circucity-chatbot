"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Store, ChevronLeft, ChevronRight, Edit3, Trash2, RefreshCw, Plus, Save, X } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  url: string | null;
  status: string;
  industry: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
  subscriptions: { plan: string; status: string }[];
  _count: { products: number; conversations: number };
}

interface PaginatedResult {
  stores: StoreItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function StoresClient({ initialData }: { initialData: PaginatedResult }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", status: "", industry: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", userId: "", url: "", industry: "" });
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users?limit=100").then(r => r.json()).then(d => {
      if (d.success) setUsers(d.data?.users || []);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async (page: number, searchTerm?: string, status?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (searchTerm) params.set("search", searchTerm);
    if (status && status !== "all") params.set("status", status);
    const res = await fetch(`/api/admin/stores?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const handleSearch = () => fetchData(1, search, statusFilter);

  const openEdit = (store: StoreItem) => {
    setEditingStore(store);
    setEditForm({ name: store.name, status: store.status, industry: store.industry || "" });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingStore) return;
    setLoading(true);
    const res = await fetch(`/api/admin/stores/${editingStore.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setShowEditModal(false);
      setEditingStore(null);
      fetchData(data.page, search, statusFilter);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this store? All associated data will be lost.")) return;
    setLoading(true);
    await fetch(`/api/admin/stores/${id}`, { method: "DELETE" });
    setLoading(false);
    fetchData(data.page, search, statusFilter);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.userId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setCreateForm({ name: "", userId: "", url: "", industry: "" });
        fetchData(1, search, statusFilter);
      }
    } catch {}
    setCreating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "inactive": return "bg-amber-100 text-amber-700";
      case "suspended": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <Store className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Create Store</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Store Name *</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Owner *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.userId} onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}>
                  <option value="">Select user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">URL</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.url} onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Industry</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.industry} onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !createForm.name || !createForm.userId}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {creating ? "Creating..." : "Create Store"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStore && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <Store className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Edit Store</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Store Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Industry</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleUpdate} disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">
                  {loading ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stores Management</h2>
          <p className="text-sm text-slate-500">{data.total} total stores</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Plus className="w-4 h-4" /> Create Store
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by store name or URL..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
        </div>
        <select className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchData(1, search, e.target.value); }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={handleSearch} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Products</th>
                <th className="px-6 py-3 text-center">Conversations</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <Link href={"/admin/stores/" + store.id} className="text-sm font-medium text-slate-900 hover:text-emerald-600 transition-colors">{store.name}</Link>
                      {store.url && <p className="text-xs text-slate-400">{store.url}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{store.user.name || store.user.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                      {store.subscriptions[0]?.plan || "free"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(store.status)}`}>
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 text-center">{store._count.products}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 text-center">{store._count.conversations}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(store.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(store)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(store.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.stores.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">No stores found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {data.page} of {data.totalPages} ({data.total} total)</span>
            <div className="flex gap-1">
              <button disabled={data.page <= 1}
                onClick={() => fetchData(data.page - 1, search, statusFilter)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button disabled={data.page >= data.totalPages}
                onClick={() => fetchData(data.page + 1, search, statusFilter)}
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