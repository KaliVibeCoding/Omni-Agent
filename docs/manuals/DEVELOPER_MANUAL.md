# Developer Manual

**Audience:** Engineers building or extending the platform.
**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Project Layout

```
/home/user/webapp/
├── artifacts/                       ← Deployable apps
│   ├── api-server/                  ← Express dev API (Replit)
│   ├── cf-worker/                   ← Hono Cloudflare Worker (PROD API)
│   ├── twilio-platform/             ← Main React SaaS frontend
│   ├── twilio-omni-agent/           ← AI chat frontend
│   └── mockup-sandbox/              ← Design playground
├── lib/                             ← Shared workspace packages
│   ├── api-spec/                    ← OpenAPI 3.0 contract
│   ├── api-client-react/            ← Generated React hooks
│   ├── api-zod/                     ← Generated Zod schemas
│   ├── db/                          ← Drizzle PostgreSQL schema (dev)
│   ├── integrations-anthropic-ai/   ← Claude streaming
│   ├── integrations-openrouter-ai/  ← OpenRouter streaming
│   └── integrations/                ← Aggregate catalog
├── scripts/                         ← One-off migrations, seeders
├── docs/                            ← This documentation
├── pnpm-workspace.yaml              ← Monorepo definition
├── package.json                     ← Root scripts
└── tsconfig.base.json               ← Shared TS config
```

---

## 2. Local Setup

### Prerequisites
- **Node.js 24** (use `nvm install 24`)
- **pnpm 9+** (`npm install -g pnpm`)
- **Wrangler** (`npm install -g wrangler`) for worker dev/deploy
- **PostgreSQL 16+** for dev API (Replit provisions automatically)

### First-time install
```bash
cd /home/user/webapp
pnpm install
```

### Start dev servers
```bash
# Worker (port 8787)
cd artifacts/cf-worker && wrangler dev

# Frontend (port 5173) — proxies /api to worker
cd artifacts/twilio-platform && pnpm run dev

# Express dev API (port 8080) — alternate to worker
cd artifacts/api-server && pnpm run dev
```

---

## 3. Workflow Rules

1. **Branch:** All work on `genspark_ai_developer`. `main` is protected.
2. **Commits:** Conventional commits — `feat(scope): …`, `fix(scope): …`, `chore: …`, `docs: …`.
3. **PRs:** Open against `main`. Title matches squash commit title. Include "Why + What" in description.
4. **Typecheck before push:** `pnpm run typecheck` must pass.
5. **No `any` without justification.** Use `unknown` and narrow.
6. **No SQL string interpolation.** Always parameterized.

---

## 4. Common Tasks

### Add a new Worker route
1. Create `artifacts/cf-worker/src/routes/<feature>.ts`:
   ```ts
   import { Hono } from "hono";
   import type { Env } from "../index";
   import { requireUserId, AuthError } from "../lib/auth";

   const feature = new Hono<{ Bindings: Env }>();

   feature.get("/", async (c) => {
     try {
       const userId = requireUserId(c.req.header("Authorization") ?? null);
       return c.json({ hello: userId });
     } catch (e) {
       if (e instanceof AuthError) return c.json({ error: e.message }, e.status);
       return c.json({ error: (e as Error).message }, 500);
     }
   });

   export default feature;
   ```
2. Mount in `cf-worker/src/index.ts`:
   ```ts
   import featureRoutes from "./routes/feature";
   app.route("/api/feature", featureRoutes);
   ```
3. Add to OpenAPI spec at `lib/api-spec/openapi.yaml`.
4. Regenerate clients: `pnpm --filter @workspace/api-spec run codegen`.
5. Use in frontend: `const data = useApi()<MyType>("/api/feature")`.

### Add a new D1 column
1. Append to `artifacts/cf-worker/db/schema.sql` (additive only).
2. Create a numbered migration: `artifacts/cf-worker/db/migrations/0002_add_x.sql`.
3. Apply remotely:
   ```bash
   wrangler d1 execute twilio-platform --file=db/migrations/0002_add_x.sql --remote
   ```
4. Mirror in `lib/db/src/schema.ts` for dev.

