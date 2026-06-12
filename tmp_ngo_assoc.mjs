import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const result = await client.query(`
    SELECT u.id AS user_id, u.email, u.role, nw.ngo_id, n.name AS ngo_name, n.state AS ngo_state
    FROM users u
    LEFT JOIN ngo_workers nw ON nw.user_id = u.id
    LEFT JOIN ngos n ON n.id = nw.ngo_id
    WHERE u.email IN ('worker@ngo.com', 'admin@cyclecare.com')
    ORDER BY u.id;
  `);
  console.log(JSON.stringify(result.rows, null, 2));
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
