"use client";

import React, { useState, useEffect } from "react";
import { Save, Shield, Globe, Bell, Database, MessageCircle, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    platformName: "CircuitCity AI",
    supportEmail: "admin@circuitcity.ai",
    requireEmailVerification: true,
    twoFactorForAdmins: false,
    maintenanceMode: false,
  });

  const [metaConfig, setMetaConfig] = useState({ appId: "", appSecret: "", webhookToken: "" });
  const [showSecret, setShowSecret] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    fetch("/api/admin/meta-config")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setMetaConfig({
            appId: d.data.metaAppId || "",
            appSecret: d.data.metaAppSecret || "",
            webhookToken: d.data.metaWebhookToken || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, []);

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    setMetaTestResult(null);
    try {
      const res = await fetch("/api/admin/meta-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaAppId: metaConfig.appId,
          metaAppSecret: metaConfig.appSecret,
          metaWebhookToken: metaConfig.webhookToken,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMetaTestResult("saved");
        setTimeout(() => setMetaTestResult(null), 3000);
      } else {
        setMetaTestResult("error: " + (json.error || "Failed to save"));
      }
    } catch (e: any) {
      setMetaTestResult("error: " + e.message);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(json.error || "Failed to save settings");
      }
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Admin Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Configure platform-wide settings and preferences.</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">General</h3>
            <p className="text-xs text-slate-400">Platform-wide configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Platform Name</label>
            <input 
              type="text" 
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Support Email</label>
            <input 
              type="email" 
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Security</h3>
            <p className="text-xs text-slate-400">Authentication and access control</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Require Email Verification</p>
              <p className="text-xs text-slate-400">New users must verify their email before accessing the dashboard</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
              <p className="text-xs text-slate-400">Require 2FA for all admin accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.twoFactorForAdmins}
                onChange={(e) => setSettings({ ...settings, twoFactorForAdmins: e.target.checked })}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Database className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Maintenance</h3>
            <p className="text-xs text-slate-400">System maintenance controls</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Maintenance Mode</p>
              <p className="text-xs text-slate-400">Disable public access for maintenance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Channel Integrations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2 bg-green-50 rounded-lg">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Channel Integrations</h3>
            <p className="text-xs text-slate-400">Meta (Facebook/WhatsApp/Instagram) app credentials for OAuth</p>
          </div>
        </div>

        {loadingMeta ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading current configuration...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-medium mb-0.5">Meta App Configuration Required</p>
                <p>To enable Messenger, Instagram, and WhatsApp integrations, create a Meta App in the Meta Developer Portal and enter the credentials below. These are shared across all stores on the platform.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Meta App ID</label>
                <input
                  type="text"
                  value={metaConfig.appId}
                  onChange={(e) => setMetaConfig({ ...metaConfig, appId: e.target.value })}
                  placeholder="1234567890123456"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Meta App Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={metaConfig.appSecret}
                    onChange={(e) => setMetaConfig({ ...metaConfig, appSecret: e.target.value })}
                    placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Webhook Token</label>
                <input
                  type="text"
                  value={metaConfig.webhookToken}
                  onChange={(e) => setMetaConfig({ ...metaConfig, webhookToken: e.target.value })}
                  placeholder="your_webhook_verify_token"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none font-mono"
                />
              </div>
            </div>

            {metaTestResult === "saved" && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle className="w-4 h-4" />
                Meta configuration saved successfully.
              </div>
            )}
            {metaTestResult && metaTestResult !== "saved" && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4" />
                {metaTestResult}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveMeta}
                disabled={savingMeta || !metaConfig.appId}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {savingMeta ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingMeta ? "Saving..." : "Save Meta Configuration"}
              </button>
              {metaConfig.appId && (
                <span className="text-xs text-slate-400">
                  Configured
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Changes Logged!" : "Save Settings"}
        </button>
        <p className="text-[10px] text-slate-400 mt-2 text-right">
          Settings are logged as admin actions (full persistence coming soon)
        </p>
      </div>
    </div>
  );
}