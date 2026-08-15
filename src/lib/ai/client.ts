import OpenAI from "openai";

/** Single source of truth for AI availability — read from the environment
 * only, never stored in the DB or exposed client-side. Every AI action
 * checks this first and degrades gracefully when it's false. */
export function isAIEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

let client: OpenAI | null = null;

export function getAIClient() {
  if (!isAIEnabled()) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export class AIUnavailableError extends Error {
  constructor() {
    super("AI features are unavailable until an API key is configured.");
    this.name = "AIUnavailableError";
  }
}
