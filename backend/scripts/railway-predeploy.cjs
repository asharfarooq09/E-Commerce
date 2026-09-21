/**
 * Railway pre-deploy: validate DB URL, then sync Prisma schema.
 * Uses --accept-data-loss so unmanaged optional tables (e.g. pgvector
 * product_embeddings) do not fail the deploy. ProductSemanticIndex is in
 * schema.prisma, so that AI index is not treated as unknown drift.
 */
const { spawnSync } = require("node:child_process");

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  console.error(
    "FATAL: DATABASE_URL is missing on the E-Commerce Railway service.\n" +
      "Open E-Commerce → Variables → Add Variable Reference → Postgres → DATABASE_URL.",
  );
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--accept-data-loss"],
  { stdio: "inherit", shell: true, env: process.env },
);

process.exit(result.status === null ? 1 : result.status);
