import OpenAI from "openai";

/** Single source of truth for AI availability — read from the environment
 * only, never stored in the DB or exposed client-side. Every AI action
 * checks this first and degrades gracefully when it's false. */
export function isAIEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

/** OpenRouter is OpenAI-API-compatible — same SDK, different base URL and
 * model naming (e.g. "openai/gpt-4o-mini" instead of "gpt-4o-mini").
 * OpenRouter keys are always prefixed "sk-or-", so we can tell them apart
 * from real OpenAI keys without a separate env var. */
const isOpenRouterKey = process.env.OPENAI_API_KEY?.startsWith("sk-or-") ?? false;

let client: OpenAI | null = null;

export function getAIClient() {
  if (!isAIEnabled()) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: isOpenRouterKey ? "https://openrouter.ai/api/v1" : undefined,
    });
  }
  return client;
}

export const AI_MODEL =
  process.env.OPENAI_MODEL || (isOpenRouterKey ? "openai/gpt-4o-mini" : "gpt-4o-mini");

export class AIUnavailableError extends Error {
  constructor() {
    super("AI features are unavailable until an API key is configured.");
    this.name = "AIUnavailableError";
  }
}
