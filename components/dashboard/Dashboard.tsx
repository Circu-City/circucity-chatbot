"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardContext } from "@/lib/dashboard-context";
import DashboardLayout from "./DashboardLayout";
import Overview from "./pages/Overview";
import ChatWidget from "./pages/ChatWidget";
import ProductCatalog from "./pages/ProductCatalog";
import Conversations from "./pages/Conversations";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import Settings from "./Settings";
import Documentation from "./pages/Documentation";
import Unanswered from "./pages/Unanswered";
import Monitoring from "./pages/Monitoring";
import AiAgent from "./pages/AiAgent";
import Integrations from "./pages/Integrations";
import Flows from "./pages/Flows";
import LiveVisitors from "./pages/LiveVisitors";
import Team from "./pages/Team";
import PartnerDashboard from "./pages/PartnerDashboard";
import Booking from "./pages/Booking";
import Templates from "./pages/Templates";
import Intelligence from "./pages/Intelligence";
import KnowledgeBase from "./KnowledgeBase";
import Listings from "./pages/Listings";
import { DashboardI18nProvider } from "./I18nProvider";

export default function Dashboard() {
  const [activePage, setActivePageState] = useState("overview");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const setActivePage = useCallback((page: string) => {
    setActivePageState(page);
    const url = page === "overview" ? "/dashboard" : `/dashboard?tab=${page}`;
    window.history.pushState({}, "", url);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const success = searchParams.get("success");
    if (tab) {
      setActivePageState(tab);
    }
    if (success === "true") {
      setPaymentSuccess(true);
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t) setActivePageState(t);
      else setActivePageState("overview");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [searchParams]);

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <Overview />;
      case "widget":
        return <ChatWidget />;
      case "catalog":
        return <ProductCatalog />;
      case "listing":
        return <Listings />;
      case "conversations":
        return <Conversations />;
      case "analytics":
        return <Analytics />;
      case "billing":
        return <Billing paymentSuccess={paymentSuccess} />;
      case "settings":
        return <Settings />;
      case "docs":
        return <Documentation />;
      case "unanswered":
        return <Unanswered />;
      case "monitoring":
        return <Monitoring />;
      case "integrations":
        return <Integrations />;
      case "flows":
        return <Flows />;
      case "visitors":
        return <LiveVisitors />;
      case "team":
        return <Team />;
      case "ai-agent":
      case "playground":
        return <AiAgent />;
      case "partner":
        return <PartnerDashboard />;
      case "booking":
        return <Booking />;
      case "templates":
        return <Templates />;
      case "intelligence":
        return <Intelligence />;
      case "knowledge":
        return <KnowledgeBase />;
      default:
        return <Overview />;
    }
  };

  return (
    <DashboardI18nProvider>
      <DashboardContext.Provider value={{ activePage, setActivePage }}>
        <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
          {renderPage()}
        </DashboardLayout>
      </DashboardContext.Provider>
    </DashboardI18nProvider>
  );
}
