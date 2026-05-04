import OpenAI from "openai";

let _openrouter: OpenAI | null = null;

export function getOpenrouterClient(): OpenAI {
  if (_openrouter) return _openrouter;

  if (
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL &&
    process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
  ) {
    _openrouter = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
    });
    return _openrouter;
  }

  if (process.env.OPENROUTER_API_KEY) {
    _openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    return _openrouter;
  }

  throw new Error(
    "OpenRouter API key not configured. Set OPENROUTER_API_KEY, or provision the Replit AI integration (AI_INTEGRATIONS_OPENROUTER_BASE_URL + AI_INTEGRATIONS_OPENROUTER_API_KEY)."
  );
}

export const openrouter = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenrouterClient() as any)[prop];
  },
});
