import { Hono } from "hono";
import { cors } from "hono/cors";
import healthRoutes from "./routes/health";
import twilioRoutes from "./routes/twilio";
import anthropicRoutes from "./routes/anthropic";
import openrouterRoutes from "./routes/openrouter";
import webhookTesterRoutes from "./routes/webhook-tester";

export interface Env {
  DB: D1Database;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  TWILIO_PHONE_NUMBER: string;
  ANTHROPIC_API_KEY: string;
  OPENROUTER_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));

app.route("/api", healthRoutes);
app.route("/api/twilio", twilioRoutes);
app.route("/api/anthropic", anthropicRoutes);
app.route("/api/openrouter", openrouterRoutes);
app.route("/api/webhook-tester", webhookTesterRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
});

export default app;
