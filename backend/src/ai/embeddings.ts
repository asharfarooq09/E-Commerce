import { TaskType } from "@google/generative-ai";
import { env, getOllamaBaseUrl, isOllamaConfigured } from "../config/env";
import { AppError } from "../middleware/error-handler";
import { getGeminiClient } from "./gemini-client";
import { isOllamaReachable } from "./chat-providers";
import { normalizeCacheKey, TtlCache } from "./ttl-cache";

export type EmbeddingTask = "query" | "document";

const embeddingCache = new TtlCache<number[]>(200, 30 * 60_000);

function toGeminiTask(task: EmbeddingTask): TaskType {
  return task === "query" ? TaskType.RETRIEVAL_QUERY : TaskType.RETRIEVAL_DOCUMENT;
}

async function embedWithGemini(texts: string[], task: EmbeddingTask): Promise<number[][]> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
  const taskType = toGeminiTask(task);

  const BATCH_SIZE = 16;
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    const response = await model.batchEmbedContents({
      requests: chunk.map((text) => ({
        content: { role: "user", parts: [{ text }] },
        taskType,
      })),
    });

    for (const item of response.embeddings) {
      const values = item.values;
      if (!values?.length) {
        throw new Error("Gemini returned an empty embedding in batch.");
      }
      if (values.length !== env.EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding dimension mismatch: got ${values.length}, expected ${env.EMBEDDING_DIMENSIONS}. ` +
            `Update EMBEDDING_DIMENSIONS and re-run ai:embed-products.`,
        );
      }
      all.push(values);
    }
  }

  return all;
}

async function embedWithOllama(texts: string[]): Promise<number[][]> {
  if (!isOllamaConfigured()) {
    throw new Error("OLLAMA_BASE_URL is not configured.");
  }
  if (!(await isOllamaReachable())) {
    throw new Error("Ollama is not reachable. Start Ollama and pull the embedding model.");
  }

  const base = getOllamaBaseUrl();
  const all: number[][] = [];

  for (const text of texts) {
    const response = await fetch(`${base}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: env.OLLAMA_EMBEDDING_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Ollama embeddings failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as { embedding?: number[] };
    const values = data.embedding;
    if (!values?.length) {
      throw new Error("Ollama returned an empty embedding.");
    }
    if (values.length !== env.EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch: got ${values.length}, expected ${env.EMBEDDING_DIMENSIONS}. ` +
          `Set EMBEDDING_DIMENSIONS=${values.length} and re-run ai:embed-products.`,
      );
    }
    all.push(values);
  }

  return all;
}

/**
 * Sticky embedding provider — one vector space per index.
 * Gemini (3072-d) and Ollama nomic-embed-text (768-d) are not interchangeable.
 */
export async function embedTexts(
  texts: string[],
  task: EmbeddingTask = "document",
): Promise<number[][]> {
  const inputs = texts.map((t) => t.trim().slice(0, 8000)).filter(Boolean);
  if (inputs.length === 0) return [];

  try {
    if (env.AI_EMBEDDING_PROVIDER === "ollama") {
      return await embedWithOllama(inputs);
    }
    return await embedWithGemini(inputs, task);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Embedding provider ${env.AI_EMBEDDING_PROVIDER} failed:`, message);

    if (env.AI_EMBEDDING_PROVIDER === "gemini") {
      throw new AppError(
        `Gemini embeddings failed (${message}). ` +
          `To switch to open-source embeddings: set AI_EMBEDDING_PROVIDER=ollama, EMBEDDING_DIMENSIONS=768, ` +
          `OLLAMA_BASE_URL, pull \`${env.OLLAMA_EMBEDDING_MODEL}\`, then re-run ai:embed-products.`,
        502,
      );
    }

    throw new AppError(
      `Ollama embeddings failed (${message}). Ensure Ollama is running and \`${env.OLLAMA_EMBEDDING_MODEL}\` is pulled.`,
      502,
    );
  }
}

export async function embedText(
  text: string,
  task: EmbeddingTask = "document",
): Promise<number[]> {
  const input = text.trim().slice(0, 8000);
  if (!input) {
    throw new Error("Cannot embed empty text.");
  }

  if (task === "query") {
    const cached = embeddingCache.get(normalizeCacheKey(input));
    if (cached) return cached;
  }

  const vectors = await embedTexts([input], task);
  const vector = vectors[0];
  if (!vector?.length) {
    throw new Error("Embedding provider returned an empty vector.");
  }

  if (task === "query") {
    embeddingCache.set(normalizeCacheKey(input), vector);
  }

  return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
