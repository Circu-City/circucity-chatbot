"use client";
import { createContext, useContext } from "react";

interface DashboardContextType {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  activePage: "overview",
  setActivePage: () => {},
});

export const useDashboard = () => useContext(DashboardContext);
