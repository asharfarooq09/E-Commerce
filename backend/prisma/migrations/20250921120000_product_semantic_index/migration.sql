-- Semantic search index (JSON embeddings; pgvector table is created at runtime when extension exists)
CREATE TABLE IF NOT EXISTS "product_semantic_index" (
    "product_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_semantic_index_pkey" PRIMARY KEY ("product_id"),
    CONSTRAINT "product_semantic_index_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
