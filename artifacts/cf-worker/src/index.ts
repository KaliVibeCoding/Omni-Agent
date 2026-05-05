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

export interface Env {
  DB: D1Database;

  // Twilio (fallback / global — tenants use per-account credentials from D1)
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  TWILIO_PHONE_NUMBER: string;

  // AI
  ANTHROPIC_API_KEY: string;
  OPENROUTER_API_KEY: string;

  // Auth
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;

  // Tenant credential encryption (32-byte hex = 64 chars)
  ENCRYPTION_KEY: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Email (Resend)
  RESEND_API_KEY: string;

  // Frontend URL for Stripe redirect URLs
  APP_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

// ── Core routes ──────────────────────────────────────────────────────────────
app.route("/api", healthRoutes);
app.route("/api/twilio", twilioRoutes);
app.route("/api/twilio/video", videoRoutes);
app.route("/api/twilio/conv", conversationsRoutes);
app.route("/api/twilio/telehealth", telehealthRoutes);

// ── AI routes ────────────────────────────────────────────────────────────────
app.route("/api/anthropic", anthropicRoutes);
app.route("/api/openrouter", openrouterRoutes);

// ── Platform routes ──────────────────────────────────────────────────────────
app.route("/api/webhook-tester", webhookTesterRoutes);
app.route("/api/tenant", tenantRoutes);
app.route("/api/stripe", stripeRoutes);
app.route("/api/niche", nicheRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
});

export default app;
