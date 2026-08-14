"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Package, ChevronLeft, ChevronRight, Edit3, Trash2, Save, X, Plus, Store } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  stock: number | null;
  isActive: boolean;
  currency: string;
  createdAt: Date;
  store: { id: string; name: string; user: { email: string } };
}

interface PaginatedResult {
  products: ProductItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ProductsClient({ initialData }: { initialData: PaginatedResult }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: 0, description: "", category: "", stock: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", price: 0, description: "", category: "", stock: 0, storeId: "" });
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stores?limit=100").then(r => r.json()).then(d => {
      if (d.success) setStores(d.data?.stores || []);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async (page: number, searchTerm?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (searchTerm) params.set("search", searchTerm);
    const res = await fetch(`/api/admin/products?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const handleUpdate = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingProduct(null);
      fetchData(data.page, search);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setLoading(false);
    fetchData(data.page, search);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.storeId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setCreateForm({ name: "", price: 0, description: "", category: "", stock: 0, storeId: "" });
        fetchData(1, search);
      }
    } catch {}
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Products Management</h2>
          <p className="text-sm text-slate-500">{data.total} total products</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Plus className="w-4 h-4" /> Create Product
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData(1, search)} />
        </div>
        <button onClick={() => fetchData(1, search)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          Search
        </button>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create Product</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name *</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Store *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={createForm.storeId} onChange={(e) => setCreateForm({ ...createForm, storeId: e.target.value })}>
                    <option value="">Select store...</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stock</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={createForm.stock} onChange={(e) => setCreateForm({ ...createForm, stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none" rows={2}
                  value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !createForm.name || !createForm.storeId}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {creating ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingProduct(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stock</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="isActive" className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
                    checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none" rows={2}
                  value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdate} disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">Stock</th>
                <th className="px-6 py-3 text-center">Active</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.store.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">{p.currency} {p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.category || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 text-center">{p.stock ?? "-"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingProduct(p); setEditForm({ name: p.name, price: p.price, description: p.description || "", category: p.category || "", stock: p.stock ?? 0, isActive: p.isActive }); }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.products.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={data.page <= 1} onClick={() => fetchData(data.page - 1, search)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button disabled={data.page >= data.totalPages} onClick={() => fetchData(data.page + 1, search)}
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