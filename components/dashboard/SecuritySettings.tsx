"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Shield, Mail, Key, CheckCircle2, XCircle, Loader2, Save,
  Smartphone, Copy, Check, AlertCircle, Eye, EyeOff, QrCode
} from "lucide-react";

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [security, setSecurity] = useState<any>(null);
  const [emailForm, setEmailForm] = useState("");
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyToken, setVerifyToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const showMsg = (m: string, err = false) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 4000);
  };

  useEffect(() => {
    fetch("/api/user/security")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSecurity(d.data);
          setEmailForm(d.data.email);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleEmailChange = async () => {
    if (!emailForm || emailForm === security?.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm }),
      });
      const d = await res.json();
      if (d.success) {
        setSecurity({ ...security, email: d.data.email, emailVerified: false });
        showMsg("Email updated");
      } else {
        showMsg(d.error || "Failed to update email", true);
      }
    } catch {
      showMsg("Failed to update email", true);
    }
    setSaving(false);
  };

  const handleSetup2fa = async () => {
    setShow2faSetup(true);
    try {
      const res = await fetch("/api/user/security/2fa/setup", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setQrCode(d.data.qrCode);
        setBackupCodes(d.data.backupCodes);
      } else {
        showMsg(d.error || "Failed to setup 2FA", true);
        setShow2faSetup(false);
      }
    } catch {
      showMsg("Failed to setup 2FA", true);
      setShow2faSetup(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!verifyToken) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/user/security/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken }),
      });
      const d = await res.json();
      if (d.success) {
        setSecurity({ ...security, twoFactorEnabled: true });
        setShow2faSetup(false);
        setVerifyToken("");
        setQrCode("");
        showMsg("2FA enabled successfully");
      } else {
        showMsg(d.error || "Invalid code", true);
      }
    } catch {
      showMsg("Verification failed", true);
    }
    setVerifying(false);
  };

  const handleDisable2fa = async () => {
    if (!confirm("Are you sure you want to disable 2FA?")) return;
    try {
      const res = await fetch("/api/user/security/2fa/disable", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setSecurity({ ...security, twoFactorEnabled: false });
        showMsg("2FA disabled");
      } else {
        showMsg(d.error || "Failed to disable", true);
      }
    } catch {
      showMsg("Failed to disable 2FA", true);
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {message && (
        <div className={cn("p-3 rounded-lg text-sm border", message.includes("Failed") || message.includes("failed") ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200")}>
          {message}
        </div>
      )}

      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-6">
          <h3 className="font-bold text-dark-navy flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Email Address
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                value={emailForm}
                onChange={(e) => setEmailForm(e.target.value)}
                placeholder="your@email.com"
                className="h-9 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleEmailChange}
              disabled={saving || !emailForm || emailForm === security?.email}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {security?.emailVerified ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                <AlertCircle className="w-3 h-3" /> Not Verified
              </Badge>
            )}
            {!security?.emailVerified && (
              <span className="text-muted-foreground">Check your inbox for verification link</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-dark-navy flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Two-Factor Authentication
            </h3>
            {security?.twoFactorEnabled ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enabled
              </Badge>
            ) : (
              <Badge variant="outline">Disabled</Badge>
            )}
          </div>

          {security?.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">
                  Two-factor authentication is active. Your account is protected with an additional verification step during login.
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 gap-1.5" onClick={handleDisable2fa}>
                <XCircle className="w-4 h-4" /> Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>

              {!show2faSetup ? (
                <Button size="sm" className="gap-1.5" onClick={handleSetup2fa}>
                  <QrCode className="w-4 h-4" /> Setup 2FA
                </Button>
              ) : (
                <div className="space-y-6 p-4 bg-slate-50 rounded-xl border border-border">
                  <div className="text-center">
                    {qrCode && (
                      <div className="mb-4">
                        <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48 rounded-lg shadow-sm border border-border" />
                        <p className="text-xs text-muted-foreground mt-2">Scan with your authenticator app</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Or manually enter this key: <code className="bg-slate-200 px-2 py-0.5 rounded text-xs font-mono">{backupCodes.length > 0 ? "****" : ""}</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-navy">Backup Codes</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowBackupCodes(!showBackupCodes)}>
                        {showBackupCodes ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showBackupCodes ? "Hide" : "Show"}
                      </Button>
                    </div>
                    {showBackupCodes && (
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, i) => (
                          <button
                            key={i}
                            onClick={() => copyBackupCode(code)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-border text-xs font-mono hover:bg-slate-100 transition-colors text-left"
                          >
                            <span className="flex-1">{code}</span>
                            {copiedCode === code ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-amber-600">Save these codes somewhere safe. You will need them if you lose access to your authenticator app.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-dark-navy">Verify with authenticator code</label>
                    <div className="flex gap-2">
                      <Input
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                        placeholder="000000"
                        className="h-9 text-sm w-32 font-mono text-center tracking-widest"
                        maxLength={6}
                      />
                      <Button size="sm" onClick={handleVerify2fa} disabled={verifying || verifyToken.length < 6} className="gap-1.5">
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Verify & Enable
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
