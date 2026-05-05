import { Hono } from "hono";
import type { Env } from "../index";

const search = new Hono<{ Bindings: Env }>();

// ── GET /web?q=... — Brave web search ─────────────────────────────────────────

search.get("/web", async (c) => {
  const q = c.req.query("q");
  const count = Number(c.req.query("count") ?? 10);
  if (!q) return c.json({ error: "q is required" }, 400);

  if (!c.env.BRAVE_API_KEY) return c.json({ error: "Brave API key not configured" }, 503);

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", q);
  url.searchParams.set("count", String(Math.min(count, 20)));

  const resp = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": c.env.BRAVE_API_KEY,
    },
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const data = await resp.json() as Record<string, unknown>;

  const results = ((data as any).web?.results ?? []).map((r: any) => ({
    title: r.title,
    url: r.url,
    description: r.description,
    published: r.page_age,
  }));

  return c.json({ query: q, results, total: results.length });
});

// ── POST /perplexity — Perplexity AI search ───────────────────────────────────

search.post("/perplexity", async (c) => {
  const { query: q, model = "llama-3.1-sonar-large-128k-online" } = await c.req.json<{
    query: string;
    model?: string;
  }>();

  if (!q) return c.json({ error: "query is required" }, 400);
  if (!c.env.PERPLEXITY_API_KEY) return c.json({ error: "Perplexity API key not configured" }, 503);

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${c.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Be precise and concise. Always cite your sources." },
        { role: "user", content: q },
      ],
      return_citations: true,
      return_images: false,
    }),
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const data = await resp.json() as Record<string, unknown>;
  const choice = (data as any).choices?.[0];

  return c.json({
    query: q,
    model,
    content: choice?.message?.content,
    citations: (data as any).citations ?? [],
    usage: (data as any).usage,
  });
});

// ── GET /news?q=... — Brave news search ───────────────────────────────────────

search.get("/news", async (c) => {
  const q = c.req.query("q");
  const count = Number(c.req.query("count") ?? 10);
  if (!q) return c.json({ error: "q is required" }, 400);
  if (!c.env.BRAVE_API_KEY) return c.json({ error: "Brave API key not configured" }, 503);

  const url = new URL("https://api.search.brave.com/res/v1/news/search");
  url.searchParams.set("q", q);
  url.searchParams.set("count", String(Math.min(count, 20)));

  const resp = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "X-Subscription-Token": c.env.BRAVE_API_KEY,
    },
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const data = await resp.json() as Record<string, unknown>;

  const articles = ((data as any).results ?? []).map((a: any) => ({
    title: a.title,
    url: a.url,
    description: a.description,
    source: a.meta_url?.hostname,
    age: a.age,
  }));

  return c.json({ query: q, articles });
});

// ── POST /rapidapi — RapidAPI proxy ───────────────────────────────────────────

search.post("/rapidapi", async (c) => {
  const { endpoint, method = "GET", params, body: reqBody } = await c.req.json<{
    endpoint: string;
    method?: string;
    params?: Record<string, string>;
    body?: unknown;
  }>();

  if (!endpoint) return c.json({ error: "endpoint is required" }, 400);
  if (!c.env.RAPIDAPI_KEY) return c.json({ error: "RapidAPI key not configured" }, 503);

  const url = new URL(endpoint);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const resp = await fetch(url.toString(), {
    method,
    headers: {
      "X-RapidAPI-Key": c.env.RAPIDAPI_KEY,
      "Content-Type": "application/json",
    },
    ...(reqBody ? { body: JSON.stringify(reqBody) } : {}),
  });

  const data = await resp.json().catch(() => resp.text());
  return c.json({ status: resp.status, data });
});

export default search;
