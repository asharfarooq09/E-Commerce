import { Prisma } from "../generated/prisma/client";
import { embedText } from "../ai/embeddings";
import { hasHardFilters, parseSearchIntent } from "../ai/parse-search-intent";
import {
  buildSearchSummary,
  type ValidatedSearchIntent,
} from "../ai/search-intent.schema";
import { productListInclude } from "../lib/product-select";
import { prisma } from "../lib/prisma";
import { semanticSearch } from "./product-embedding.repository";

const RESULT_LIMIT = 12;
/** Drop weak embedding matches so open-ended queries do not dump the catalog. */
const MIN_SEMANTIC_SCORE = 0.34;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productListInclude }>;

function readNumericAttribute(attributes: Prisma.JsonValue | null, key: string): number | null {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return null;
  const value = (attributes as Record<string, unknown>)[key];
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function productMatchesAttributeFilters(
  product: ProductRow,
  intent: ValidatedSearchIntent,
): boolean {
  if (intent.minRamGb !== undefined) {
    const ram = readNumericAttribute(product.attributes, "ram");
    if (ram === null || ram < intent.minRamGb) return false;
  }
  if (intent.minStorageGb !== undefined) {
    const storage = readNumericAttribute(product.attributes, "storage");
    if (storage === null || storage < intent.minStorageGb) return false;
  }
  return true;
}

function hasStructuredConstraints(intent: ValidatedSearchIntent): boolean {
  return hasHardFilters(intent) || intent.keywords.length > 0;
}

/**
 * Hard filters + keyword text constraints.
 * Keywords always narrow the candidate set (including when category/price are set).
 */
function buildSqlWhere(intent: ValidatedSearchIntent): Prisma.ProductWhereInput {
  const clauses: Prisma.ProductWhereInput[] = [];

  if (intent.categorySlug) {
    clauses.push({ category: { slug: intent.categorySlug } });
  }

  if (intent.brand) {
    clauses.push({ brand: { equals: intent.brand, mode: "insensitive" } });
  }

  if (intent.minPriceInr !== undefined || intent.maxPriceInr !== undefined) {
    const price: Prisma.DecimalFilter = {};
    if (intent.minPriceInr !== undefined) price.gte = intent.minPriceInr;
    if (intent.maxPriceInr !== undefined) price.lte = intent.maxPriceInr;
    clauses.push({ price });
  }

  if (intent.keywords.length > 0) {
    clauses.push({
      OR: intent.keywords.flatMap((keyword) => [
        { name: { contains: keyword, mode: "insensitive" as const } },
        { description: { contains: keyword, mode: "insensitive" as const } },
        { brand: { contains: keyword, mode: "insensitive" as const } },
      ]),
    });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

function hybridScore(semanticScore: number, intent: ValidatedSearchIntent, product: ProductRow): number {
  let boost = 0;

  if (intent.categorySlug && product.category.slug === intent.categorySlug) boost += 0.05;
  if (intent.brand && product.brand?.toLowerCase() === intent.brand.toLowerCase()) boost += 0.04;

  const price = Number(product.price);
  if (intent.maxPriceInr !== undefined && price <= intent.maxPriceInr) boost += 0.03;
  if (intent.minRamGb !== undefined) {
    const ram = readNumericAttribute(product.attributes, "ram");
    if (ram !== null && ram >= intent.minRamGb) boost += 0.04;
  }

  return Math.min(1, semanticScore * 0.85 + boost + product.rating * 0.01);
}

function emptyResult(userQuery: string, intent: ValidatedSearchIntent, sqlCandidateCount: number) {
  return {
    query: userQuery.trim(),
    intent,
    summary: buildSearchSummary(intent, 0),
    products: [] as ProductRow[],
    meta: {
      sqlCandidateCount,
      semanticRanked: false,
      resultCount: 0,
    },
  };
}

/**
 * Hybrid retrieval (standard e-commerce AI search):
 * 1) LLM structured intent
 * 2) SQL hard filters + keyword constraints (always reduce the set)
 * 3) Attribute filters
 * 4) Embedding re-rank with a minimum similarity cutoff
 *
 * Empty filtered sets stay empty — never silently widen to the full catalog.
 */
export async function runAiProductSearch(userQuery: string) {
  const categories = await prisma.category.findMany({
    select: { slug: true },
    orderBy: { name: "asc" },
  });
  const categorySlugs = categories.map((c) => c.slug);

  const intent = await parseSearchIntent(userQuery, categorySlugs);
  const where = buildSqlWhere(intent);
  const constrained = hasStructuredConstraints(intent);

  const sqlCandidates = await prisma.product.findMany({
    where,
    include: productListInclude,
    take: 120,
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });

  const filteredCandidates = sqlCandidates.filter((p) =>
    productMatchesAttributeFilters(p, intent),
  );

  // Constrained query with zero matches → empty (do not widen).
  if (constrained && filteredCandidates.length === 0) {
    return emptyResult(userQuery, intent, 0);
  }

  // Open semantic search only when the intent has no structured constraints.
  const poolProducts =
    filteredCandidates.length > 0
      ? filteredCandidates
      : await prisma.product.findMany({
          include: productListInclude,
          take: 120,
          orderBy: [{ featured: "desc" }, { rating: "desc" }],
        });

  const candidateIds = poolProducts.map((p) => p.id);
  const queryEmbedding = await embedText(intent.semanticQuery, "query");
  const semanticHits = await semanticSearch(
    queryEmbedding,
    candidateIds,
    Math.max(RESULT_LIMIT * 3, 24),
  );
  const semanticById = new Map(semanticHits.map((hit) => [hit.productId, hit.score]));

  const ranked = poolProducts
    .map((product) => {
      const semanticScore = semanticById.get(product.id) ?? 0;
      return {
        product,
        semanticScore,
        score: hybridScore(semanticScore, intent, product),
      };
    })
    .filter((row) => row.semanticScore >= MIN_SEMANTIC_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT);

  const products = ranked.map((row) => row.product);

  return {
    query: userQuery.trim(),
    intent,
    summary: buildSearchSummary(intent, products.length),
    products,
    meta: {
      sqlCandidateCount: filteredCandidates.length,
      semanticRanked: semanticHits.length > 0,
      resultCount: products.length,
    },
  };
}
