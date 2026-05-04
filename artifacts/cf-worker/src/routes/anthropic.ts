import { Hono } from "hono";
import { stream } from "hono/streaming";
import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../index";
import { query, queryOne, run } from "../lib/d1";
import { TWILIO_OMNI_AGENT_SYSTEM_PROMPT } from "../system-prompt";

const anthropic = new Hono<{ Bindings: Env }>();

function getAnthropicClient(env: Env): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

// ─── GET /conversations ───────────────────────────────────────────────────────

anthropic.get("/conversations", async (c) => {
  const rows = await query(c.env.DB,
    "SELECT * FROM conversations ORDER BY updated_at DESC"
  );
  return c.json(rows);
});

// ─── POST /conversations ──────────────────────────────────────────────────────

anthropic.post("/conversations", async (c) => {
  const { title } = await c.req.json<{ title: string }>();
  if (!title) return c.json({ error: "title is required" }, 400);
  const row = await queryOne(c.env.DB,
    "INSERT INTO conversations (title) VALUES (?) RETURNING *",
    [title]
  );
  return c.json(row, 201);
});

// ─── GET /conversations/:id ───────────────────────────────────────────────────

anthropic.get("/conversations/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const conv = await queryOne(c.env.DB,
    "SELECT * FROM conversations WHERE id = ?", [id]
  );
  if (!conv) return c.json({ error: "Conversation not found" }, 404);

  const msgs = await query(c.env.DB,
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", [id]
  );
  return c.json({ ...(conv as object), messages: msgs });
});

// ─── DELETE /conversations/:id ────────────────────────────────────────────────

anthropic.delete("/conversations/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await run(c.env.DB, "DELETE FROM messages WHERE conversation_id = ?", [id]);
  await run(c.env.DB, "DELETE FROM conversations WHERE id = ?", [id]);
  return c.body(null, 204);
});

// ─── POST /conversations/:id/messages (SSE streaming) ─────────────────────────

anthropic.post("/conversations/:id/messages", async (c) => {
  const id = Number(c.req.param("id"));
  const { content } = await c.req.json<{ content: string }>();
  if (!content) return c.json({ error: "content is required" }, 400);

  const conv = await queryOne(c.env.DB,
    "SELECT * FROM conversations WHERE id = ?", [id]
  );
  if (!conv) return c.json({ error: "Conversation not found" }, 404);

  const history = await query(c.env.DB,
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", [id]
  ) as Array<{ role: string; content: string }>;

  await run(c.env.DB,
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
    [id, content]
  );

  const chatMessages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content },
  ];

  const client = getAnthropicClient(c.env);

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return stream(c, async (s) => {
    let fullResponse = "";
    try {
      const anthropicStream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: TWILIO_OMNI_AGENT_SYSTEM_PROMPT,
        messages: chatMessages,
      });

      for await (const event of anthropicStream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullResponse += event.delta.text;
          await s.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }

      await run(c.env.DB,
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [id, fullResponse]
      );
      await run(c.env.DB,
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        [id]
      );
      await s.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      await s.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    }
  });
});

export default anthropic;
