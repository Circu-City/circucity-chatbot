"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, Play, Pause, Edit3, Trash2, Save, Copy, Check, X, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8  max-w-full overflow-hidden">
      {children}
    </div>
  );
}

interface Step {
  id: string;
  type: "message" | "condition" | "action";
  content: string;
  condition?: { field: string; operator: string; value: string };
  children?: Step[];
}

interface Flow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  trigger: string;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}

export default function Flows() {
    const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFlows = useCallback(async () => {
    try {
      const res = await fetch("/api/flows");
      const d = await res.json();
      if (d.success) setFlows(d.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const handleSave = async () => {
    if (!editingFlow) return;
    setSaving(true);
    try {
      const res = await fetch("/api/flows", {
        method: editingFlow.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingFlow.id ? { ...editingFlow, id: editingFlow.id } : editingFlow),
      });
      const d = await res.json();
      if (d.success) {
        console.log("Flow saved");
        setShowEditor(false);
        fetchFlows();
      }
    } catch {
      console.error("Failed to save flow.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/flows?id=" + id, { method: "DELETE" });
      console.log("Flow deleted");
      fetchFlows();
    } catch {
      console.error("Failed to delete flow.");
    }
  };

  return (
    <Wrapper>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-navy">Flows</h2>
            <Button size="sm" className="gap-2" onClick={() => { setEditingFlow({ id: "", name: "", description: "", active: true, trigger: "new_conversation", steps: [], createdAt: "", updatedAt: "" }); setShowEditor(true); }}>
              <Plus className="w-4 h-4" />
              New Flow
            </Button>
          </div>

          {flows.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="p-12 text-center">
                <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-dark-navy mb-2">No flows yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first automation flow to handle conversations.</p>
                <Button size="sm" className="gap-2" onClick={() => { setEditingFlow({ id: "", name: "", description: "", active: true, trigger: "new_conversation", steps: [], createdAt: "", updatedAt: "" }); setShowEditor(true); }}>
                  <Plus className="w-4 h-4" />
                  Create Flow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {flows.map((flow) => (
                <Card key={flow.id} className="border-border shadow-sm hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <GitBranch className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-dark-navy">{flow.name}</p>
                          {flow.active ? (
                            <Badge variant="default" className="bg-green-500 text-[10px]">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Paused</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{flow.description || flow.trigger}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditingFlow(flow); setShowEditor(true); }}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => handleDelete(flow.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        {flow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showEditor && editingFlow && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-background rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-dark-navy">{editingFlow.id ? "Edit Flow" : "New Flow"}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-dark-navy">Name</span>
                    <Input value={editingFlow.name} onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-dark-navy">Description</span>
                    <textarea value={editingFlow.description} onChange={(e) => setEditingFlow({ ...editingFlow, description: e.target.value })} className="text-sm" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-dark-navy">Trigger</span>
                    <select className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-background" value={editingFlow.trigger} onChange={(e) => setEditingFlow({ ...editingFlow, trigger: e.target.value })}>
                      <option value="new_conversation">New Conversation</option>
                      <option value="keyword">Keyword Match</option>
                      <option value="inactivity">Inactivity Timeout</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-dark-navy">Active</p>
                      <p className="text-xs text-muted-foreground">Enable this flow</p>
                    </div>
                    <button type="button" className={"w-10 h-5 rounded-full transition-colors " + (editingFlow.active ? "bg-primary" : "bg-gray-200")} onClick={() => setEditingFlow({ ...editingFlow, active: !editingFlow.active })}><div className={"w-4 h-4 rounded-full bg-white shadow-sm transition-transform " + (editingFlow.active ? "translate-x-5" : "translate-x-0.5")} /></button>
                  </div>
                </div>
                <div className="p-6 border-t border-border flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>Cancel</Button>
                  <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving || !editingFlow.name}>
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Wrapper>
  );
}
