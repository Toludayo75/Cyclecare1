import Constants from "expo-constants";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envApiUrl) {
    return normalizeUrl(envApiUrl);
  }

  const envDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (envDomain) {
    if (/^https?:\/\//i.test(envDomain)) {
      return normalizeUrl(envDomain);
    }
    return normalizeUrl(`http://${envDomain}`);
  }

  const extraApiUrl =
    Constants.expoConfig?.extra?.apiUrl?.trim() ||
    Constants.manifest?.extra?.apiUrl?.trim();
  if (extraApiUrl) {
    return normalizeUrl(extraApiUrl);
  }

  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }

  return "https://cyclecare-api.onrender.com";
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
}
