# AGI Multi-Agent Framework

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Overview

The AGI Framework (page: `/agi-framework`) lets tenants compose **directed pipelines of AI agents** that consume tenant data, call external APIs, and emit actions on Twilio (SMS, voice, email) or D1 (records).

Each "agent" is a typed node: structured JSON input → LLM call → structured JSON output → next node.

---

## 2. Node Types

| Type | Description | Provider |
|---|---|---|
| `intent` | Classifies user input into a small label set | Claude Haiku |
| `extract` | Pulls structured fields from free text | Claude Sonnet + JSON mode |
| `decide` | Branches the pipeline (router) | Claude Sonnet |
| `summarize` | Reduces N messages → 1 summary | Claude Haiku |
| `compose` | Drafts outbound SMS/email | Claude Sonnet |
| `voice` | Generates TwiML for outbound call | Claude Sonnet + Twilio Voice |
| `lookup` | External enrichment (CourtListener, Maps, etc.) | API call, not LLM |
| `persist` | Writes to `niche_records` | D1 write |
| `notify` | Sends SMS/email via tenant Twilio + Resend | Twilio + Resend |

---

## 3. Pipeline Schema (D1 row in `conversations` with provider=`agi`)

```json
{
  "id": "pipe_abc",
  "name": "New Lead Triage",
  "trigger": {
    "type": "inbound-sms",
    "match": ".*"
  },
  "nodes": [
    { "id": "n1", "type": "intent", "labels": ["question","appointment","complaint"] },
    { "id": "n2", "type": "decide", "rules": { "appointment": "n3", "*": "n4" } },
    { "id": "n3", "type": "compose", "template": "appointment-offer" },
    { "id": "n4", "type": "notify", "channel": "sms", "from": "n3.output.message" }
  ]
}
```

---

## 4. Execution Model

- **Inbound trigger** (webhook from Twilio) → Worker resolves tenant → loads pipeline
- **Sequential execution**, top-to-bottom by default, branches via `decide` nodes
- **State** carried as a single JSON object passed between nodes
- **Token budget** — pipelines abort if total tokens > tenant plan limit
- **Audit** — each node's input/output appended to `messages` for replay

---

## 5. Cost Model

- All Claude calls metered via Anthropic API
- OpenRouter fallback when `ANTHROPIC_API_KEY` missing
- Per-tenant token usage rolled up into `/usage` dashboard
- Plan limits:
  - `starter` — disabled
  - `growth` — 100k tokens/mo
  - `business` — 1M tokens/mo
  - `enterprise` — unlimited

---

## 6. Adding a New Node Type

1. Define a Zod schema in `cf-worker/src/agi/schemas.ts`
2. Add a handler in `cf-worker/src/agi/nodes/<type>.ts` exporting `async function run(input, env): Promise<output>`
3. Register in the dispatcher map (`cf-worker/src/agi/dispatch.ts`)
4. Add UI editor in `twilio-platform/src/pages/agi-framework.tsx`
5. Document in this file and ship
