import React from "react";
import PublicDashboard from "../components/PublicDashboard";

export default function PublicPage() {
  // ngo-portal uses Vite and sets base URL via import.meta.env.VITE_API_URL
  const apiBase = import.meta.env.VITE_API_URL?.trim() ?? "";
  return <PublicDashboard apiBaseUrl={apiBase} />;
}
