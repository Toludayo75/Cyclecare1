const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Load repo root .env manually (avoid requiring dotenv in this temp script)
const repoRootEnv = path.resolve(__dirname, '..', '..', '.env');
let connectionString = process.env.DATABASE_URL;
if (!connectionString && fs.existsSync(repoRootEnv)) {
  const envText = fs.readFileSync(repoRootEnv, 'utf8');
  const match = envText.match(/^DATABASE_URL=(.*)$/m);
  if (match) {
    connectionString = match[1].trim();
  }
}
if (!connectionString) {
  console.error('DATABASE_URL not found in environment or .env');
  process.exit(1);
}
const pool = new Pool({ connectionString });

const userId = 6;
const email = 'ayomidetoluwase705@gmail.com';

(async () => {
  try {
    const userRes = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1 OR email = $2 LIMIT 1', [userId, email]);
    console.log('\n--- user row ---');
    console.log(JSON.stringify(userRes.rows, null, 2));

    const profileRes = await pool.query(
      'SELECT id, user_id, last_period_date, cycle_length, period_duration, rollover_balance, rollover_month, created_at, updated_at FROM cycle_profiles WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    console.log('\n--- cycle_profiles (user) ---');
    console.log(JSON.stringify(profileRes.rows, null, 2));

    const logsRes = await pool.query(
      'SELECT id, user_id, start_date, end_date, flow_intensity, symptoms, notes, created_at FROM cycle_logs WHERE user_id = $1 ORDER BY start_date DESC LIMIT 20',
      [userId]
    );
    console.log('\n--- last 20 cycle_logs (user) ---');
    console.log(JSON.stringify(logsRes.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await pool.end();
  }
})();
