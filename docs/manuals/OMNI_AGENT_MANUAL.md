# Omni-Agent (Standalone AI Chat) Manual

**Path:** `artifacts/twilio-omni-agent/`
**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Purpose

A standalone, embeddable AI chat surface. Same conversation persistence (D1) as the main platform, but a focused UI for AI-only workflows. Originally built as a Twilio expert assistant ("TWILIO OMNI-AGENT v3.0").

**Live URL:** Pages deployment under the project name `twilio-omni-agent`.

---

## 2. Stack

- Vite + React + TypeScript (same as twilio-platform)
- Streaming chat via `fetch` + ReadableStream
- Conversation history persisted via Worker `/api/anthropic/*` and `/api/openrouter/*`
- Multiple model providers selectable in the UI (Anthropic, OpenRouter, OpenAI, …)

---

## 3. Key Features

- **Streaming responses** — server-sent text from Anthropic/OpenRouter chunked into the UI
- **Conversation persistence** — every conversation stored in D1 `conversations` + `messages`
- **Model switching** — pick Claude 3.5 Sonnet, Haiku, Opus, or any OpenRouter model mid-conversation
- **System prompt** — embeds the TWILIO OMNI-AGENT v3.0 expert prompt

---

## 4. File Layout

```
artifacts/twilio-omni-agent/
├── src/
│   ├── App.tsx
│   ├── components/Chat.tsx
│   ├── lib/stream.ts          ← SSE → React state
│   └── prompts/twilio.ts      ← system prompt
├── functions/
│   └── api/
│       └── [[path]].ts        ← Proxy to Worker (same as twilio-platform)
├── package.json
└── wrangler.toml
```

---

## 5. Streaming Pattern

```ts
const res = await fetch("/api/anthropic/conversations/{id}/stream", { method: "POST", body: JSON.stringify({ message }) });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buf = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  for (const line of buf.split("\n")) {
    if (line.startsWith("data: ")) {
      const { text } = JSON.parse(line.slice(6));
      setAssistantMessage(prev => prev + text);
    }
  }
}
```

---

## 6. Deploy

```bash
cd artifacts/twilio-omni-agent
pnpm run build
wrangler pages deploy dist/public --project-name twilio-omni-agent
# One-time env:
wrangler pages secret put CF_WORKER_URL --project-name twilio-omni-agent
```

---

## 7. Embedding

To embed the chat into another site:
- Iframe the deployed Pages URL.
- Or extract `src/components/Chat.tsx` + `src/lib/stream.ts` and import into your app — adjust the API base URL.
