"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, Key, ChevronLeft, ChevronRight, Trash2, Plus, X, Copy, Check } from "lucide-react";

interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  permissions: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  store: { id: string; name: string; user: { email: string } };
}

interface PaginatedResult {
  keys: ApiKeyItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface StoreOption {
  id: string;
  name: string;
}

export default function ApiKeysClient({ initialData }: { initialData: PaginatedResult }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [formStoreId, setFormStoreId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPermissions, setFormPermissions] = useState("read");
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (showCreate) {
      fetch("/api/admin/stores?limit=200")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setStores(j.data.stores.map((s: any) => ({ id: s.id, name: s.name })));
        })
        .catch(() => {});
    }
  }, [showCreate]);

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/api-keys?page=${page}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Revoke this API key? This will break integrations using it.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) fetchData(data.page);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formStoreId || !formName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: formStoreId, name: formName.trim(), permissions: formPermissions }),
      });
      const json = await res.json();
      if (json.success) {
        setCreatedKey(json.data);
        fetchData(data.page);
      }
    } catch {}
    setCreating(false);
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      try {
        await navigator.clipboard.writeText(createdKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setCreatedKey(null);
    setFormStoreId("");
    setFormName("");
    setFormPermissions("read");
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseCreate}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-900">{createdKey ? "API Key Created" : "Create API Key"}</h3>
              <button onClick={handleCloseCreate} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            {createdKey ? (
              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-emerald-800 mb-1">Key created successfully!</p>
                  <p className="text-xs text-emerald-600">Copy this key now. You won&apos;t be able to see it again.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <p className="text-sm font-medium text-slate-900">{createdKey.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded-lg text-slate-700 font-mono break-all select-all">
                      {createdKey.key}
                    </code>
                    <button onClick={handleCopyKey}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 flex items-center gap-1 shrink-0">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopyKey}
                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4" /> Copy Key
                  </button>
                  <button onClick={handleCloseCreate}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                    value={formStoreId} onChange={(e) => setFormStoreId(e.target.value)}>
                    <option value="">Select a store...</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <input type="text" placeholder="e.g. Production API Key"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                    value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Permissions</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                    value={formPermissions} onChange={(e) => setFormPermissions(e.target.value)}>
                    <option value="read">Read-only</option>
                    <option value="write">Read & Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}
            {!createdKey && (
              <div className="flex justify-end gap-2 p-6 border-t border-gray-100">
                <button onClick={handleCloseCreate}
                  className="px-4 py-2.5 border border-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={creating || !formStoreId || !formName.trim()}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1">
                  {creating ? "Creating..." : "Create Key"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">API Keys</h2>
          <p className="text-sm text-slate-500">{data.total} total API keys</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Key</th>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3">Last Used</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.keys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{k.name}</td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-slate-600 font-mono">
                      {k.key.substring(0, 16)}...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{k.store.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{k.permissions}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteKey(k.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-red-500 transition-colors" title="Revoke">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.keys.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No API keys found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={data.page <= 1} onClick={() => fetchData(data.page - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button disabled={data.page >= data.totalPages} onClick={() => fetchData(data.page + 1)}
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