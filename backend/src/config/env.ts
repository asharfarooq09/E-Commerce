import { z } from "zod";

const chatProviderSchema = z.enum(["gemini", "ollama"]);
const embeddingProviderSchema = z.enum(["gemini", "ollama"]);

function parseProviderList(value: unknown): Array<"gemini" | "ollama"> {
  if (typeof value !== "string" || !value.trim()) return ["gemini", "ollama"];
  const parsed = value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .filter((part): part is "gemini" | "ollama" => part === "gemini" || part === "ollama");
  return parsed.length > 0 ? parsed : ["gemini", "ollama"];
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url(),
  /** Free key from https://aistudio.google.com/apikey */
  GEMINI_API_KEY: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  GEMINI_CHAT_MODEL: z.string().default("gemini-3.6-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  /**
   * Sticky embedding provider. Switching requires re-running ai:embed-products
   * because Gemini (3072-d) and Ollama nomic-embed-text (768-d) are incompatible.
   */
  AI_EMBEDDING_PROVIDER: embeddingProviderSchema.default("gemini"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(3072),
  /** Ordered chat failover list, e.g. "ollama,gemini" for open-source primary */
  AI_CHAT_PROVIDERS: z.preprocess(parseProviderList, z.array(chatProviderSchema).min(1)),
  /**
   * Local open-source runtime — https://ollama.com
   * Must be set explicitly to enable Ollama (no implicit “configured” default).
   */
  OLLAMA_BASE_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional(),
  ),
  OLLAMA_CHAT_MODEL: z.string().default("llama3.2"),
  OLLAMA_EMBEDDING_MODEL: z.string().default("nomic-embed-text"),
  /** @deprecated use EMBEDDING_DIMENSIONS */
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  EMBEDDING_DIMENSIONS: parsed.GEMINI_EMBEDDING_DIMENSIONS ?? parsed.EMBEDDING_DIMENSIONS,
};

export type EmbeddingProviderName = z.infer<typeof embeddingProviderSchema>;
export type ChatProviderName = z.infer<typeof chatProviderSchema>;

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

/** Ollama is enabled only when the operator explicitly set a base URL. */
export function isOllamaConfigured(): boolean {
  return Boolean(env.OLLAMA_BASE_URL);
}

export function getOllamaBaseUrl(): string {
  if (!env.OLLAMA_BASE_URL) {
    throw new Error("OLLAMA_BASE_URL is not configured.");
  }
  return env.OLLAMA_BASE_URL.replace(/\/$/, "");
}

export function isChatProviderConfigured(provider: ChatProviderName): boolean {
  if (provider === "gemini") return isGeminiConfigured();
  return isOllamaConfigured();
}

export function isEmbeddingProviderConfigured(): boolean {
  if (env.AI_EMBEDDING_PROVIDER === "ollama") return isOllamaConfigured();
  return isGeminiConfigured();
}

/** Ready when the sticky embedding provider and at least one chat provider are configured. */
export function isAiConfigured(): boolean {
  if (!isEmbeddingProviderConfigured()) return false;
  return env.AI_CHAT_PROVIDERS.some((provider) => isChatProviderConfigured(provider));
}
