Public Dashboard (standalone)

This is a small static SPA that renders the public dashboard and fetches `/api/public/events` from the API.

Run locally:

```bash
pnpm install --filter @workspace/public-dashboard
pnpm --filter @workspace/public-dashboard dev
```

Build:

```bash
pnpm --filter @workspace/public-dashboard build
```

Notes:
- Ensure the backend `api-server` is running and `VITE_API_URL` or `API_BASE_URL` points to the API (default `http://localhost:5001`).
- The Vite dev proxy normalizes `localhost` to `127.0.0.1` to avoid IPv6 connect issues on some systems.
