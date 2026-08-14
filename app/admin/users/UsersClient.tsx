"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, UserCog } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: Date;
  emailVerified: Date | null;
  stores: { id: string; name: string; status: string }[];
}

interface PaginatedResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UsersClient({ initialData }: { initialData: PaginatedResult }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");

  const fetchData = useCallback(async (page: number, searchTerm?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (searchTerm) params.set("search", searchTerm);
    const res = await fetch(`/api/admin/users?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, []);

  const handleSearch = () => {
    fetchData(1, search);
    router.push(`/admin/users?search=${encodeURIComponent(search)}`);
  };

  const handleCreate = async () => {
    setError("");
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      fetchData(data.page, search);
    } else {
      setError(json.error || "Failed to create user");
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setError("");
    setLoading(true);
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      fetchData(data.page, search);
    } else {
      setError(json.error || "Failed to update user");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setLoading(false);
    fetchData(data.page, search);
  };

  const handleImpersonate = async (userId: string, email: string) => {
    if (!confirm(`Login as ${email}? You will be able to act as this user (as an admin).`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();

      if (json.success) {
        window.location.href = "/dashboard";
      } else {
        alert(json.error || "Failed to impersonate user");
      }
    } catch (err) {
      alert("Failed to impersonate user");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name || "", email: user.email, password: "", role: user.role });
    setError("");
    setShowEditModal(true);
  };

  const Modal = ({ title, onClose, onSubmit, isEdit }: { title: string; onClose: () => void; onSubmit: () => void; isEdit: boolean }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-6">
          <UserCog className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email *</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password *</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {showCreateModal && <Modal title="Create User" onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} isEdit={false} />}
      {showEditModal && <Modal title="Edit User" onClose={() => setShowEditModal(false)} onSubmit={handleUpdate} isEdit={true} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Users Management</h2>
          <p className="text-sm text-slate-500">{data.total} total users</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", email: "", password: "", role: "customer" });
            setError("");
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Stores</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{user.name || "Unnamed"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.stores.length}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleImpersonate(user.id, user.email)} 
                        className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-purple-600 transition-colors" 
                        title="Login as this user"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(user)} className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {data.page} of {data.totalPages} ({data.total} total)
            </span>
            <div className="flex gap-1">
              <button
                disabled={data.page <= 1}
                onClick={() => fetchData(data.page - 1, search)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                disabled={data.page >= data.totalPages}
                onClick={() => fetchData(data.page + 1, search)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}