import "dotenv/config";
import { embedTexts } from "../src/ai/embeddings";
import { env, isAiConfigured } from "../src/config/env";
import { prisma } from "../src/lib/prisma";
import { getPgPool } from "../src/lib/pg-pool";
import { buildProductDocument } from "../src/services/product-document";
import {
  countIndexedProducts,
  ensurePgVectorTable,
  ensureSemanticTables,
  upsertProductEmbedding,
} from "../src/services/product-embedding.repository";

const BATCH_SIZE = 8;

async function main() {
  if (!isAiConfigured()) {
    console.error(
      "No AI provider configured.\n" +
        "- Gemini: set GEMINI_API_KEY (https://aistudio.google.com/apikey)\n" +
        "- Ollama: install https://ollama.com, set AI_EMBEDDING_PROVIDER=ollama EMBEDDING_DIMENSIONS=768",
    );
    process.exit(1);
  }

  if (env.AI_EMBEDDING_PROVIDER === "gemini" && !env.GEMINI_API_KEY) {
    console.error("AI_EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY is missing.");
    process.exit(1);
  }

  const pool = getPgPool();
  await ensureSemanticTables(pool);
  const pgvector = await ensurePgVectorTable(pool);

  // Dimension / provider changes invalidate prior vectors — clear index first.
  await pool.query(`DELETE FROM product_semantic_index`);
  if (pgvector) {
    await pool.query(`DELETE FROM product_embeddings`);
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { name: "asc" },
  });

  console.log(
    `Indexing ${products.length} products ` +
      `(provider=${env.AI_EMBEDDING_PROVIDER}, dims=${env.EMBEDDING_DIMENSIONS}, pgvector=${pgvector ? "yes" : "json fallback"})...`,
  );

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const documents = chunk.map((product) => buildProductDocument(product));
    const vectors = await embedTexts(documents, "document");

    for (let j = 0; j < chunk.length; j += 1) {
      const product = chunk[j]!;
      const embedding = vectors[j]!;
      await upsertProductEmbedding(product.id, documents[j]!, embedding, pool);
      console.log(`[${i + j + 1}/${products.length}] ${product.name}`);
    }
  }

  const total = await countIndexedProducts(pool);
  console.log(`Done. ${total} embeddings stored.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await getPgPool().end();
  });
