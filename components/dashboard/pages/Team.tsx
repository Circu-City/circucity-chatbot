"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";
import { Users, UserPlus, Mail, Crown, Loader2, Trash2, Star, UserCog } from "lucide-react";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

export default function Team() {
  const { t } = useDashboardI18n();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sending, setSending] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (json.success) setMembers(json.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const inviteMember = async () => {
    if (!inviteEmail) return;
    setSending(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (json.success) {
        setShowInvite(false);
        setInviteEmail("");
        setInviteRole("member");
        fetchMembers();
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      fetchMembers();
    } catch {}
  };

  const removeMember = async (id: string) => {
    try {
      await fetch("/api/team?id=" + id, { method: "DELETE" });
      fetchMembers();
    } catch {}
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; className: string }> = {
      admin: { label: t("team.admin"), className: "bg-amber-100 text-amber-700 border-amber-200" },
      owner: { label: t("team.owner"), className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      member: { label: t("team.agent"), className: "bg-blue-100 text-blue-700 border-blue-200" },
    };
    const c = config[role] || config.member;
    return <Badge className={cn("text-[10px] border", c.className)}>{c.label}</Badge>;
  };

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-navy">{t("team.title")}</h2>
            <Button onClick={() => setShowInvite(true)} className="gap-1.5">
              <UserPlus className="w-4 h-4" />
              {t("team.inviteMemberShort")}
            </Button>
          </div>

          {members.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-dark-navy mb-2">{t("team.noMembers")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("team.collabDesc")}</p>
                <Button onClick={() => setShowInvite(true)} className="gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  {t("team.inviteMemberShort")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {members.map((member: any) => (
                <Card key={member.id} className="border-border shadow-sm hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                          {(member.user?.name || member.user?.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-dark-navy">{member.user?.name || member.user?.email?.split("@")[0] || "Unknown"}</span>
                            {getRoleBadge(member.role)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{member.user?.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role !== "owner" ? (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) => updateRole(member.id, e.target.value)}
                              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
                            >
                              <option value="admin">{t("team.admin")}</option>
                              <option value="member">{t("team.agent")}</option>
                            </select>
                            <button onClick={() => removeMember(member.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">{t("team.owner")}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} className="max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-dark-navy mb-4">{t("team.inviteMember")}</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">{t("team.email")}</span>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t("team.invitePlaceholder")} />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">{t("team.role")}</span>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                    <option value="admin">{t("team.adminFull")}</option>
                    <option value="member">{t("team.agentReply")}</option>
                  </select>
                </div>
                <Button className="w-full" onClick={inviteMember} disabled={!inviteEmail || sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {sending ? t("team.sendingInvite") : t("team.sendInvitation")}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </Wrapper>
  );
}
