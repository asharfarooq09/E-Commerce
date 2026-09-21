import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { isOllamaReachable } from "../ai/chat-providers";
import { env, isAiConfigured, isGeminiConfigured, isOllamaConfigured } from "../config/env";
import { AppError } from "../middleware/error-handler";
import { runAiProductSearch } from "../services/ai-search.service";
import {
  countIndexedProducts,
  ensurePgVectorTable,
  isPgVectorAvailable,
} from "../services/product-embedding.repository";

const router = Router();

router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many AI search requests. Please wait a moment." },
  }),
);

const searchBodySchema = z.object({
  query: z.string().trim().min(3).max(800),
});

router.get("/status", async (_req, res, next) => {
  try {
    const indexed = await countIndexedProducts();
    const pgvector = await isPgVectorAvailable();
    if (pgvector) {
      await ensurePgVectorTable();
    }

    const configured = isAiConfigured();
    const ollamaConfigured = isOllamaConfigured();
    const ollama = ollamaConfigured ? await isOllamaReachable() : false;
    const gemini = isGeminiConfigured();

    let message: string;
    if (!configured) {
      message =
        "Configure an embedding provider and at least one chat provider (Gemini and/or Ollama). See .env.example.";
    } else if (indexed === 0) {
      message = "Run npm run ai:embed-products in backend/ to index the catalog.";
    } else {
      message =
        "AI search ready — LLM intent via provider chain, sticky embeddings, query cache.";
    }

    res.json({
      chatProviders: env.AI_CHAT_PROVIDERS,
      embeddingProvider: env.AI_EMBEDDING_PROVIDER,
      embeddingDimensions: env.EMBEDDING_DIMENSIONS,
      geminiConfigured: gemini,
      ollamaConfigured,
      ollamaReachable: ollama,
      aiConfigured: configured,
      /** @deprecated alias — frontend may still read this name */
      openAiConfigured: configured,
      provider: env.AI_EMBEDDING_PROVIDER,
      embeddingsIndexed: indexed,
      pgvectorEnabled: pgvector,
      ready: configured && indexed > 0,
      message,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/search", async (req, res, next) => {
  try {
    if (!isAiConfigured()) {
      throw new AppError(
        "AI search is not configured. Add GEMINI_API_KEY and/or start Ollama. See backend/.env.example notes in repo .env.example.",
        503,
      );
    }

    const { query } = searchBodySchema.parse(req.body);
    const indexed = await countIndexedProducts();
    if (indexed === 0) {
      throw new AppError(
        "Product embeddings are not indexed yet. Run: npm run ai:embed-products",
        503,
      );
    }

    const result = await runAiProductSearch(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
