function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    const domain = process.env.EXPO_PUBLIC_DOMAIN.trim();
    if (/^https?:\/\//i.test(domain)) {
      return domain.replace(/\/+$/, "");
    }
    return `http://${domain.replace(/\/+$/, "")}`;
  }
  if (process.env.NODE_ENV === "development") {
    return "https://cyclecare-api.onrender.com";
  }
  return "https://cyclecare-api.onrender.com";
}

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: resolveApiUrl(),
    },
  };
};
