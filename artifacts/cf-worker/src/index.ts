import { Hono } from "hono";
import { cors } from "hono/cors";
import healthRoutes from "./routes/health";
import twilioRoutes from "./routes/twilio";
import anthropicRoutes from "./routes/anthropic";
import openrouterRoutes from "./routes/openrouter";
import webhookTesterRoutes from "./routes/webhook-tester";
import videoRoutes from "./routes/video";
import conversationsRoutes from "./routes/twilio-conversations";
import telehealthRoutes from "./routes/telehealth";
import tenantRoutes from "./routes/tenant";
import stripeRoutes from "./routes/stripe";
import nicheRoutes from "./routes/niche";
import aiModelsRoutes from "./routes/ai-models";
import searchRoutes from "./routes/search";
import paymentsRoutes from "./routes/payments";
import dataApisRoutes from "./routes/data-apis";
import creditRoutes from "./routes/credit";

export interface Env {
  DB: D1Database;

  // ── Twilio ────────────────────────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  TWILIO_PHONE_NUMBER: string;

  // ── AI — primary ──────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  CLOD_API_KEY: string;

  // ── AI — extended providers ───────────────────────────────────────────────
  GROQ_API_KEY: string;
  TOGETHER_AI_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  PERPLEXITY_API_KEY: string;
  NVIDIA_API_KEY: string;
  KIMI_API_KEY: string;
  MINIMAX_API_KEY: string;
  MINIMAX_AUDIO_KEY: string;
  INFERMATIC_API_KEY: string;
  ZAI_API_KEY: string;
  CHUTES_API_KEY: string;

  // ── Search ────────────────────────────────────────────────────────────────
  BRAVE_API_KEY: string;
  RAPIDAPI_KEY: string;

  // ── Auth ──────────────────────────────────────────────────────────────────
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;

  // ── Encryption ────────────────────────────────────────────────────────────
  ENCRYPTION_KEY: string;

  // ── Payments ──────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  COINBASE_API_KEY_ID: string;
  COINBASE_API_SECRET: string;

  // ── Credit & financial ────────────────────────────────────────────────────
  DISPUTEFOX_API_KEY: string;
  MFSN_API_URL: string;
  MFSN_AID: string;
  MFSN_DEFAULT_PID: string;

  // ── Data & research ───────────────────────────────────────────────────────
  COURT_LISTENER_API_KEY: string;
  DATA_GOV_API_KEY: string;
  GOOGLE_API_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  GITHUB_TOKEN: string;

  // ── Productivity & automation ─────────────────────────────────────────────
  COMPOSIO_API_KEY: string;
  MEMORI_API_KEY: string;

  // ── Email ─────────────────────────────────────────────────────────────────
  RESEND_API_KEY: string;

  // ── Config ────────────────────────────────────────────────────────────────
  APP_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

// ── Core routes ───────────────────────────────────────────────────────────────
app.route("/api", healthRoutes);
app.route("/api/twilio", twilioRoutes);
app.route("/api/twilio/video", videoRoutes);
app.route("/api/twilio/conv", conversationsRoutes);
app.route("/api/twilio/telehealth", telehealthRoutes);

// ── AI routes ─────────────────────────────────────────────────────────────────
app.route("/api/anthropic", anthropicRoutes);
app.route("/api/openrouter", openrouterRoutes);
app.route("/api/ai", aiModelsRoutes);

// ── Search routes ─────────────────────────────────────────────────────────────
app.route("/api/search", searchRoutes);

// ── Payment routes ────────────────────────────────────────────────────────────
app.route("/api/payments", paymentsRoutes);

// ── Data & research routes ────────────────────────────────────────────────────
app.route("/api/data", dataApisRoutes);

// ── Credit routes ─────────────────────────────────────────────────────────────
app.route("/api/credit", creditRoutes);

// ── Platform routes ───────────────────────────────────────────────────────────
app.route("/api/webhook-tester", webhookTesterRoutes);
app.route("/api/tenant", tenantRoutes);
app.route("/api/stripe", stripeRoutes);
app.route("/api/niche", nicheRoutes);

// ── Integrations status ───────────────────────────────────────────────────────
app.get("/api/integrations", (c) => {
  const check = (key: string) => !!((c.env as unknown) as Record<string, string>)[key];
  return c.json({
    ai: {
      anthropic: check("ANTHROPIC_API_KEY"),
      openai: check("OPENAI_API_KEY"),
      openrouter: check("OPENROUTER_API_KEY"),
      clod: check("CLOD_API_KEY"),
      groq: check("GROQ_API_KEY"),
      together: check("TOGETHER_AI_API_KEY"),
      deepseek: check("DEEPSEEK_API_KEY"),
      perplexity: check("PERPLEXITY_API_KEY"),
      nvidia: check("NVIDIA_API_KEY"),
      kimi: check("KIMI_API_KEY"),
      minimax: check("MINIMAX_API_KEY"),
      infermatic: check("INFERMATIC_API_KEY"),
      zai: check("ZAI_API_KEY"),
      chutes: check("CHUTES_API_KEY"),
    },
    search: {
      brave: check("BRAVE_API_KEY"),
      rapidapi: check("RAPIDAPI_KEY"),
    },
    payments: {
      stripe: check("STRIPE_SECRET_KEY"),
      paypal: check("PAYPAL_CLIENT_ID"),
      coinbase: check("COINBASE_API_KEY_ID"),
    },
    communications: {
      twilio: check("TWILIO_ACCOUNT_SID"),
    },
    auth: {
      clerk: check("CLERK_SECRET_KEY"),
    },
    credit: {
      disputefox: check("DISPUTEFOX_API_KEY"),
      mfsn: check("MFSN_AID"),
    },
    data: {
      courtlistener: check("COURT_LISTENER_API_KEY"),
      datagov: check("DATA_GOV_API_KEY"),
      google_maps: check("GOOGLE_MAPS_API_KEY"),
      github: check("GITHUB_TOKEN"),
    },
    automation: {
      composio: check("COMPOSIO_API_KEY"),
      memori: check("MEMORI_API_KEY"),
    },
    email: {
      resend: check("RESEND_API_KEY"),
    },
  });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
});

export default app;
