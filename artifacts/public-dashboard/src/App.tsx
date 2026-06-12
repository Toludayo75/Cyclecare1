import React from "react";
import PublicDashboard from "./components/PublicDashboard";

export default function App() {
  const apiBase = import.meta.env.VITE_API_URL?.trim() ?? "";
  return <PublicDashboard apiBaseUrl={apiBase} />;
}
