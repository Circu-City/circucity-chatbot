"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  RefreshCw, 
  Search, 
  Package, 
  Trash2, 
  ExternalLink,
  FileText,
  CheckCircle2,
  Loader2,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "../I18nProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8  max-w-full overflow-hidden">{children}</div>;
}

export default function ProductCatalog() {
  const { t } = useDashboardI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ totalProducts: 0, indexedCount: 0, errorCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", price: "", description: "", category: "", stock: "", image: "", currency: "SEK" });
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!showAddModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setShowAddModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddModal, saving]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/products");
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setStats({ totalProducts: json.data.totalProducts, indexedCount: json.data.indexedCount, errorCount: json.data.errorCount });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("cat.deleteConfirm"))) return;
    try {
      await fetch(`/api/client/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch {}
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) return;
    setSaving(true);
    setAddError("");
    try {
      const res = await fetch("/api/client/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          price: parseFloat(addForm.price),
          description: addForm.description || undefined,
          category: addForm.category || undefined,
          stock: addForm.stock ? parseInt(addForm.stock) : undefined,
          currency: addForm.currency,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setAddError(json?.error || t("cat.addError"));
        return;
      }
      setShowAddModal(false);
      setAddForm({ name: "", price: "", description: "", category: "", stock: "", image: "", currency: "SEK" });
      fetchProducts();
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Wrapper>

{/* Stats Grid */}<div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark-navy">{t("cat.title")}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={fetchProducts}>
                <RefreshCw className="w-4 h-4" />
                {t("lst.sync")}
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4" />
                {t("cat.addProduct")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

<Card className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("cat.totalProducts")}</p>
              <h3 className="text-2xl font-bold text-dark-navy">{stats.totalProducts.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("common.active")}</p>
              <h3 className="text-2xl font-bold text-dark-navy">{stats.indexedCount.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("common.inactive")}</p>
              <h3 className="text-2xl font-bold text-dark-navy">{stats.errorCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="border-border shadow-sm overflow-hidden max-w-full">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("cat.searchPlaceholder")} className="pl-10"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("cat.productName")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.category")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.price")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("common.status")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy">{t("lst.stock")}</th>
                  <th className="p-4 text-sm font-semibold text-dark-navy text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.length > 0 ? filteredProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <span className="font-medium text-dark-navy">{product.name}</span>
                          {product.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{product.category || "-"}</td>
                    <td className="p-4 text-sm font-medium text-dark-navy">{product.currency} {product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge className={cn(
                        "text-[10px] uppercase tracking-wider",
                        product.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      )}>
                        {product.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{product.stock ?? "-"}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">
                      {searchQuery ? t("cat.noMatch") : t("cat.noProducts")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-navy/60" onClick={() => !saving && setShowAddModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-dark-navy">{t("cat.addProduct")}</h3>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-gray-500" onClick={() => !saving && setShowAddModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {addError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{addError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-dark-navy mb-1">{t("cat.productNameRequired")}</label>
                  <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="e.g. Vintage denim jacket" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-navy mb-1">{t("cat.priceRequired")}</label>
                  <Input type="number" step="0.01" min="0" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-navy mb-1">{t("common.currency")}</label>
                  <select
                    className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={addForm.currency}
                    onChange={(e) => setAddForm({ ...addForm, currency: e.target.value })}
                  >
                    <option>SEK</option>
                    <option>EUR</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-navy mb-1">{t("common.category")}</label>
                  <Input value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} placeholder="e.g. Clothing" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-navy mb-1">{t("lst.stock")}</label>
                  <Input type="number" min="0" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-navy mb-1">{t("common.description")}</label>
                <textarea
                  className="w-full min-h-[72px] rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder={t("cat.shortDescription")}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)} disabled={saving}>{t("common.cancel")}</Button>
              <Button size="sm" className="gap-2" onClick={handleAdd} disabled={saving || !addForm.name || !addForm.price}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? t("cat.adding") : t("cat.addProduct")}
              </Button>
            </div>
          </div>
        </div>
      )}
    
    </Wrapper>
  );
}