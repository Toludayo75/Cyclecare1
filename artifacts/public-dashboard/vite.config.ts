import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawApiBase = process.env.API_BASE_URL ?? process.env.VITE_API_URL ?? "http://localhost:5001";
let apiBaseUrl = rawApiBase;
try {
  const u = new URL(rawApiBase);
  if (u.hostname === "localhost") u.hostname = "127.0.0.1";
  apiBaseUrl = u.toString().replace(/\/+$/, "");
} catch {
  apiBaseUrl = rawApiBase.replace(/\/+$/, "");
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.url, "src"),
    },
  },
  server: {
    port: 4176,
    host: true,
    proxy: {
      "/api": {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
