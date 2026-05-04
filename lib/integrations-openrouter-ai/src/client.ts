import OpenAI from "openai";

let _openrouter: OpenAI | null = null;

export function getOpenrouterClient(): OpenAI {
  if (!process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL) {
    throw new Error(
      "AI_INTEGRATIONS_OPENROUTER_BASE_URL must be set. Did you forget to provision the OpenRouter AI integration?",
    );
  }
  if (!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY) {
    throw new Error(
      "AI_INTEGRATIONS_OPENROUTER_API_KEY must be set. Did you forget to provision the OpenRouter AI integration?",
    );
  }
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
    });
  }
  return _openrouter;
}

export const openrouter = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenrouterClient() as any)[prop];
  },
});
