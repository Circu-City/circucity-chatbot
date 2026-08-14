"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminGetOrganizations, adminDeleteOrganization } from "@/lib/actions/organization";
import { Building2, Plus, Search, Trash2, MoreHorizontal, Users, Globe, X, Save } from "lucide-react";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", ownerEmail: "", plan: "free" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminGetOrganizations(p, 20, s || undefined);
      setOrgs(res.organizations);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, search); }, [page, search, load]);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.ownerEmail) return;
    setCreating(true);
    setError("");
    try {
      const { adminCreateOrganization } = await import("@/lib/actions/organization");
      await adminCreateOrganization(createForm);
      setShowCreateModal(false);
      setCreateForm({ name: "", ownerEmail: "", plan: "free" });
      load(page, search);
    } catch (e: any) {
      setError(e.message || "Failed to create organization");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this organization and all its workspaces?")) return;
    try {
      await adminDeleteOrganization(id);
      load(page, search);
    } catch (e: any) {
      setError(e.message || "Delete failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-gray-400 text-sm mt-1">Manage multi-tenant organizations</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Plus className="w-4 h-4" /> Create Organization
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Organization</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-1">Workspaces</div>
              <div className="col-span-1">Members</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1"></div>
            </div>
            {orgs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No organizations found</div>
            ) : (
              orgs.map((org: any) => (
                <div key={org.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-0 items-center hover:bg-white/[0.02]">
                  <div className="col-span-3">
                    <Link href={`/admin/organizations/${org.id}`} className="font-medium text-emerald-400 hover:underline">
                      {org.name}
                    </Link>
                    <div className="text-xs text-gray-500">{org.slug}</div>
                  </div>
                  <div className="col-span-2 text-sm">
                    {org.owner?.name || org.owner?.email || "—"}
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-400/10 text-emerald-400 capitalize">
                      {org.plan}
                    </span>
                  </div>
                  <div className="col-span-1 text-sm">{org.workspaces?.length || 0}</div>
                  <div className="col-span-1 text-sm">{org._count?.members || 0}</div>
                  <div className="col-span-2 text-sm text-gray-400">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-1 flex gap-1">
                    <button onClick={() => handleDelete(org.id)} className="p-1.5 hover:bg-red-500/10 rounded text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${page === i + 1 ? "bg-emerald-400 text-slate-900" : "bg-white/5 hover:bg-white/10"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create Organization</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Organization Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Owner Email</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.ownerEmail} onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })} placeholder="owner@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={createForm.plan} onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !createForm.name || !createForm.ownerEmail}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
