import type { Pool } from "pg";
import { env } from "../config/env";
import { cosineSimilarity } from "../ai/embeddings";
import { getPgPool } from "../lib/pg-pool";

export type SemanticSearchHit = {
  productId: string;
  score: number;
};

let pgVectorReady: boolean | null = null;

export async function isPgVectorAvailable(pool: Pool = getPgPool()): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS exists`,
  );
  return Boolean(result.rows[0]?.exists);
}

export async function ensureSemanticTables(pool: Pool = getPgPool()): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_semantic_index (
      product_id TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT product_semantic_index_pkey PRIMARY KEY (product_id),
      CONSTRAINT product_semantic_index_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
}

export async function ensurePgVectorTable(pool: Pool = getPgPool()): Promise<boolean> {
  const hasVector = await isPgVectorAvailable(pool);
  if (!hasVector) {
    pgVectorReady = false;
    return false;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_embeddings (
      product_id TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding vector(${env.EMBEDDING_DIMENSIONS}) NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT product_embeddings_pkey PRIMARY KEY (product_id),
      CONSTRAINT product_embeddings_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  pgVectorReady = true;
  return true;
}

function toPgVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function upsertProductEmbedding(
  productId: string,
  content: string,
  embedding: number[],
  pool: Pool = getPgPool(),
): Promise<void> {
  await ensureSemanticTables(pool);

  await pool.query(
    `
    INSERT INTO product_semantic_index (product_id, content, embedding, updated_at)
    VALUES ($1, $2, $3::jsonb, NOW())
    ON CONFLICT (product_id) DO UPDATE
    SET content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        updated_at = NOW();
    `,
    [productId, content, JSON.stringify(embedding)],
  );

  const vectorReady = pgVectorReady ?? (await ensurePgVectorTable(pool));
  if (vectorReady) {
    await pool.query(
      `
      INSERT INTO product_embeddings (product_id, content, embedding, updated_at)
      VALUES ($1, $2, $3::vector, NOW())
      ON CONFLICT (product_id) DO UPDATE
      SET content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          updated_at = NOW();
      `,
      [productId, content, toPgVectorLiteral(embedding)],
    );
  }
}

export async function countIndexedProducts(pool: Pool = getPgPool()): Promise<number> {
  await ensureSemanticTables(pool);
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM product_semantic_index`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function semanticSearch(
  queryEmbedding: number[],
  candidateProductIds: string[] | null,
  limit: number,
  pool: Pool = getPgPool(),
): Promise<SemanticSearchHit[]> {
  await ensureSemanticTables(pool);

  const vectorReady = pgVectorReady ?? (await ensurePgVectorTable(pool));

  if (vectorReady) {
    const vectorLiteral = toPgVectorLiteral(queryEmbedding);
    const params: unknown[] = [vectorLiteral, limit];
    let filterSql = "";

    if (candidateProductIds && candidateProductIds.length > 0) {
      params.push(candidateProductIds);
      filterSql = `WHERE product_id = ANY($3::text[])`;
    }

    const result = await pool.query<{ product_id: string; score: number }>(
      `
      SELECT product_id, 1 - (embedding <=> $1::vector) AS score
      FROM product_embeddings
      ${filterSql}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      params,
    );

    return result.rows.map((row) => ({
      productId: row.product_id,
      score: Number(row.score),
    }));
  }

  const result = await pool.query<{ product_id: string; embedding: number[] }>(
    candidateProductIds && candidateProductIds.length > 0
      ? `SELECT product_id, embedding FROM product_semantic_index WHERE product_id = ANY($1::text[])`
      : `SELECT product_id, embedding FROM product_semantic_index`,
    candidateProductIds && candidateProductIds.length > 0 ? [candidateProductIds] : [],
  );

  const hits = result.rows
    .map((row) => ({
      productId: row.product_id,
      score: cosineSimilarity(queryEmbedding, row.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return hits;
}
