# Testing Manual

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

> Testing is the weakest area of v7.0.0 — this manual sets the strategy and conventions for closing the gap.

---

## 1. Strategy

| Layer | Tool | Coverage target |
|---|---|---|
| **Unit (TS logic)** | Vitest | 80% of `lib/` packages |
| **Unit (Worker routes)** | Miniflare + Vitest | All `/api/admin/*`, `/api/tenant/*`, `/api/me` |
| **Unit (React components)** | Vitest + React Testing Library | All shared components in `components/` |
| **Integration (API)** | Vitest + real D1 (`--local`) | Tenant lifecycle, master admin flow |
| **End-to-end** | Playwright | Sign-up → connect → send SMS → upgrade plan |
| **Manual smoke** | This doc § 6 | Pre-release sign-off |

---

## 2. Vitest Config (shared)

`vitest.config.ts` per package:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",          // or "happy-dom" for React tests
    setupFiles: ["./test/setup.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
```

---

## 3. Test File Conventions

- Co-locate tests next to source: `foo.ts` ↔ `foo.test.ts`
- Use `describe` / `it` / `expect`
- Mock external services (Twilio, Stripe, Anthropic) via MSW or `vi.fn()`
- Never hit real APIs in unit tests; integration tests may use sandboxed Twilio test creds

---

## 4. Worker Tests (Miniflare)

```ts
import { Miniflare } from "miniflare";
import { describe, it, expect } from "vitest";

const mf = new Miniflare({
  modules: true,
  scriptPath: "src/index.ts",
  d1Databases: ["DB"],
  bindings: { ENCRYPTION_KEY: "deadbeef".repeat(8), CLERK_SECRET_KEY: "sk_test_..." },
});

it("GET /api/healthz returns ok", async () => {
  const r = await mf.dispatchFetch("http://x/api/healthz");
  expect(await r.json()).toEqual({ status: "ok" });
});
```

---

## 5. Frontend Tests

```tsx
import { render, screen } from "@testing-library/react";
import { ConnectPage } from "../pages/connect";

it("shows the connect form", () => {
  render(<ConnectPage />);
  expect(screen.getByText(/Account SID/)).toBeInTheDocument();
});
```

Wrap with `<ClerkProvider>` and `<QueryClientProvider>` test harnesses (factory in `test/setup.tsx`).

---

## 6. Pre-Release Smoke Checklist

Before deploying to prod, manually verify:

1. **Sign-up flow**
   - [ ] New email → verification → /connect lands correctly
2. **Master admin flow**
   - [ ] `rickjefferson@rickjeffersonsolutions.com` skips /connect → lands on /dashboard
   - [ ] /admin shows in sidebar
   - [ ] Admin → Tenants tab loads with real data
3. **Twilio credential save**
   - [ ] /connect with real Twilio AC + auth token → /dashboard with account info populated
4. **SMS send**
   - [ ] /sms → send to verified number → message arrives within 5 s
5. **Billing**
   - [ ] /billing → Subscribe to Starter → Stripe Checkout → success → plan reflects on /dashboard
6. **Webhook**
   - [ ] Cancel subscription in Stripe Portal → /dashboard plan drops to "free" within 30 s

---

## 7. Continuous Integration (TODO)

Pending: GitHub Actions workflow that runs:
- `pnpm install`
- `pnpm run typecheck`
- `pnpm run test`
- On `main` push: deploy Worker + Pages

Workflow file: `.github/workflows/ci.yml` (to be added).
