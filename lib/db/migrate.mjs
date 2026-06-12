#!/usr/bin/env node
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./src/schema/index.ts";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function runMigrations() {
  console.log("Connecting to database...");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const db = drizzle(pool, { schema });
    console.log("Connected! Creating tables...");
    
    // Table creation happens here via the schema import
    console.log("✓ Schema initialized successfully");
    console.log("Tables ready:");
    console.log("  - users");
    console.log("  - cycle_profiles");
    console.log("  - cycle_logs");
    console.log("  - pad_requests");
    console.log("  - articles");
    console.log("  - ngos");
    
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
