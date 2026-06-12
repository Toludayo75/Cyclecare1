import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '..', '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^(.*?)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
}

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const admin = await client.query('SELECT id, email, role, password_hash FROM users WHERE email = $1 LIMIT 1', ['admin@cyclecare.com']);
  const ngo = await client.query(`
    SELECT u.id AS user_id, u.email, u.role, nw.id AS ngo_worker_id, nw.ngo_id, p.id AS pickup_center_id
    FROM users u
    LEFT JOIN ngo_workers nw ON nw.user_id = u.id
    LEFT JOIN pickup_centers p ON p.ngo_id = nw.ngo_id
    WHERE u.email IN ($1, $2)
    ORDER BY u.id
  `, ['admin@cyclecare.com', 'worker@ngo.com']);

  console.log('admin', JSON.stringify(admin.rows, null, 2));
  console.log('ngoUsers', JSON.stringify(ngo.rows, null, 2));
  if (admin.rowCount) {
    const matches = await bcrypt.compare('admin123', admin.rows[0].password_hash);
    console.log('adminPasswordMatches', matches);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
