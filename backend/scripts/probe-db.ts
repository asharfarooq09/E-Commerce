import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const count = await pool.query(`SELECT COUNT(*)::int AS c FROM "Product"`);
  const sample = await pool.query(
    `SELECT p.name, pi.url FROM "Product" p JOIN "ProductImage" pi ON pi."productId"=p.id WHERE pi."isPrimary"=true LIMIT 5`,
  );
  console.log("count", count.rows[0].c);
  console.log(sample.rows);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
