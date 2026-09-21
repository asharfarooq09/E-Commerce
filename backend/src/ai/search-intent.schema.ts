import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === undefined || value === "" || value === "null") return null;
  return value;
};

const nullableString = z.preprocess(
  emptyToNull,
  z.union([z.string(), z.null()]).optional().transform((v) => v ?? null),
);

const nullableNumber = z.preprocess((value) => {
  const v = emptyToNull(value);
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[₹$,\s]/g, "").replace(/k$/i, "000");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}, z.number().nullable());

const nullableInt = z.preprocess((value) => {
  const v = emptyToNull(value);
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  return null;
}, z.number().int().nullable());

/** Shape returned by the LLM before backend validation/clamping. */
export const llmSearchIntentSchema = z.object({
  categorySlug: nullableString,
  maxPriceInr: nullableNumber,
  minPriceInr: nullableNumber,
  brand: nullableString,
  minRamGb: nullableInt,
  minStorageGb: nullableInt,
  /** Natural-language slice used for embedding / semantic ranking. */
  semanticQuery: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim()) return value.trim();
      return "general product search";
    },
    z.string().min(1),
  ),
  keywords: z.preprocess((value) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item)).filter(Boolean);
  }, z.array(z.string()).default([])),
});

export type LlmSearchIntent = z.infer<typeof llmSearchIntentSchema>;

export type ValidatedSearchIntent = {
  categorySlug?: string;
  maxPriceInr?: number;
  minPriceInr?: number;
  brand?: string;
  minRamGb?: number;
  minStorageGb?: number;
  semanticQuery: string;
  keywords: string[];
};

const MAX_PRICE_INR = 5_000_000;
const MIN_PRICE_INR = 0;

/** Generic tokens that must not become text filters (they match half the catalog). */
const KEYWORD_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "with",
  "without",
  "under",
  "over",
  "above",
  "below",
  "upto",
  "up",
  "to",
  "from",
  "in",
  "on",
  "of",
  "my",
  "me",
  "i",
  "need",
  "want",
  "looking",
  "show",
  "find",
  "get",
  "buy",
  "good",
  "best",
  "great",
  "nice",
  "cheap",
  "budget",
  "premium",
  "product",
  "products",
  "item",
  "items",
  "thing",
  "things",
  "stuff",
  "please",
  "something",
  "anything",
  "some",
  "any",
  "gb",
  "inr",
  "rs",
  "rupees",
]);

function sanitizeKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of raw) {
    const token = entry.trim().toLowerCase();
    if (token.length < 2) continue;
    if (KEYWORD_STOPWORDS.has(token)) continue;
    if (/^\d+k$/i.test(token) || /^\d+$/.test(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= 8) break;
  }

  return out;
}

export function validateSearchIntent(
  raw: LlmSearchIntent,
  allowedCategorySlugs: string[],
): ValidatedSearchIntent {
  const allowed = new Set(allowedCategorySlugs.map((s) => s.toLowerCase()));

  let categorySlug: string | undefined;
  if (raw.categorySlug?.trim()) {
    const normalized = raw.categorySlug.trim().toLowerCase();
    if (allowed.has(normalized)) {
      categorySlug = normalized;
    }
  }

  const clampPrice = (value: number | null | undefined): number | undefined => {
    if (value === null || value === undefined || Number.isNaN(value)) return undefined;
    const n = Math.round(value);
    if (n < MIN_PRICE_INR) return undefined;
    return Math.min(n, MAX_PRICE_INR);
  };

  const maxPriceInr = clampPrice(raw.maxPriceInr);
  const minPriceInr = clampPrice(raw.minPriceInr);

  if (
    minPriceInr !== undefined &&
    maxPriceInr !== undefined &&
    minPriceInr > maxPriceInr
  ) {
    return validateSearchIntent(
      { ...raw, minPriceInr: maxPriceInr, maxPriceInr: minPriceInr },
      allowedCategorySlugs,
    );
  }

  const minRamGb =
    raw.minRamGb !== null && raw.minRamGb !== undefined && raw.minRamGb > 0
      ? Math.min(Math.floor(raw.minRamGb), 512)
      : undefined;

  const minStorageGb =
    raw.minStorageGb !== null && raw.minStorageGb !== undefined && raw.minStorageGb > 0
      ? Math.min(Math.floor(raw.minStorageGb), 8192)
      : undefined;

  const brand = raw.brand?.trim() ? raw.brand.trim().slice(0, 80) : undefined;

  const semanticQuery = raw.semanticQuery.trim().slice(0, 500);
  const keywords = sanitizeKeywords(raw.keywords);

  return {
    categorySlug,
    maxPriceInr,
    minPriceInr,
    brand,
    minRamGb,
    minStorageGb,
    semanticQuery: semanticQuery || "general product search",
    keywords,
  };
}

export function buildSearchSummary(intent: ValidatedSearchIntent, resultCount: number): string {
  const parts: string[] = [];

  if (intent.categorySlug) {
    parts.push(intent.categorySlug.replace(/-/g, " "));
  }
  if (intent.brand) {
    parts.push(intent.brand);
  }
  if (intent.maxPriceInr !== undefined) {
    parts.push(`under ₹${intent.maxPriceInr.toLocaleString("en-IN")}`);
  }
  if (intent.minPriceInr !== undefined) {
    parts.push(`from ₹${intent.minPriceInr.toLocaleString("en-IN")}`);
  }
  if (intent.minRamGb !== undefined) {
    parts.push(`${intent.minRamGb}GB+ RAM`);
  }
  if (intent.minStorageGb !== undefined) {
    parts.push(`${intent.minStorageGb}GB+ storage`);
  }
  if (intent.keywords.length > 0 && !intent.categorySlug) {
    parts.push(intent.keywords.slice(0, 3).join(", "));
  }

  if (resultCount === 0) {
    return parts.length
      ? `No products matched ${parts.join(" · ")}. Try a broader description.`
      : "No products matched that search. Try different words or fewer constraints.";
  }

  const filters = parts.length ? ` for ${parts.join(" · ")}` : "";
  return `Showing ${resultCount} product${resultCount === 1 ? "" : "s"}${filters}.`;
}
