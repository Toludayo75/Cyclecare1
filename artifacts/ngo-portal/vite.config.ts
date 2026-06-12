import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT ?? "4174";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";
// Prefer API_BASE_URL, then VITE_API_URL, else default to localhost:5001
const rawApiBase = process.env.API_BASE_URL ?? process.env.VITE_API_URL ?? "http://localhost:5001";
// Vite proxy may resolve `localhost` to IPv6 ::1 which can be refused if the
// backend listens only on IPv4. Normalize `localhost` to 127.0.0.1 for the
// proxy target to avoid ECONNREFUSED to ::1 on some Windows setups.
let apiBaseUrl = rawApiBase;
try {
  const u = new URL(rawApiBase);
  if (u.hostname === "localhost") u.hostname = "127.0.0.1";
  apiBaseUrl = u.toString().replace(/\/+$/, "");
} catch {
  // If parsing fails, fall back to the raw value
  apiBaseUrl = rawApiBase.replace(/\/+$/, "");
}

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
