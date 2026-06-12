# CycleCare

A menstrual health mobile app targeting Africa (primarily Nigeria) — featuring cycle tracking, NGO-backed menstrual product distribution, health education, and multi-language support (English, Yoruba, Igbo, Hausa).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), expo-router file-based routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken + bcryptjs), stored in AsyncStorage on device
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → `@workspace/api-client-react` hooks + `@workspace/api-zod` schemas
- Build: esbuild (CJS bundle for server)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, cycleProfiles, cycleLogs)
- `lib/api-client-react/` — generated React Query hooks (do not edit manually)
- `lib/api-zod/` — generated Zod schemas (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers (auth/, cycle/, health/)
- `artifacts/api-server/src/lib/jwt.ts` — JWT sign/verify helpers
- `artifacts/api-server/src/middlewares/authenticate.ts` — Bearer token middleware
- `artifacts/cyclecare/app/` — Expo screens (file-based routing)
  - `(auth)/` — welcome, sign-up, login, forgot-password
  - `(onboarding)/` — 6-step onboarding flow
  - `(tabs)/` — home dashboard, support, requests, profile
- `artifacts/cyclecare/context/AuthContext.tsx` — auth state + AsyncStorage persistence
- `artifacts/cyclecare/constants/colors.ts` — brand color tokens (light + dark)
- `artifacts/cyclecare/components/` — shared UI: Button, Input

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen for both React Query hooks and Zod schemas. Never write fetch calls by hand in the mobile app.
- JWT is stored in AsyncStorage on the device (no server-side session table needed for Phase 1).
- `setBaseUrl()` must be called at module load time in `_layout.tsx` using `EXPO_PUBLIC_DOMAIN` — Expo runs outside the shared reverse proxy, so absolute URLs are required.
- Onboarding data is staged in AsyncStorage across screens and submitted to the API all at once on the notifications screen.
- `hasCompletedOnboarding` flag on the user record drives the root index redirect logic.

## Product

- **Cycle tracking**: predict next period, view cycle phase (menstrual/follicular/ovulation/luteal), fertile window, day-in-cycle counter
- **NGO product requests**: monthly pad allocation, pickup code system, request history
- **Health education**: articles, symptom categories, FAQ, ask-a-health-worker chat (Phase 4+)
- **Multi-language**: UI scaffolded for English, Yoruba, Igbo, Hausa (locale switching in profile)
- **Auth**: email/password registration + login, JWT auth, forgot-password flow

## User preferences

- Brand: primary `#E96C8A` (pink), secondary `#2FB7A3` (teal), background `#F8F7F9`
- Font: Inter (400/500/600/700)
- Target market: Nigeria and wider Africa
- Phase-based build: Phase 1 (auth + foundation) ✅, Phase 2 (onboarding + cycle engine) ✅, Phase 3 (home dashboard) ✅, Phase 4 (support/education) ✅ (live), Phase 5 (requests/pickup) ✅ (live API, pending NGO approval), Phase 6 (profile/settings) ✅ (live)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — generated hooks break silently otherwise.
- Always run `pnpm --filter @workspace/db run push` after editing `lib/db/src/schema/` files.
- Do NOT add leaf workspace packages to root `tsconfig.json` references.
- The Expo app uses `EXPO_PUBLIC_DOMAIN` (not `localhost`) for API calls. In dev this equals `$REPLIT_DEV_DOMAIN` (wired in the workflow).
- `shadowColor` etc. are deprecated in RN new arch — use `boxShadow` in new code if console warnings become noise.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/index.ts`
- Brand colors: `artifacts/cyclecare/constants/colors.ts`
