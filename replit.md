# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### twilio-platform (previewPath: `/`)
Full-featured Twilio Communications Platform dashboard. React + Vite frontend with dark theme.

**Pages (all fully implemented):**
- `/` — Dashboard: live account status, balance, active calls, recent calls/messages, phone numbers
- `/sms` — SMS Center: compose SMS, message history with filtering
- `/calls` — Call Manager: make calls, active calls, recent calls, recordings playback
- `/phone-numbers` — Phone Numbers: list numbers, edit friendly name/webhook URLs
- `/lookup` — Number Lookup: carrier, line type intelligence, caller name
- `/voicemails` — Voicemails: transcriptions, recordings, SMS reply
- `/usage` — Usage & Billing: today/month usage records and costs
- `/alerts` — Alerts: Twilio Monitor error/warning log
- `/verify` — Verify (2FA): manage services, send/check verification codes
- `/messaging-services` — Messaging Services: list services, view assigned numbers
- `/studio` — Studio Flows: list flows, view executions, trigger flows
- `/queues` — Call Queues: create/delete queues, view live members
- `/conferences` — Active Conferences: live participant management, mute/end
- `/contacts` — Contacts: full CRUD, search, quick-dial/SMS links
- `/settings` — Settings: account info, phone numbers, webhook URL references

**Tech:** wouter router, React Query (@tanstack/react-query), shadcn/ui components, lucide icons, date-fns, dark theme CSS variables.

### api-server (port 8080)
Express API server with all Twilio routes at `/api/twilio/...`

**Key route groups:**
- `/api/twilio/account` — account info
- `/api/twilio/phone-numbers` — list/update numbers
- `/api/twilio/sms/messages`, `/api/twilio/send-sms` — SMS
- `/api/twilio/calls/active`, `/calls/recent`, `/calls/outbound`, `/calls/:sid/hangup` — calls
- `/api/twilio/recordings` — recordings
- `/api/twilio/voicemails` — transcriptions
- `/api/twilio/usage/today`, `/usage/thismonth` — usage
- `/api/twilio/alerts` — Monitor alerts
- `/api/twilio/verify/services`, `/verify/send`, `/verify/check` — Verify
- `/api/twilio/messaging-services` — Messaging Services
- `/api/twilio/studio/flows` — Studio
- `/api/twilio/queues` — queues
- `/api/twilio/conferences/active` — conferences
- `/api/twilio/contacts` — local contacts (PostgreSQL)
- `/api/twilio/lookup` — number lookup

**Credentials** stored as Replit secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_PHONE_NUMBER`.
