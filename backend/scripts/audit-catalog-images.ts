import "dotenv/config";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

  try {
    const products = await pool.query<{ slug: string; name: string; url: string }>(`
      SELECT p.slug, p.name, pi.url
      FROM "Product" p
      LEFT JOIN "ProductImage" pi ON pi."productId" = p.id AND pi."isPrimary" = true
      ORDER BY p.name
    `);

    const catalogDir = join(__dirname, "../../frontend/public/catalog");
    const files = new Set(readdirSync(catalogDir));

    let missingFile = 0;
    let remoteUrl = 0;
    for (const row of products.rows) {
      const expected = `/catalog/${row.slug}.svg`;
      if (!row.url?.startsWith("/catalog/")) {
        remoteUrl += 1;
        console.log(`REMOTE ${row.name}: ${row.url}`);
      } else if (row.url !== expected) {
        console.log(`MISMATCH ${row.name}: db=${row.url} expected=${expected}`);
      }
      const file = `${row.slug}.svg`;
      if (!files.has(file)) {
        missingFile += 1;
        console.log(`MISSING FILE ${file}`);
      }
    }

    console.log(
      JSON.stringify(
        {
          products: products.rows.length,
          remoteUrls: remoteUrl,
          missingFiles: missingFile,
          catalogFiles: files.size,
          ok: remoteUrl === 0 && missingFile === 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
