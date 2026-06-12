import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? "";
if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl.replace(/\/+$/, ""));
} else if (typeof window !== "undefined" && window.location) {
  setBaseUrl(window.location.origin);
}

setAuthTokenGetter(() => localStorage.getItem("ngo_token") ?? null);

createRoot(document.getElementById("root")!).render(<App />);