"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Clock, Settings, ExternalLink, Loader2, CheckCircle2, RefreshCw, Video, Link2, Users, Unplug, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardI18n } from "@/components/dashboard/I18nProvider";

type Tab = "settings" | "upcoming" | "history";

export default function BookingPage() {
  const { t } = useDashboardI18n();
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Booking settings
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [meetingPlatform, setMeetingPlatform] = useState("google-meet");
  const [meetingLink, setMeetingLink] = useState("");
  const [bufferTime, setBufferTime] = useState("15");
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState("5");
  const [availableDays, setAvailableDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "17:00" });
  const [greeting, setGreeting] = useState("Would you like to book a call with us?");
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, boolean>>({});

  const dayNames: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

  useEffect(() => {
    const load = async () => {
      const [settingsRes, upcomingRes, oauthRes] = await Promise.all([
        fetch("/api/client/booking-settings").then(r => r.json().catch(() => ({}))),
        fetch("/api/client/booking-upcoming").then(r => r.json().catch(() => ({}))),
        fetch("/api/integrations/oauth").then(r => r.json().catch(() => ({}))),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setBookingEnabled(settingsRes.data.bookingEnabled ?? false);
        setMeetingPlatform(settingsRes.data.meetingPlatform || "google-meet");
        setMeetingLink(settingsRes.data.meetingLink || "");
        setBufferTime(settingsRes.data.bufferTime || "15");
        setMaxBookingsPerDay(settingsRes.data.maxBookingsPerDay || "5");
        setAvailableDays(settingsRes.data.availableDays || ["mon", "tue", "wed", "thu", "fri"]);
        setWorkingHours(settingsRes.data.workingHours || { start: "09:00", end: "17:00" });
        setGreeting(settingsRes.data.greeting || "Would you like to book a call with us?");
      }
      if (upcomingRes.success) setUpcomingBookings(upcomingRes.data || []);
      if (oauthRes.success && oauthRes.data) {
        const accounts: Record<string, boolean> = {};
        const connected = oauthRes.data.connected || [];
        const configured = oauthRes.data.configured || [];
        connected.forEach((p: string) => { accounts[p] = true; });
        setConnectedAccounts(accounts);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleOAuthConnect = async (platform: string) => {
    try {
      const res = await fetch("/api/integrations/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const d = await res.json();
      if (d.success && d.data?.url) {
        window.open(d.data.url, "_blank", "width=600,height=700");
      } else {
        alert(d.error || "OAuth not configured. Set up credentials in Admin > Platform Config.");
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/client/booking-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingEnabled, meetingPlatform, meetingLink, bufferTime, maxBookingsPerDay, availableDays, workingHours, greeting }),
      });
      const d = await res.json();
      if (d.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch {}
    setSaving(false);
  };

  const toggleDay = (day: string) => {
    setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-navy">{t("book.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("book.desc")}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {[
            { id: "settings" as Tab, label: "Settings", icon: Settings },
            { id: "upcoming" as Tab, label: "Upcoming", icon: Clock },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 shrink-0",
                activeTab === tab.id ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300")}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-dark-navy">{t("book.acceptBookings")}</p>
              <p className="text-xs text-muted-foreground">{t("book.acceptBookingsDesc")}</p>
            </div>
            <button onClick={() => setBookingEnabled(!bookingEnabled)}
              className={cn("w-11 h-6 rounded-full transition-colors relative", bookingEnabled ? "bg-primary" : "bg-gray-300")}>
              <div className={cn("w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5", bookingEnabled ? "translate-x-5.5 left-0.5" : "translate-x-0.5 left-0.5")} />
            </button>
          </div>

          {bookingEnabled && (
            <>
              {/* Meeting Platform */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-dark-navy mb-3">{t("book.meetingPlatform")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "google-meet", label: "Google Meet", icon: "G", oauth: "google_calendar", desc: "Create Meet events via Google Calendar" },
                    { id: "zoom", label: "Zoom", icon: "Z", oauth: "zoom", desc: "Create Zoom meetings via OAuth" },
                    { id: "calendly", label: "Calendly", icon: "C", oauth: null, desc: "Link your Calendly page" },
                  ].map(p => (
                    <div key={p.id} className={cn("p-4 rounded-xl border-2 transition-all", meetingPlatform === p.id ? "border-primary bg-primary/5" : "border-border")}>
                      <div className="flex items-start justify-between mb-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm", meetingPlatform === p.id ? "bg-primary text-dark-navy" : "bg-gray-100 text-gray-600")}>{p.icon}</div>
                        {p.oauth && (
                          connectedAccounts[p.oauth] ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Plug className="w-3 h-3" /> {t("book.connected")}</span>
                          ) : (
                            <button onClick={() => handleOAuthConnect(p.oauth!)} className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"><Unplug className="w-3 h-3" /> {t("book.connect")}</button>
                          )
                        )}
                      </div>
                      <button onClick={() => setMeetingPlatform(p.id)} className="w-full text-left">
                        <p className="text-sm font-semibold text-dark-navy">{p.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                      </button>
                    </div>
                  ))}
                </div>
                {meetingPlatform === "zoom" && (
                  <div className="mt-3 flex items-center gap-3">
                    <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
                      placeholder="https://zoom.us/j/... (optional if connected)"
                      className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    {!connectedAccounts.zoom && (
                      <button onClick={() => handleOAuthConnect("zoom")} className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-dark-navy font-semibold text-sm hover:opacity-90 flex items-center gap-2">
                        <Unplug className="w-4 h-4" /> Connect Zoom
                      </button>
                    )}
                  </div>
                )}
                {meetingPlatform === "calendly" && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.calendlyLink")}</label>
                    <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
                      placeholder="https://calendly.com/..."
                      className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                )}
                {meetingPlatform === "google-meet" && (
                  <div className="mt-3">
                    {connectedAccounts.google_calendar ? (
                      <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Google Calendar connected. Meet links will be created automatically.</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{t("book.googleCalendar")}</p>
                        <button onClick={() => handleOAuthConnect("google_calendar")} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                          <Unplug className="w-3 h-3" /> {t("book.connect")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-dark-navy mb-3">{t("book.availability")}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(dayNames).map(([key, label]) => (
                    <button key={key} onClick={() => toggleDay(key)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", availableDays.includes(key) ? "bg-primary text-dark-navy border-primary" : "bg-white text-gray-500 border-border")}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.startTime")}</label>
                    <input type="time" value={workingHours.start} onChange={e => setWorkingHours(p => ({ ...p, start: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.endTime")}</label>
                    <input type="time" value={workingHours.end} onChange={e => setWorkingHours(p => ({ ...p, end: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm" />
                  </div>
                </div>
              </div>

              {/* Advanced */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-dark-navy mb-3">{t("book.advanced")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.buffer")}</label>
                    <select value={bufferTime} onChange={e => setBufferTime(e.target.value)} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-white">
                      <option value="0">{t("book.none")}</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.maxPerDay")}</label>
                    <select value={maxBookingsPerDay} onChange={e => setMaxBookingsPerDay(e.target.value)} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-white">
                      {[1,2,3,5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.durations")}</label>
                    <select className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm text-muted-foreground">
                      <option>15, 30, 60 min</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chatbot Greeting */}
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{t("book.prompt")}</label>
                <input value={greeting} onChange={e => setGreeting(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <p className="text-xs text-muted-foreground mt-1">This is what the chatbot will say when offering to book a call.</p>
              </div>

              {/* Save */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-primary text-dark-navy font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "upcoming" && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold text-dark-navy mb-4">{t("book.upcoming")}</h3>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("book.noUpcoming")}</p>
              <p className="text-xs mt-1">Customers will appear here when they book calls through your chatbot.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium text-dark-navy">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.date} at {b.slot} · {b.duration} min</p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
