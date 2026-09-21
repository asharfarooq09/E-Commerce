import type { ValidatedSearchIntent } from "./search-intent.schema";

/**
 * Deterministic numeric slot enrichment.
 *
 * Industry pattern: LLMs own NLU (category, brand, keywords, semantic query).
 * Regex owns only machine-parseable units (INR shorthand, GB/TB) when the model
 * omitted them — never replaces the LLM path.
 */

function parseInrAmount(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "").toLowerCase();
  const lakh = cleaned.match(/^(\d+(?:\.\d+)?)\s*l(?:akh)?$/);
  if (lakh) return Math.round(Number(lakh[1]) * 100_000);

  const withK = cleaned.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (withK) return Math.round(Number(withK[1]) * 1_000);

  const plain = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (plain) {
    const n = Number(plain[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

function extractMaxPriceInr(text: string): number | undefined {
  const maxMatch = text.match(
    /\b(?:under|below|upto|up\s*to|less\s+than|max(?:imum)?)\s*(?:of\s*)?(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?\s*[kKlL]?|\d+(?:\.\d+)?\s*lakh)/i,
  );
  if (maxMatch?.[1]) {
    const value = parseInrAmount(maxMatch[1]);
    if (value !== null) return value;
  }

  const bareMax = text.match(/(?:₹|rs\.?\s*)(\d{2,3}(?:,\d{3})+|\d{4,7})/i);
  if (bareMax?.[1] && /\bunder\b|\bbelow\b|\bupto\b|\bup to\b/i.test(text)) {
    const value = parseInrAmount(bareMax[1]);
    if (value !== null) return value;
  }

  return undefined;
}

function extractMinPriceInr(text: string): number | undefined {
  const minMatch = text.match(
    /\b(?:above|over|at\s*least|min(?:imum)?|from)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?\s*[kKlL]?|\d+(?:\.\d+)?\s*lakh)/i,
  );
  if (!minMatch?.[1]) return undefined;
  const value = parseInrAmount(minMatch[1]);
  return value === null ? undefined : value;
}

function extractMinRamGb(text: string): number | undefined {
  const ramMatch = text.match(/\b(\d{1,3})\s*gb\s*ram\b/i) || text.match(/\bram\s*(\d{1,3})\s*gb\b/i);
  if (!ramMatch?.[1]) return undefined;
  const value = Number(ramMatch[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function extractMinStorageGb(text: string): number | undefined {
  const tbMatch = text.match(/\b(\d+(?:\.\d+)?)\s*tb(?:\s*storage)?\b/i);
  if (tbMatch?.[1]) return Math.round(Number(tbMatch[1]) * 1024);

  const storageMatch = text.match(/\b(\d{2,4})\s*gb\s*(?:storage|ssd|rom)\b/i);
  if (!storageMatch?.[1]) return undefined;
  const value = Number(storageMatch[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** Fill numeric slots the LLM left empty when the query states them explicitly. */
export function enrichNumericSlots(
  intent: ValidatedSearchIntent,
  query: string,
): ValidatedSearchIntent {
  const text = query.trim();
  return {
    ...intent,
    maxPriceInr: intent.maxPriceInr ?? extractMaxPriceInr(text),
    minPriceInr: intent.minPriceInr ?? extractMinPriceInr(text),
    minRamGb: intent.minRamGb ?? extractMinRamGb(text),
    minStorageGb: intent.minStorageGb ?? extractMinStorageGb(text),
  };
}
