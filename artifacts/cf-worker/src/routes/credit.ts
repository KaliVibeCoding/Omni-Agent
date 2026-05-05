import { Hono } from "hono";
import type { Env } from "../index";

const credit = new Hono<{ Bindings: Env }>();

// ── DisputeFox — credit repair platform ──────────────────────────────────────

const DISPUTEFOX_BASE = "https://pulse.disputeprocess.com/api";

credit.get("/disputefox/clients", async (c) => {
  if (!c.env.DISPUTEFOX_API_KEY) return c.json({ error: "DisputeFox API key not configured" }, 503);

  const resp = await fetch(`${DISPUTEFOX_BASE}/clients`, {
    headers: {
      "Authorization": `Bearer ${c.env.DISPUTEFOX_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

credit.get("/disputefox/clients/:id", async (c) => {
  if (!c.env.DISPUTEFOX_API_KEY) return c.json({ error: "DisputeFox API key not configured" }, 503);
  const id = c.req.param("id");

  const resp = await fetch(`${DISPUTEFOX_BASE}/clients/${id}`, {
    headers: { "Authorization": `Bearer ${c.env.DISPUTEFOX_API_KEY}` },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

credit.post("/disputefox/clients", async (c) => {
  if (!c.env.DISPUTEFOX_API_KEY) return c.json({ error: "DisputeFox API key not configured" }, 503);
  const body = await c.req.json();

  const resp = await fetch(`${DISPUTEFOX_BASE}/clients`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${c.env.DISPUTEFOX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json(), 201);
});

credit.get("/disputefox/disputes", async (c) => {
  if (!c.env.DISPUTEFOX_API_KEY) return c.json({ error: "DisputeFox API key not configured" }, 503);
  const clientId = c.req.query("clientId");

  const url = new URL(`${DISPUTEFOX_BASE}/disputes`);
  if (clientId) url.searchParams.set("client_id", clientId);

  const resp = await fetch(url.toString(), {
    headers: { "Authorization": `Bearer ${c.env.DISPUTEFOX_API_KEY}` },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

credit.post("/disputefox/disputes", async (c) => {
  if (!c.env.DISPUTEFOX_API_KEY) return c.json({ error: "DisputeFox API key not configured" }, 503);
  const body = await c.req.json();

  const resp = await fetch(`${DISPUTEFOX_BASE}/disputes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${c.env.DISPUTEFOX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json(), 201);
});

// ── MyFreeScoreNow — credit monitoring ───────────────────────────────────────

credit.post("/mfsn/enroll", async (c) => {
  if (!c.env.MFSN_AID) return c.json({ error: "MFSN not configured" }, 503);
  const body = await c.req.json();

  const resp = await fetch(`${c.env.MFSN_API_URL}/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      aid: c.env.MFSN_AID,
      pid: c.env.MFSN_DEFAULT_PID,
      ...body,
    }),
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json(), 201);
});

credit.get("/mfsn/report/:memberId", async (c) => {
  if (!c.env.MFSN_AID) return c.json({ error: "MFSN not configured" }, 503);
  const memberId = c.req.param("memberId");

  const resp = await fetch(`${c.env.MFSN_API_URL}/report/${memberId}?aid=${c.env.MFSN_AID}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

// ── Credit analysis AI ────────────────────────────────────────────────────────

credit.post("/analyze", async (c) => {
  const { reportData, goal } = await c.req.json<{
    reportData: Record<string, unknown>;
    goal?: string;
  }>();

  if (!c.env.OPENAI_API_KEY && !c.env.GROQ_API_KEY) {
    return c.json({ error: "No AI provider configured for credit analysis" }, 503);
  }

  const apiKey = c.env.OPENAI_API_KEY || c.env.GROQ_API_KEY;
  const baseUrl = c.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : "https://api.groq.com/openai/v1";
  const model = c.env.OPENAI_API_KEY ? "gpt-4o" : "llama-3.3-70b-versatile";

  const prompt = `You are a certified credit repair specialist. Analyze this credit report data and provide actionable recommendations:

Credit Report Data:
${JSON.stringify(reportData, null, 2)}

Client Goal: ${goal || "Improve credit score as quickly as possible"}

Provide:
1. Score assessment and trajectory
2. Top 3 negative items to dispute (with dispute letter strategy)
3. Credit utilization recommendations
4. Timeline estimate for improvement
5. Specific next steps`;

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    }),
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const data = await resp.json() as Record<string, unknown>;
  return c.json({
    analysis: (data as any).choices?.[0]?.message?.content,
    model,
  });
});

export default credit;
