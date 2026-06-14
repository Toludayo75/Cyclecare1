import fs from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Normalize the database URL for environments like Render where
// local filesystem cert paths are not available.
function normalizeDatabaseUrl(raw: string) {
  try {
    const url = new URL(raw);
    const sslRootCert = url.searchParams.get("sslrootcert");
    const sslMode = url.searchParams.get("sslmode");

    if (sslRootCert && !fs.existsSync(sslRootCert)) {
      url.searchParams.delete("sslrootcert");
    }

    // When we manage SSL explicitly via the pg client, remove
    // sslmode from the connection string so pg does not re-interpret
    // it with libpq compatibility semantics.
    if (sslMode && ["require", "prefer", "verify-ca", "verify-full"].includes(sslMode)) {
      url.searchParams.delete("sslmode");
    }

    return { url: url.toString(), sslMode };
  } catch {
    return { url: raw, sslMode: null };
  }
}

const { url: normalizedDatabaseUrl, sslMode } = normalizeDatabaseUrl(process.env.DATABASE_URL);
const poolConfig: pg.PoolConfig = {
  connectionString: normalizedDatabaseUrl,
};

if (sslMode && ["require", "prefer", "verify-ca", "verify-full"].includes(sslMode)) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
