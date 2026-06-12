import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Adding missing columns to pad_requests if necessary...');
    await client.query(`ALTER TABLE pad_requests ADD COLUMN IF NOT EXISTS pickup_code TEXT;`);
    await client.query(`ALTER TABLE pad_requests ADD COLUMN IF NOT EXISTS pickup_location TEXT;`);
    await client.query(`ALTER TABLE pad_requests ADD COLUMN IF NOT EXISTS notes TEXT;`);
    console.log('Columns ensured.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
