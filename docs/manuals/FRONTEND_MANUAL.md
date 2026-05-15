# Frontend Manual (`artifacts/twilio-platform/`)

**Audience:** Engineers working on the main SaaS dashboard.
**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Stack

- **Bundler:** Vite 5
- **Language:** TypeScript 5.9 (strict)
- **Framework:** React 18 (function components, hooks)
- **Router:** [wouter](https://github.com/molefrog/wouter) — 1.5 kB hash-free SPA router
- **Data:** [@tanstack/react-query](https://tanstack.com/query) v5
- **Auth:** [@clerk/react](https://clerk.com)
- **UI:** [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS
- **Icons:** lucide-react
- **Charts:** recharts
- **Forms:** react-hook-form + zod
- **Toasts:** sonner

---

## 2. File Layout

```
artifacts/twilio-platform/
├── src/
│   ├── App.tsx                     ← Router + ClerkProvider + ApiAuthBridge
│   ├── main.tsx                    ← Mount point
│   ├── index.css                   ← Global theme variables
│   ├── components/
│   │   ├── layout.tsx              ← Sidebar + top bar
│   │   └── ui/                     ← shadcn primitives (generated)
│   ├── hooks/
│   │   ├── use-api.ts              ← useApi, useMe, useMasterAdmin
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts                  ← apiFetch, ApiHttpError
│   │   ├── admin.ts                ← Master admin email allowlist (mirror)
│   │   ├── queryClient.ts          ← TanStack Query config
│   │   └── utils.ts                ← cn() class merger
│   └── pages/                      ← Every route is one file here
│       ├── landing.tsx
│       ├── connect.tsx
│       ├── dashboard.tsx
│       ├── sms.tsx
│       ├── calls.tsx
│       ├── phone-numbers.tsx
│       ├── lookup.tsx
│       ├── voicemails.tsx
│       ├── usage.tsx
│       ├── alerts.tsx
│       ├── verify.tsx
│       ├── messaging-services.tsx
│       ├── studio.tsx
│       ├── queues.tsx
│       ├── conferences.tsx
│       ├── contacts.tsx
│       ├── settings.tsx
│       ├── video.tsx
│       ├── conversations.tsx
│       ├── telehealth.tsx
│       ├── billing.tsx
│       ├── email-campaigns.tsx
│       ├── agi-framework.tsx
│       ├── admin.tsx
│       ├── integrations.tsx
│       ├── niches-hub.tsx
│       ├── niche-landing.tsx
│       ├── niche-dashboard.tsx
│       └── not-found.tsx
├── functions/
│   └── api/
│       └── [[path]].ts             ← Pages Function: /api/* → Worker proxy
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml                   ← Pages config
```

---

## 3. App Composition (`App.tsx`)

```
WouterRouter (basePath)
 └── ClerkProvider (publishableKey, theme=shadcn)
     └── QueryClientProvider
         ├── ClerkQueryClientCacheInvalidator   ← clears cache on signed-out
         ├── ApiAuthBridge                       ← wires setAuthTokenGetter()
         └── TooltipProvider
             ├── Router (Switch)
             │   ├── /                    → HomeRedirect (signed-in → /dashboard, else Landing)
             │   ├── /sign-in/*           → SignInPage
             │   ├── /sign-up/*           → SignUpPage
             │   ├── /connect             → ConnectPage (auth required, master admin bypassed)
             │   └── /<page>              → ProtectedRoute(<Page/>)
             └── Toaster
```

**ProtectedRoute behavior:**
1. If signed-out → redirect to `/`.
2. If master admin → render `<Layout><Component/></Layout>` directly.
3. If signed-in + no Twilio creds → redirect to `/connect`.
4. If signed-in + has creds → render normally.
5. If `requireAdmin && !isMasterAdmin` → render "Admin Access Required" stub.

---

## 4. Authenticated API Calls — 3 Ways

### Way 1 — Generated React Query hooks (preferred for OpenAPI-defined routes)
```tsx
import { useGetTwilioAccount } from "@workspace/api-client-react";
const { data, isLoading } = useGetTwilioAccount();
```
Auth header auto-attached via `setAuthTokenGetter()` in `App.tsx`.

### Way 2 — `useApi()` hook (preferred for ad-hoc / non-OpenAPI routes)
```tsx
import { useApi } from "@/hooks/use-api";
const api = useApi();
const data = await api<MyType>("/api/me");
await api("/api/admin/tenants/abc/plan", { method: "PATCH", body: { plan: "growth" } });
```

### Way 3 — `apiFetch()` direct (no hook context; useful in event handlers outside a component)
```tsx
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/react";
const { getToken } = useAuth();
const data = await apiFetch<MyType>("/api/me", { getToken: () => getToken() });
```

All 3 throw `ApiHttpError` on non-2xx with `.status` and `.body` properties.

---

## 5. State Management

- **Server state:** TanStack Query (caching, invalidation, optimistic updates).
- **Form state:** react-hook-form.
- **UI state:** `useState` / `useReducer` — no Redux, no Zustand.
- **Cross-component state:** lift via props or React Context (used sparingly).

### Query key conventions
- `["tenant-credentials"]` — current user's Twilio creds
- `["twilio-account"]` — generated hook key
- `["admin-tenants"]` — admin tenants list
- `["me"]` — useMe profile (handled internally)

Invalidate after a mutation:
```tsx
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: () => api("/api/something", { method: "POST" }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant-credentials"] }),
});
```

---

## 6. Theming & Branding

- **Dark theme by default** — `<div className="… dark">` on root.
- **Colors:** CSS variables in `index.css` (e.g. `--background`, `--foreground`, `--primary`).
- **Primary brand color:** Twilio red `hsl(348 83% 47%)`.
- **Typography:** JetBrains Mono (monospace) + Inter (sans).
- **Spacing:** Tailwind defaults (4px base).
- **Clerk branding:** `clerkAppearance` in `App.tsx` — matches the rest of the app.

To rebrand (white-label):
1. Edit `index.css` CSS variables.
2. Replace `public/logo.svg`.
3. Update `clerkAppearance.variables.colorPrimary`.
4. Update `index.html` `<title>`.
5. Update marketing copy in `pages/landing.tsx`.

---

## 7. Routing Reference

See [`reference/ROUTES_MAP.md`](../reference/ROUTES_MAP.md) for the full route inventory.

---

## 8. Pages Function Proxy

`functions/api/[[path]].ts` is a Cloudflare Pages Function that:
1. Receives every `/api/*` request from the browser.
2. Forwards to `CF_WORKER_URL` (env var set on the Pages project).
3. Preserves `Authorization: Bearer <Clerk JWT>` (critical — without this every protected route 401s).
4. Handles CORS preflight (`OPTIONS`).
5. Mirrors response headers + adds CORS.

If you self-host the frontend elsewhere, replicate this proxy or set up a CORS-permissive backend.

---

## 9. Build + Deploy

```bash
# Build
cd artifacts/twilio-platform
pnpm run build
# Output: dist/public/

# Deploy
wrangler pages deploy dist/public --project-name rj-agent-frontend
# Set env vars (one-time):
wrangler pages secret put CF_WORKER_URL --project-name rj-agent-frontend
# Enter: https://twilio-platform-api.rickjefferson.workers.dev
wrangler pages secret put VITE_CLERK_PUBLISHABLE_KEY --project-name rj-agent-frontend
```

Or wire Cloudflare Pages to GitHub → auto-deploy on push to `main`.

---

## 10. Performance Tips

- **Lazy load heavy pages:** `const Heavy = React.lazy(() => import("./pages/heavy"))`.
- **Memoize expensive renders:** `React.memo`, `useMemo` for derived data only.
- **Defer images:** `<img loading="lazy">`.
- **Code-split charts:** recharts is heavy — only import the chart types you use.

Bundle audit:
```bash
pnpm run build
# Watch the vite output — chunks > 500 kB need attention.
```
