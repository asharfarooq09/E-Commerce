import { Pool } from "pg";

const globalForPool = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
  });

  return pool;
}

/** Returns a shared pool; recreates it if the previous pool was ended. */
export function getPgPool(): Pool {
  const existing = globalForPool.pgPool;
  if (existing && !existing.ended) {
    return existing;
  }
  globalForPool.pgPool = createPool();
  return globalForPool.pgPool;
}

export async function resetPgPool(): Promise<void> {
  const existing = globalForPool.pgPool;
  globalForPool.pgPool = undefined;
  if (existing) {
    try {
      await existing.end();
    } catch {
      // ignore
    }
  }
}
