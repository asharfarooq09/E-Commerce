import { AppError } from "../middleware/error-handler";
import {
  buildIntentSystemPrompt,
  generateIntentJson,
} from "./chat-providers";
import {
  llmSearchIntentSchema,
  validateSearchIntent,
  type ValidatedSearchIntent,
} from "./search-intent.schema";
import { enrichNumericSlots } from "./slot-enrichment";
import { normalizeCacheKey, TtlCache } from "./ttl-cache";

const intentCache = new TtlCache<ValidatedSearchIntent>(300, 30 * 60_000);

/**
 * Standard intent pipeline:
 * 1) LLM structured extraction (provider chain)
 * 2) Deterministic numeric slot enrichment
 * 3) Schema validation against catalog categories
 * 4) TTL cache (identical queries must not re-bill providers)
 */
export async function parseSearchIntent(
  query: string,
  categorySlugs: string[],
): Promise<ValidatedSearchIntent> {
  const userQuery = query.trim().slice(0, 800);
  if (userQuery.length < 3) {
    throw new AppError("Search query is too short.", 400);
  }

  const cacheKey = normalizeCacheKey(userQuery);
  const cached = intentCache.get(cacheKey);
  if (cached) return cached;

  let rawText: string;
  try {
    const generated = await generateIntentJson(
      buildIntentSystemPrompt(categorySlugs),
      userQuery,
    );
    rawText = generated.text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Intent generation failed:", error);
    throw new AppError(
      "AI intent parsing failed across configured chat providers.",
      502,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new AppError("AI returned invalid JSON for search intent.", 502);
  }

  const parsed = llmSearchIntentSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Intent schema mismatch:", parsed.error.flatten(), rawText);
    throw new AppError("AI returned an intent shape we could not validate.", 502);
  }

  const validated = validateSearchIntent(parsed.data, categorySlugs);
  const intent = enrichNumericSlots(validated, userQuery);
  intentCache.set(cacheKey, intent);
  return intent;
}

export function hasHardFilters(intent: ValidatedSearchIntent): boolean {
  return Boolean(
    intent.categorySlug ||
      intent.brand ||
      intent.maxPriceInr !== undefined ||
      intent.minPriceInr !== undefined ||
      intent.minRamGb !== undefined ||
      intent.minStorageGb !== undefined,
  );
}
