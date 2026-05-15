# Integrations Matrix

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

Every external service the platform talks to, what it does, where the secret lives, and what the fallback is.

---

## AI Model Providers

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | Primary LLM (Sonnet, Haiku, Opus) | OpenRouter |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4o, o1-mini | OpenRouter |
| **OpenRouter** | `OPENROUTER_API_KEY` | 200+ model gateway | — (last resort) |
| **Groq** | `GROQ_API_KEY` | Ultra-fast Llama 3.3 70B | OpenRouter |
| **Together AI** | `TOGETHER_API_KEY` | Open weights at scale | OpenRouter |
| **DeepSeek** | `DEEPSEEK_API_KEY` | DeepSeek-V3, R1 reasoning | OpenRouter |
| **Perplexity** | `PERPLEXITY_API_KEY` | Web-grounded search | Brave + Claude |
| **NVIDIA NIM** | `NVIDIA_API_KEY` | Llama, Nemotron on A100s | OpenRouter |
| **Moonshot Kimi** | `MOONSHOT_API_KEY` | Long-context Chinese/EN | OpenRouter |
| **MiniMax** | `MINIMAX_API_KEY` | MiniMax-Text-01 + audio | OpenRouter |
| **Infermatic** | `INFERMATIC_API_KEY` | Roleplay/creative | OpenRouter |
| **ZAI** | `ZAI_API_KEY` | Commercial inference | OpenRouter |
| **Chutes AI** | `CHUTES_API_KEY` | GPU-cloud open models | OpenRouter |
| **CLōD** | `CLOD_API_KEY` | OpenAI-compatible w/ extended context | OpenRouter |

---

## Communications

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **Twilio** | `TWILIO_*` (per-tenant) | SMS, Voice, Video, Conv, Verify, Lookup, Studio | None — core dependency |
| **Resend** | `RESEND_API_KEY` | Transactional + campaign email | Logged to console if missing |

---

## Identity & Billing

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **Clerk** | `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | Auth, user mgmt | None — core dependency |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Subscriptions, checkout, portal | Plan defaults to `free` if down |

---

## Search & Data

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **Brave Search** | `BRAVE_API_KEY` | Web + news search | RapidAPI search |
| **RapidAPI** | `RAPIDAPI_KEY` | 40k+ API gateway | None |
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | Geocoding, places, routing | None |
| **CourtListener** | `COURTLISTENER_API_KEY` | Court opinions, dockets | None |
| **Data.gov** | `DATAGOV_API_KEY` | US gov datasets | None |
| **GitHub** | `GITHUB_TOKEN` | Repo mgmt, code search | None |

---

## Credit / Finance

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **DisputeFox** | `DISPUTEFOX_API_KEY` | Credit-repair CRM | Manual mode |
| **MyFreeScoreNow** | `MFSN_API_KEY` | Credit monitoring | Manual mode |

---

## Payments (alt)

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **PayPal** | `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` | PayPal Checkout | Stripe |
| **Coinbase** | `COINBASE_API_KEY` | Crypto rates + CDP wallet | None |

---

## Automation

| Provider | Env Var | Used For | Fallback |
|---|---|---|---|
| **Composio** | `COMPOSIO_API_KEY` | 150+ pre-built integrations | None |
| **Memori** | `MEMORI_API_KEY` | Long-term agent memory | D1 `messages` table |

---

## Setting an Integration

```bash
cd artifacts/cf-worker
wrangler secret put <ENV_VAR_NAME>
# Paste the value, hit Enter
```

Frontend `/integrations` page polls `GET /api/integrations` which returns `{ ai: { anthropic: true, … }, … }` based on which env vars are non-empty on the Worker.
