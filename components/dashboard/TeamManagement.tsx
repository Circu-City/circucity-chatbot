"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Mail,
  Shield,
  Crown,
} from "lucide-react";
import { inviteTeamMember, removeTeamMember } from "@/lib/actions/inviteMember";
import { getCurrentOrganization } from "@/lib/actions/organization";

export default function TeamManagement() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadOrg();
  }, []);

  const loadOrg = async () => {
    setLoading(true);
    try {
      const data = await getCurrentOrganization();
      setOrg(data);
    } catch {}
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !org) return;
    setInviting(true);
    setMessage("");
    try {
      await inviteTeamMember(org.id, inviteEmail, inviteRole);
      await loadOrg();
      setInviteEmail("");
      setMessage("Member invited successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Invite failed"));
      setTimeout(() => setMessage(""), 5000);
    }
    setInviting(false);
  };

  const handleRemove = async (memberId: string) => {
    if (!org || !confirm("Remove this team member?")) return;
    try {
      await removeTeamMember(org.id, memberId);
      await loadOrg();
      setMessage("Member removed");
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      setMessage("Error: " + (e.message || "Remove failed"));
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const planLimits: Record<string, number> = { free: 3, starter: 5, growth: 10, enterprise: 999 };
  const currentPlan = org?.plan || "free";
  const memberCount = org?.members?.length || 0;
  const maxMembers = planLimits[currentPlan] || 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith("Error") ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"}`}>
          {message}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-dark-navy">Team Management</h2>
        <p className="text-muted-foreground text-sm">Manage who has access to your workspaces.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <h3 className="text-2xl font-bold text-dark-navy">{memberCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <h3 className="text-2xl font-bold text-dark-navy capitalize">{currentPlan}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Limit</p>
              <h3 className="text-2xl font-bold text-dark-navy">{memberCount} / {maxMembers}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Invite Form */}
      <Card className="p-6 border-border shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-dark-navy">Invite Team Member</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="bg-dark-navy text-white hover:bg-dark-navy/90"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Invite
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Invited users will be added as {inviteRole}s. They can log in with their email.
        </p>
      </Card>

      {/* Member List */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-dark-navy">Members ({memberCount})</h3>
        </div>
        {org?.members?.length > 0 ? (
          <div className="divide-y divide-border">
            {org.members.map((m: any) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                    {(m.user?.name || m.user?.email || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-navy">{m.user?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={m.role === "admin" ? "default" : "outline"}
                    className={m.role === "admin" ? "bg-primary text-dark-navy" : ""}
                  >
                    {m.role}
                  </Badge>
                  {m.userId !== org?.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(m.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {m.userId === org?.userId && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">Owner</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No team members yet. Invite someone above to get started.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
