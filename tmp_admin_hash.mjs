import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const result = await client.query("SELECT id, email, role, password_hash FROM users WHERE email = 'admin@cyclecare.com'");
  console.log(JSON.stringify(result.rows, null, 2));
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