### Add a new frontend page
1. Create `artifacts/twilio-platform/src/pages/<page>.tsx`.
2. Add route in `App.tsx`:
   ```tsx
   <Route path="/my-page" component={() => <ProtectedRoute component={MyPage} />} />
   ```
3. Add to sidebar in `components/layout.tsx`.
4. Hit the API via `useApi()`:
   ```tsx
   const api = useApi();
   const { data } = useQuery({ queryKey: ["my-page"], queryFn: () => api("/api/my-feature") });
   ```

### Add a new master admin
See [`user-guides/ADMIN_MANUAL.md` § Adding or Removing an Admin](../user-guides/ADMIN_MANUAL.md#adding-or-removing-an-admin).

### Add a new niche
1. Edit `artifacts/twilio-platform/src/pages/niche-config.ts` and append the slug + defaults.
2. Statuses, SMS templates, compliance items — all config-driven.
3. The backend `/api/niche/:slug/*` routes are already generic — no worker changes.

---

## 5. Coding Standards

### TypeScript
- Strict mode on (`tsconfig.base.json`).
- Prefer `interface` for public shapes, `type` for unions/intersections.
- Discriminated unions over enums.
- No barrel imports of huge libraries — tree-shake aggressively.

### React
- Function components only. No classes.
- Hooks at the top of the function. No conditional hooks.
- `useQuery` for reads, `useMutation` for writes (TanStack Query).
- Co-locate component-specific helpers in the same file; share via `lib/` only when reused.

### CSS
- Tailwind utility classes only.
- Theme via CSS variables in `index.css` (dark mode by default).
- `shadcn/ui` components in `components/ui/` — do not modify generated files; wrap with your own.

### Errors
- Throw typed errors: `AuthError`, `ApiHttpError`, `HTTPException`.
- Always return JSON `{ error: string }` from API on failure.
- Frontend surfaces errors via `sonner` toasts (`toast.error(...)`)

---

## 6. Generated Code

| Generator | Source | Output |
|---|---|---|
| Orval | `lib/api-spec/openapi.yaml` | `lib/api-client-react/src/generated/` |
| Orval | `lib/api-spec/openapi.yaml` | `lib/api-zod/src/generated/` |
| Drizzle Kit | `lib/db/src/schema.ts` | `lib/db/drizzle/*.sql` |

Run all codegen:
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run generate
```

Never edit generated files. Re-run the generator instead.

---

## 7. Debugging

### Worker live logs
```bash
cd artifacts/cf-worker
wrangler tail
```
Now click around the frontend — every request and `console.log` streams.

### D1 inspection
```bash
wrangler d1 execute twilio-platform --command "SELECT user_id, plan FROM tenant_credentials LIMIT 10" --remote
```

### Inspect a Clerk JWT
Paste into https://jwt.io — verify `sub` (userId), `iss` (Clerk issuer), `exp`.

### React Query devtools
Enabled in dev. Press the floating icon bottom-right of the page to see all queries + cache state.

---

## 8. Performance

- **Worker bundle size:** check with `wrangler deploy --dry-run` — must stay under 1 MB compressed.
- **D1 query cost:** every read costs 1 row. Use indexes; avoid `SELECT *` on large tables.
- **Frontend bundle:** check with `pnpm run build` — Vite reports per-chunk size. Lazy-load heavy pages with `React.lazy()`.

---

## 9. Security in Code

- Never log secrets, tokens, or PII.
- Never return `auth_token`, `api_key_secret` to frontend — always re-encrypt in place.
- Sanitize all user inputs with Zod before persistence.
- Use Cloudflare's built-in `crypto.subtle` for AES — no third-party crypto libs.

---

## 10. Where to Look

| Question | File |
|---|---|
| How does auth work? | `cf-worker/src/lib/auth.ts` |
| Where do tenants live? | `cf-worker/src/routes/tenant.ts` |
| How do I sync routes with frontend? | `lib/api-spec/openapi.yaml` |
| Branding / theme? | `twilio-platform/src/index.css` + `App.tsx` clerkAppearance |
| Sidebar nav? | `twilio-platform/src/components/layout.tsx` |
| Master admin allowlist? | `cf-worker/src/lib/admin.ts` + `twilio-platform/src/lib/admin.ts` |
