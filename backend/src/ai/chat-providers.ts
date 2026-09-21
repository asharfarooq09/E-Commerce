import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import {
  env,
  getOllamaBaseUrl,
  isChatProviderConfigured,
  isOllamaConfigured,
  type ChatProviderName,
} from "../config/env";
import { AppError } from "../middleware/error-handler";
import { getGeminiClient } from "./gemini-client";

export type { ChatProviderName };

export const searchIntentResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    categorySlug: { type: SchemaType.STRING, nullable: true },
    maxPriceInr: { type: SchemaType.NUMBER, nullable: true },
    minPriceInr: { type: SchemaType.NUMBER, nullable: true },
    brand: { type: SchemaType.STRING, nullable: true },
    minRamGb: { type: SchemaType.INTEGER, nullable: true },
    minStorageGb: { type: SchemaType.INTEGER, nullable: true },
    semanticQuery: { type: SchemaType.STRING },
    keywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    "categorySlug",
    "maxPriceInr",
    "minPriceInr",
    "brand",
    "minRamGb",
    "minStorageGb",
    "semanticQuery",
    "keywords",
  ],
};

/** Plain JSON Schema for Ollama structured `format` (same contract as Gemini). */
export const searchIntentJsonSchema = {
  type: "object",
  properties: {
    categorySlug: { type: ["string", "null"] },
    maxPriceInr: { type: ["number", "null"] },
    minPriceInr: { type: ["number", "null"] },
    brand: { type: ["string", "null"] },
    minRamGb: { type: ["integer", "null"] },
    minStorageGb: { type: ["integer", "null"] },
    semanticQuery: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: [
    "categorySlug",
    "maxPriceInr",
    "minPriceInr",
    "brand",
    "minRamGb",
    "minStorageGb",
    "semanticQuery",
    "keywords",
  ],
} as const;

export function buildIntentSystemPrompt(categorySlugs: string[]): string {
  const categories =
    categorySlugs.length > 0 ? categorySlugs.join(", ") : "laptops, smartphones, audio, accessories";

  return `You extract structured shopping filters from natural-language product search queries for an Indian e-commerce store (prices in INR).

Rules:
- categorySlug: only one of [${categories}] when clearly implied; otherwise null.
- Convert Indian price shorthand to INR numbers: "50k" → 50000, "1.5L" → 150000.
- "under/below/upto 50k" → maxPriceInr=50000. "above/over 30k" → minPriceInr=30000.
- "16GB RAM" / "16 GB" near laptop/phone context → minRamGb=16.
- "256GB storage" / "1TB storage" → minStorageGb in GB (1TB → 1024).
- semanticQuery: short English phrase for semantic ranking; do not repeat exact price numbers.
- keywords: 1–6 product-type / feature tokens that should appear in name or description (e.g. headphones, laptop, webcam, keyboard). Never include filler (need/want/under/with/for) or prices. Prefer specific nouns over the category slug itself when the query names a product type.
- brand: only if explicitly mentioned; else null.
- Unknown numeric fields must be null (not omitted, not 0).
- Respond with JSON only.`;
}

export async function generateIntentJsonWithGemini(
  systemPrompt: string,
  userQuery: string,
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: searchIntentResponseSchema,
    },
  });

  const result = await model.generateContent([
    { text: `${systemPrompt}\n\nUser query:\n${userQuery}` },
  ]);
  return result.response.text();
}

export async function isOllamaReachable(): Promise<boolean> {
  if (!isOllamaConfigured()) return false;
  try {
    const response = await fetch(`${getOllamaBaseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function generateIntentJsonWithOllama(
  systemPrompt: string,
  userQuery: string,
): Promise<string> {
  const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      model: env.OLLAMA_CHAT_MODEL,
      stream: false,
      format: searchIntentJsonSchema,
      options: { temperature: 0 },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ollama chat failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content?.trim();
  if (!content) throw new Error("Ollama returned an empty chat response.");
  return content;
}

/**
 * Ordered provider failover for chat intent (e.g. Gemini → Ollama).
 * Failures advance to the next configured provider; no silent degrade to rules.
 */
export async function generateIntentJson(
  systemPrompt: string,
  userQuery: string,
): Promise<{ text: string; provider: ChatProviderName }> {
  const errors: string[] = [];

  for (const provider of env.AI_CHAT_PROVIDERS) {
    if (!isChatProviderConfigured(provider)) {
      errors.push(`${provider}: not configured`);
      continue;
    }

    try {
      if (provider === "gemini") {
        const text = await generateIntentJsonWithGemini(systemPrompt, userQuery);
        return { text, provider: "gemini" };
      }

      if (!(await isOllamaReachable())) {
        errors.push("ollama: not reachable");
        continue;
      }
      const text = await generateIntentJsonWithOllama(systemPrompt, userQuery);
      return { text, provider: "ollama" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${provider}: ${message}`);
      console.error(`Chat provider ${provider} failed:`, message);
    }
  }

  throw new AppError(
    `AI intent parsing failed on all chat providers (${errors.join(" | ")}). ` +
      `Configure Gemini and/or start Ollama with \`ollama pull ${env.OLLAMA_CHAT_MODEL}\`.`,
    502,
  );
}
