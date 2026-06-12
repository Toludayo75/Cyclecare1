const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Load DATABASE_URL from repo root .env
const repoRootEnv = path.resolve(__dirname, '..', '..', '.env');
let connectionString = process.env.DATABASE_URL;
if (!connectionString && fs.existsSync(repoRootEnv)) {
  const envText = fs.readFileSync(repoRootEnv, 'utf8');
  const match = envText.match(/^DATABASE_URL=(.*)$/m);
  if (match) connectionString = match[1].trim();
}
if (!connectionString) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}
const pool = new Pool({ connectionString });
const userId = 6;
(async () => {
  try {
    // Update profile to latest log date
    const upd = await pool.query(
      `WITH latest AS (
         SELECT user_id, MAX(start_date) AS max_date
         FROM cycle_logs
         WHERE user_id = $1
         GROUP BY user_id
       )
       UPDATE cycle_profiles cp
       SET last_period_date = latest.max_date, updated_at = now()
       FROM latest
       WHERE cp.user_id = latest.user_id
       RETURNING cp.id, cp.user_id, cp.last_period_date, cp.updated_at;`,
      [userId]
    );
    console.log('\n--- update result ---');
    console.log(JSON.stringify(upd.rows, null, 2));

    const profileRes = await pool.query('SELECT id, user_id, last_period_date, cycle_length, period_duration, created_at, updated_at FROM cycle_profiles WHERE user_id = $1 LIMIT 1', [userId]);
    console.log('\n--- cycle_profiles (after update) ---');
    console.log(JSON.stringify(profileRes.rows, null, 2));

    const logsRes = await pool.query('SELECT id, start_date, created_at FROM cycle_logs WHERE user_id = $1 ORDER BY start_date DESC LIMIT 20', [userId]);
    console.log('\n--- cycle_logs (user) ---');
    console.log(JSON.stringify(logsRes.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await pool.end();
  }
})();
