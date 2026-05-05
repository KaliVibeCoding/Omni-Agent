import { Hono } from "hono";
import { stream } from "hono/streaming";
import type { Env } from "../index";

const ai = new Hono<{ Bindings: Env }>();

// ── Provider registry ─────────────────────────────────────────────────────────

interface Provider {
  name: string;
  baseUrl: string;
  keyEnv: keyof Env;
  models: string[];
  defaultModel: string;
}

function getProviders(env: Env): Record<string, Provider> {
  return {
    groq: {
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      keyEnv: "GROQ_API_KEY",
      models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
      defaultModel: "llama-3.3-70b-versatile",
    },
    together: {
      name: "Together AI",
      baseUrl: "https://api.together.xyz/v1",
      keyEnv: "TOGETHER_AI_API_KEY",
      models: ["meta-llama/Llama-3-70b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
      defaultModel: "meta-llama/Llama-3-70b-chat-hf",
    },
    deepseek: {
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      keyEnv: "DEEPSEEK_API_KEY",
      models: ["deepseek-chat", "deepseek-reasoner"],
      defaultModel: "deepseek-chat",
    },
    perplexity: {
      name: "Perplexity",
      baseUrl: "https://api.perplexity.ai",
      keyEnv: "PERPLEXITY_API_KEY",
      models: ["llama-3.1-sonar-large-128k-online", "llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-huge-128k-online"],
      defaultModel: "llama-3.1-sonar-large-128k-online",
    },
    nvidia: {
      name: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      keyEnv: "NVIDIA_API_KEY",
      models: ["meta/llama-3.3-70b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct", "mistralai/mixtral-8x7b-instruct"],
      defaultModel: "meta/llama-3.3-70b-instruct",
    },
    kimi: {
      name: "Moonshot Kimi",
      baseUrl: "https://api.moonshot.cn/v1",
      keyEnv: "KIMI_API_KEY",
      models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
      defaultModel: "moonshot-v1-32k",
    },
    clod: {
      name: "CLōD",
      baseUrl: "https://api.clod.io/v1",
      keyEnv: "CLOD_API_KEY",
      models: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"],
      defaultModel: "claude-sonnet-4-5",
    },
    minimax: {
      name: "MiniMax",
      baseUrl: "https://api.minimax.io/v1",
      keyEnv: "MINIMAX_API_KEY",
      models: ["MiniMax-Text-01", "abab6.5s-chat"],
      defaultModel: "MiniMax-Text-01",
    },
    infermatic: {
      name: "Infermatic",
      baseUrl: "https://api.totalgpt.ai",
      keyEnv: "INFERMATIC_API_KEY",
      models: ["Infermatic-MN-12B-Celeste-V1.9", "Sao10K-72B-Qwen2.5-Instruct"],
      defaultModel: "Infermatic-MN-12B-Celeste-V1.9",
    },
    zai: {
      name: "ZAI",
      baseUrl: "https://api.zai.ai/v1",
      keyEnv: "ZAI_API_KEY",
      models: ["zai-ultra", "zai-pro"],
      defaultModel: "zai-ultra",
    },
    chutes: {
      name: "Chutes AI",
      baseUrl: "https://llm.chutes.ai/v1",
      keyEnv: "CHUTES_API_KEY",
      models: ["deepseek-ai/DeepSeek-V3-0324", "Qwen/Qwen3-235B-A22B", "unsloth/Llama-4-Maverick-17B-128E-Instruct-GGUF"],
      defaultModel: "deepseek-ai/DeepSeek-V3-0324",
    },
    openai: {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      keyEnv: "OPENAI_API_KEY",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini"],
      defaultModel: "gpt-4o",
    },
  };
}

// ── GET /providers — list all providers + models ──────────────────────────────

ai.get("/providers", (c) => {
  const providers = getProviders(c.env);
  const list = Object.entries(providers).map(([id, p]) => ({
    id,
    name: p.name,
    models: p.models,
    defaultModel: p.defaultModel,
    available: !!c.env[p.keyEnv],
  }));
  return c.json({ providers: list });
});

// ── POST /chat — unified chat across any provider ─────────────────────────────

ai.post("/chat", async (c) => {
  const body = await c.req.json<{
    provider: string;
    model?: string;
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
    system?: string;
  }>();

  const providers = getProviders(c.env);
  const prov = providers[body.provider];
  if (!prov) return c.json({ error: `Unknown provider: ${body.provider}` }, 400);

  const apiKey = c.env[prov.keyEnv] as string;
  if (!apiKey) return c.json({ error: `${prov.name} API key not configured` }, 503);

  const model = body.model || prov.defaultModel;
  const messages = body.system
    ? [{ role: "system", content: body.system }, ...body.messages]
    : body.messages;

  const payload = {
    model,
    messages,
    max_tokens: body.max_tokens ?? 4096,
    temperature: body.temperature ?? 0.7,
    stream: body.stream ?? false,
  };

  if (body.stream) {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("X-Accel-Buffering", "no");

    return stream(c, async (s) => {
      try {
        const resp = await fetch(`${prov.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok || !resp.body) {
          await s.write(`data: ${JSON.stringify({ error: await resp.text() })}\n\n`);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            await s.write(line + "\n\n");
          }
        }
      } catch (err) {
        await s.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
      }
    });
  }

  const resp = await fetch(`${prov.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, stream: false }),
  });

  const data = await resp.json() as Record<string, unknown>;
  if (!resp.ok) return c.json({ error: data }, resp.status as 400 | 500);
  return c.json(data);
});

// ── POST /compare — run same prompt across multiple providers ─────────────────

ai.post("/compare", async (c) => {
  const { prompt, providers: providerIds, system } = await c.req.json<{
    prompt: string;
    providers: string[];
    system?: string;
  }>();

  const registry = getProviders(c.env);
  const messages = system
    ? [{ role: "system", content: system }, { role: "user", content: prompt }]
    : [{ role: "user", content: prompt }];

  const results = await Promise.allSettled(
    providerIds.map(async (id) => {
      const prov = registry[id];
      if (!prov) return { id, error: "Unknown provider" };
      const apiKey = c.env[prov.keyEnv] as string;
      if (!apiKey) return { id, error: "API key not configured" };

      const start = Date.now();
      const resp = await fetch(`${prov.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: prov.defaultModel, messages, max_tokens: 1024, stream: false }),
      });
      const data = await resp.json() as Record<string, unknown>;
      const latency = Date.now() - start;
      const content = (data as any)?.choices?.[0]?.message?.content ?? JSON.stringify(data);
      return { id, name: prov.name, model: prov.defaultModel, content, latency };
    })
  );

  const responses = results.map((r) => r.status === "fulfilled" ? r.value : { error: String((r as PromiseRejectedResult).reason) });
  return c.json({ prompt, responses });
});

export default ai;
