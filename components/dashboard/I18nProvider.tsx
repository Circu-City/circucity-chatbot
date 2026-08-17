"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DASHBOARD_LANGS, DashboardLang, translate } from "@/lib/dashboard-i18n";

interface DashboardI18nContextValue {
  lang: DashboardLang;
  setLang: (lang: DashboardLang) => void;
  t: (key: string) => string;
}

const DashboardI18nContext = createContext<DashboardI18nContextValue>({
  lang: "sv",
  setLang: () => {},
  t: (key: string) => key,
});

export function DashboardI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<DashboardLang>("sv");

  useEffect(() => {
    fetch("/api/listings/language")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.language && DASHBOARD_LANGS.includes(json.language)) {
          setLangState(json.language as DashboardLang);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((next: DashboardLang) => {
    setLangState(next);
    fetch("/api/listings/language", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => {});
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <DashboardI18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </DashboardI18nContext.Provider>
  );
}

export function useDashboardI18n() {
  return useContext(DashboardI18nContext);
}
