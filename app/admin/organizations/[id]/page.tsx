"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminGetOrganizationById, adminUpdateOrganization } from "@/lib/actions/organization";
import Link from "next/link";
import { ArrowLeft, Save, Globe, Bot, MessageCircle, BarChart3, Key } from "lucide-react";

export default function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", plan: "free", status: "active" });

  useEffect(() => {
    async function load() {
      try {
        const data = await adminGetOrganizationById(id);
        if (!data) { setError("Organization not found"); return; }
        setOrg(data);
        setForm({ name: data.name, plan: data.plan, status: data.status });
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateOrganization(id, form);
      setError("");
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (error && !org) return <div className="p-6 text-red-400">{error}</div>;
  if (!org) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/admin/organizations")} className="p-2 hover:bg-white/5 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-gray-400 text-sm">{org.slug}</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4">{error}</div>}

      {/* Organization Info */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Plan</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400/50"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Owner: {org.owner?.name || org.owner?.email} | Members: {org.members?.length || 0}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-300 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Workspaces */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Workspaces ({org.workspaces?.length || 0})</h2>
        {org.workspaces?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No workspaces yet</div>
        ) : (
          <div className="space-y-3">
            {org.workspaces.map((ws: any) => (
              <div key={ws.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-medium">{ws.name}</div>
                    <div className="text-xs text-gray-500">
                      {ws.websiteUrl || "No URL"} | {ws._count?.products || 0} products | {ws._count?.conversations || 0} convos
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${ws.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-yellow-400/10 text-yellow-400"}`}>
                    {ws.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400">
                    {ws.subscriptions?.[0]?.plan || "free"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Team Members ({org.members?.length || 0})</h2>
        {org.members?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No team members</div>
        ) : (
          <div className="space-y-2">
            {org.members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {(m.user?.name || m.user?.email || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{m.user?.name || "—"}</div>
                    <div className="text-xs text-gray-500">{m.user?.email}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400 capitalize">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
