import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return "";
  }

  return "";
}

export function initApiClient() {
  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl) {
    setBaseUrl(apiBaseUrl);
  }

  setAuthTokenGetter(() => {
    return localStorage.getItem("admin_token");
  });
}

export function getApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${path}` : path;
}
