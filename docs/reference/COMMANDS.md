# Commands Reference

> Every CLI command you'll use to develop, build, test, deploy, and operate the platform.
> Run from the **repo root** unless otherwise noted. All commands assume you have run `pnpm install` once.

---

## Table of Contents

1. [Quick Cheat Sheet](#1-quick-cheat-sheet)
2. [pnpm — Workspace & Packages](#2-pnpm--workspace--packages)
3. [Wrangler — Cloudflare Workers / Pages / D1](#3-wrangler--cloudflare-workers--pages--d1)
4. [Drizzle — ORM & Migrations](#4-drizzle--orm--migrations)
5. [Git & GitHub CLI](#5-git--github-cli)
6. [Node, TypeScript, ESLint, Prettier](#6-node-typescript-eslint-prettier)
7. [Vite — Frontend Dev & Build](#7-vite--frontend-dev--build)
8. [Curl Recipes for the API](#8-curl-recipes-for-the-api)
9. [Operational One-Liners](#9-operational-one-liners)

---

## 1. Quick Cheat Sheet

| Goal | Command |
|---|---|
| Install everything | `pnpm install` |
| Start dev API (Express) | `pnpm dev` |
| Start frontend dev | `pnpm --filter @workspace/twilio-platform dev` |
| Start Worker dev | `pnpm --filter @workspace/cf-worker dev` |
| Typecheck everything | `pnpm run typecheck` |
| Typecheck one package | `pnpm --filter @workspace/cf-worker run typecheck` |
| Build a package | `pnpm --filter @workspace/twilio-platform build` |
| Regenerate API client | `pnpm run codegen` |
| Deploy Worker | `cd artifacts/cf-worker && pnpm wrangler deploy` |
| Deploy Pages | `cd artifacts/twilio-platform && pnpm wrangler pages deploy dist` |
| Tail Worker logs | `cd artifacts/cf-worker && pnpm wrangler tail` |
| D1 console | `cd artifacts/cf-worker && pnpm wrangler d1 execute rj-agent-db --command "SELECT 1"` |
| Push to PR | `git push -u origin genspark_ai_developer` |

---

## 2. pnpm — Workspace & Packages

### Setup

```bash
# Install pnpm globally (one time)
npm i -g pnpm@9

# Install all workspace deps
pnpm install

# Install with frozen lockfile (CI)
pnpm install --frozen-lockfile

# Clean install
rm -rf node_modules **/node_modules pnpm-lock.yaml && pnpm install
```

### Filtering — run a script in one package

```bash
# Syntax: pnpm --filter <package-name> <script>
pnpm --filter @workspace/cf-worker dev
pnpm --filter @workspace/twilio-platform dev
pnpm --filter @workspace/twilio-omni-agent dev
pnpm --filter @workspace/cf-worker run typecheck
pnpm --filter @workspace/twilio-platform build
```

### Filtering — multiple packages

```bash
# All packages matching a pattern
pnpm --filter "@workspace/*" run typecheck

# A package and everything it depends on
pnpm --filter "@workspace/twilio-platform..." build

# A package and everything that depends on it
pnpm --filter "...@workspace/cf-worker" run typecheck
```

### Adding / removing deps

```bash
# Add a runtime dep to a single package
pnpm --filter @workspace/cf-worker add hono

# Add a dev dep
pnpm --filter @workspace/cf-worker add -D vitest

# Add to workspace root
pnpm add -w -D typescript

# Remove
pnpm --filter @workspace/cf-worker remove hono
```

### Maintenance

```bash
# Outdated dependencies report
pnpm outdated -r

# Update all to latest (interactive)
pnpm update -r -i --latest

# Run a script in every package
pnpm -r run typecheck

# Rebuild native modules
pnpm rebuild
```

---

## 3. Wrangler — Cloudflare Workers / Pages / D1

Run from `artifacts/cf-worker/` for Worker commands; from `artifacts/twilio-platform/` for Pages.

### Auth

```bash
pnpm wrangler login            # opens browser
pnpm wrangler whoami           # show current account
pnpm wrangler logout
# Non-interactive (CI):
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
```

### Worker — develop

```bash
cd artifacts/cf-worker

# Local dev (Miniflare under the hood)
pnpm wrangler dev

# Bind to local D1
pnpm wrangler dev --local --persist-to=.wrangler/state

# Specific port
pnpm wrangler dev --port 8787
```

### Worker — deploy

```bash
cd artifacts/cf-worker

# Deploy to production
pnpm wrangler deploy

# Deploy to a named environment
pnpm wrangler deploy --env staging

# Dry-run (build only, don't ship)
pnpm wrangler deploy --dry-run --outdir=dist

# Specific compatibility date
pnpm wrangler deploy --compatibility-date 2024-12-01
```

### Worker — logs

```bash
cd artifacts/cf-worker

# Live tail
pnpm wrangler tail

# Filter
pnpm wrangler tail --status error
pnpm wrangler tail --search "twilio"
pnpm wrangler tail --format pretty
pnpm wrangler tail --format json | jq .
```

### Worker — secrets

```bash
cd artifacts/cf-worker

# Set a secret (prompts for value)
pnpm wrangler secret put CLERK_SECRET_KEY
pnpm wrangler secret put STRIPE_SECRET_KEY
pnpm wrangler secret put ANTHROPIC_API_KEY
pnpm wrangler secret put ENCRYPTION_KEY

# Pipe value in
echo "$VALUE" | pnpm wrangler secret put NAME

# List secret names (values never shown)
pnpm wrangler secret list

# Delete
pnpm wrangler secret delete KEY_NAME

# Bulk upload from JSON file
pnpm wrangler secret bulk secrets.json
```

### D1 database

```bash
cd artifacts/cf-worker

# Create a DB (one time)
pnpm wrangler d1 create rj-agent-db

# List databases
pnpm wrangler d1 list

# Run SQL (remote)
pnpm wrangler d1 execute rj-agent-db --command "SELECT count(*) FROM tenant_credentials"

# Run SQL (local dev DB)
pnpm wrangler d1 execute rj-agent-db --local --command "SELECT 1"

# Run a .sql file
pnpm wrangler d1 execute rj-agent-db --file migrations/0001_init.sql

# Export full DB
pnpm wrangler d1 export rj-agent-db --output backup-$(date +%Y%m%d).sql

# Time travel restore (point-in-time)
pnpm wrangler d1 time-travel info rj-agent-db
pnpm wrangler d1 time-travel restore rj-agent-db --timestamp "2026-05-14T12:00:00Z"

# Migrations (drizzle output)
pnpm wrangler d1 migrations apply rj-agent-db
pnpm wrangler d1 migrations apply rj-agent-db --local
pnpm wrangler d1 migrations list rj-agent-db
```

### Pages

```bash
cd artifacts/twilio-platform

# Build first
pnpm build

# Deploy to production project
pnpm wrangler pages deploy dist --project-name=rj-agent-frontend

# Deploy with a specific branch name
pnpm wrangler pages deploy dist --project-name=rj-agent-frontend --branch=main

# List projects
pnpm wrangler pages project list

# List deployments
pnpm wrangler pages deployment list --project-name=rj-agent-frontend

# Tail Pages Functions logs
pnpm wrangler pages deployment tail --project-name=rj-agent-frontend
```

### KV / R2 (if added later)

```bash
# KV
pnpm wrangler kv namespace create CACHE
pnpm wrangler kv key put --binding=CACHE "key" "value"
pnpm wrangler kv key list --binding=CACHE

# R2
pnpm wrangler r2 bucket create backups
pnpm wrangler r2 object put backups/db.sql --file=db.sql
pnpm wrangler r2 object list backups
```

---

## 4. Drizzle — ORM & Migrations

### Worker (D1 / SQLite dialect)

Run from `artifacts/cf-worker/`.

```bash
# Generate SQL migration from schema changes
pnpm drizzle-kit generate

# Generate with a name
pnpm drizzle-kit generate --name add_call_logs

# Push schema directly to dev D1 (skips migration files)
pnpm drizzle-kit push

# Open Drizzle Studio (visual DB browser)
pnpm drizzle-kit studio

# Introspect existing DB into schema
pnpm drizzle-kit introspect

# Apply migrations to D1 via wrangler
pnpm wrangler d1 migrations apply rj-agent-db
```

### Dev API (Postgres / Replit)

Run from repo root.

```bash
pnpm drizzle-kit generate --config drizzle.config.pg.ts
pnpm drizzle-kit migrate --config drizzle.config.pg.ts
pnpm drizzle-kit studio  --config drizzle.config.pg.ts
```

---

## 5. Git & GitHub CLI

### Daily flow

```bash
git status
git checkout genspark_ai_developer
git pull --rebase origin main
git add -A
git commit -m "feat(scope): describe change"
git push -u origin genspark_ai_developer
```

### Branching

```bash
git checkout -b feature/something
git branch -D feature/something      # delete local
git push origin --delete feature/something  # delete remote
```

### Sync & rebase

```bash
git fetch origin
git rebase origin/main
git rebase --continue    # after fixing conflicts
git rebase --abort
```

### Squashing multiple commits into one (non-interactive)

```bash
# Squash last N commits, keep changes staged
git reset --soft HEAD~3
git commit -m "feat: combined description"
git push -f origin genspark_ai_developer
```

### Inspect

```bash
git log --oneline -20
git log --graph --all --oneline -30
git diff               # unstaged
git diff --staged      # staged
git diff HEAD~1        # vs last commit
git show <sha>
git blame path/to/file
```

### Fixing mistakes

```bash
git restore path/to/file              # discard unstaged
git restore --staged path/to/file     # unstage
git commit --amend                    # edit last commit
git commit --amend --no-edit          # add to last commit, keep msg
git revert <sha>                      # safe undo (new commit)
git reset --hard origin/main          # nuke local, match remote (DANGEROUS)
```

### Stash

```bash
git stash push -m "wip: notes"
git stash list
git stash pop
git stash drop stash@{0}
```

### GitHub CLI (`gh`)

```bash
gh auth login
gh auth status

# Pull requests
gh pr create --base main --head genspark_ai_developer \
  --title "feat: master admin + Twilio fix" \
  --body  "Implements ..."
gh pr list
gh pr view 1
gh pr checks
gh pr merge 1 --squash --delete-branch

# Issues
gh issue list
gh issue create --title "..." --body "..."

# Repo
gh repo view --web
gh repo clone KaliVibeCoding/Omni-Agent
```

### Conventional Commit format

```
<type>(<scope>): <summary>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Examples:
- `feat(admin): add master admin allowlist`
- `fix(auth): preserve Authorization header in Pages proxy`
- `docs(reference): add COMMANDS.md`

---

## 6. Node, TypeScript, ESLint, Prettier

### Node

```bash
node --version           # require >=24
nvm install 24
nvm use 24
node --inspect script.js # debug
```

### TypeScript

```bash
# Typecheck a single package
pnpm --filter @workspace/cf-worker run typecheck

# Watch mode
pnpm --filter @workspace/cf-worker exec tsc --noEmit --watch

# Build emit
pnpm --filter @workspace/cf-worker exec tsc

# Show resolved config
pnpm --filter @workspace/cf-worker exec tsc --showConfig
```

### ESLint / Prettier

```bash
pnpm lint
pnpm lint --fix

pnpm format          # write
pnpm format:check    # CI
```

---

## 7. Vite — Frontend Dev & Build

Run from `artifacts/twilio-platform/`.

```bash
pnpm dev                      # dev server (http://localhost:5173)
pnpm dev --host               # expose on LAN
pnpm dev --port 3000

pnpm build                    # production build into dist/
pnpm build --mode staging     # alternate mode

pnpm preview                  # serve dist/ locally
```

Type-aware build chain:
```bash
pnpm typecheck && pnpm lint && pnpm build
```

---

## 8. Curl Recipes for the API

> Replace `$TOKEN` with a Clerk session JWT and `$API` with the Worker URL (e.g. `https://rj-agent-worker.workers.dev`).

### Health & identity

```bash
curl -s $API/health
curl -s $API/api/me -H "Authorization: Bearer $TOKEN" | jq .
```

### Twilio credentials

```bash
# Save
curl -s -X POST $API/api/integrations/twilio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountSid":"AC...","authToken":"...","fromNumber":"+15555550100"}'

# Check
curl -s $API/api/integrations/twilio -H "Authorization: Bearer $TOKEN" | jq .

# Delete
curl -s -X DELETE $API/api/integrations/twilio -H "Authorization: Bearer $TOKEN"
```

### Send SMS

```bash
curl -s -X POST $API/api/twilio/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"+15555550123","body":"Hello from RJ Agent"}'
```

### Admin (master admin only)

```bash
curl -s $API/api/admin/tenants -H "Authorization: Bearer $TOKEN" | jq .
curl -s $API/api/admin/metrics -H "Authorization: Bearer $TOKEN" | jq .

curl -s -X PATCH $API/api/admin/tenants/<userId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"business"}'

curl -s -X DELETE $API/api/admin/tenants/<userId> \
  -H "Authorization: Bearer $TOKEN"
```

### Stripe

```bash
curl -s -X POST $API/api/stripe/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_xxx"}'
```

---

## 9. Operational One-Liners

### Find a tenant in D1

```bash
pnpm wrangler d1 execute rj-agent-db --command \
  "SELECT user_id, plan, created_at FROM tenant_credentials WHERE user_id LIKE '%abc%'"
```

### Promote a user to a plan (master admin DB-side workaround)

```bash
pnpm wrangler d1 execute rj-agent-db --command \
  "UPDATE tenant_credentials SET plan='business' WHERE user_id='user_xxx'"
```

### Count SMS sent today

```bash
pnpm wrangler d1 execute rj-agent-db --command \
  "SELECT count(*) FROM sms_logs WHERE created_at >= date('now')"
```

### Backup before risky change

```bash
pnpm wrangler d1 export rj-agent-db \
  --output "backup-pre-change-$(date +%Y%m%d-%H%M%S).sql"
```

### Force redeploy frontend after env change

```bash
cd artifacts/twilio-platform && pnpm build && \
  pnpm wrangler pages deploy dist --project-name=rj-agent-frontend
```

### Roll Worker back to previous version

```bash
cd artifacts/cf-worker
pnpm wrangler deployments list
pnpm wrangler rollback <deployment-id>
```

### Generate a fresh ENCRYPTION_KEY

```bash
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Verify Clerk JWT locally (debug)

```bash
node -e "
const t=process.argv[1].split('.');
console.log(JSON.parse(Buffer.from(t[1],'base64url').toString()));
" "$TOKEN"
```

---

**See also:**
- [`API_ENDPOINTS.md`](API_ENDPOINTS.md) — every route the curl recipes above can target
- [`ENV_VARS.md`](ENV_VARS.md) — every variable referenced in deploy commands
- [`../operations/DEPLOY_WORKER.md`](../operations/DEPLOY_WORKER.md) — full deploy walkthrough
- [`../operations/RUNBOOK.md`](../operations/RUNBOOK.md) — day-2 ops
