# Style Guide — Code, Branding, UX

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. TypeScript Conventions

```ts
// ✅ Good
interface User {
  id: string;
  email: string;
}

async function getUser(id: string): Promise<User | null> {
  const row = await queryOne<User>(db, "SELECT * FROM users WHERE id=?", [id]);
  return row;
}

// ❌ Bad
function getUser(id: any): any {
  return db.query(`SELECT * FROM users WHERE id='${id}'`);  // SQL injection
}
```

- `interface` for object shapes (extends-friendly)
- `type` for unions, intersections, function signatures
- Discriminated unions over enums:
  ```ts
  type Result = { ok: true; value: string } | { ok: false; error: string };
  ```
- Async/await over `.then()`
- Optional chaining and nullish coalescing freely

---

## 2. React Conventions

```tsx
// ✅ Good
export function MyCard({ title }: { title: string }) {
  const { data, isLoading } = useQuery({ ... });
  if (isLoading) return <Skeleton />;
  return <div className="rounded-xl bg-card p-4"><h2>{title}</h2></div>;
}

// ❌ Bad
export default class MyCard extends React.Component { ... }  // no classes
```

- One component per file, default-export the main one
- Hooks at the top, no conditional hooks
- Tailwind class order: layout → spacing → typography → color → state
- Conditional classes via `cn()`:
  ```tsx
  <button className={cn("rounded-md px-3 py-2", active && "bg-primary text-white")} />
  ```

---

## 3. File Naming

| Type | Convention | Example |
|---|---|---|
| React component file | kebab-case | `phone-numbers.tsx` |
| Component export | PascalCase | `export default PhoneNumbers` |
| Hook file | `use-*.ts` | `use-api.ts` |
| Lib file | kebab-case | `encrypt.ts` |
| Type file | kebab-case | `api-types.ts` |
| Test file | sibling `.test.ts` | `encrypt.test.ts` |

---

## 4. Commit Messages

Conventional commits:
- `feat(scope): …` — new feature
- `fix(scope): …` — bug fix
- `chore: …` — tooling, deps
- `docs: …` — documentation only
- `refactor(scope): …` — no behavior change
- `perf(scope): …` — performance
- `test(scope): …` — tests
- `revert: …` — reverts

Scope examples: `auth`, `admin`, `billing`, `niche`, `worker`, `frontend`.

---

## 5. Branding

| Element | Value |
|---|---|
| **Product name** | RJ Business Solutions Omni-Agent Platform |
| **Short name** | RJ Omni-Agent |
| **Primary color** | `hsl(348 83% 47%)` — Twilio Red |
| **Background** | `hsl(222 47% 8%)` — Near black |
| **Surface** | `hsl(222 47% 13%)` — Slate |
| **Foreground** | `hsl(210 40% 98%)` — Near white |
| **Font (monospace)** | `'JetBrains Mono', monospace` |
| **Font (sans)** | `Inter, system-ui, sans-serif` |
| **Logo** | `public/logo.svg` |
| **Tagline** | "Enterprise communications and AI automation" |

---

## 6. UX Patterns

### Loading states
- Spinner: `<Loader2 className="animate-spin" />`
- Skeleton card for table/grid loading
- Never block the entire page — show structure + skeleton

### Empty states
- Icon + short headline + suggested action
- Example:
  ```tsx
  <div className="text-center py-12">
    <Users className="size-8 mx-auto opacity-30 mb-2" />
    <p className="text-sm">No contacts yet.</p>
    <Button variant="outline" size="sm" className="mt-3">Add your first</Button>
  </div>
  ```

### Error states
- Toast (sonner) for transient errors
- Inline red banner for form errors
- Full-page error for unrecoverable

### Confirmation dialogs
- For destructive actions (delete tenant, disconnect Twilio)
- Use `<AlertDialog>` from shadcn

### Form patterns
- Required field marker: `<span className="text-red-400">*</span>`
- Error message below input in red
- Submit button disabled while pending
- Show inline success ("Saved!") that fades after 2s

### Status badges
- Plan badges: starter (blue), growth (green), business (red), enterprise (purple)
- Status badges: success (green), warning (yellow), error (red), info (blue)

---

## 7. Accessibility

- All interactive elements keyboard-accessible (tab order, Enter to activate)
- ARIA labels for icon-only buttons: `<Button aria-label="Delete">…</Button>`
- Sufficient color contrast (WCAG AA — 4.5:1 for text)
- Focus rings on keyboard navigation (Tailwind `focus-visible:` utilities)
- `<input>` always paired with `<label>`

---

## 8. Performance Patterns

- **`React.memo`** components rendered in long lists
- **`useMemo`** for derived data computed every render
- **`useCallback`** for stable refs passed to memoized children
- **`React.lazy`** for routes > 100 kB
- **Image optimization** — SVG > WebP > PNG; `loading="lazy"` always

---

## 9. Anti-Patterns to Avoid

- ❌ `localStorage` for auth state — Clerk handles it
- ❌ Hand-rolled JWT parsing — use Clerk SDK
- ❌ `useEffect` for data fetching — use TanStack Query
- ❌ Inline SQL — use `?` placeholders, never string concat
- ❌ `dangerouslySetInnerHTML` — use proper React rendering
- ❌ Global state libraries (Redux, Zustand) — props + Context + Query are enough
- ❌ Default exports in `lib/` packages — named exports only (better tree-shaking)
