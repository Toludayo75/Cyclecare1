const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
// Load repo root .env
const repoRootEnv = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(repoRootEnv)) dotenv.config({ path: repoRootEnv });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
      'SELECT id, user_id, start_date, end_date, flow_intensity, symptoms, notes, created_at FROM cycle_logs WHERE user_id = $1 ORDER BY start_date DESC LIMIT 10',
      [userId]
    );
    console.log('\n--- last 10 cycle_logs (user) ---');
    console.log(JSON.stringify(logsRes.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await pool.end();
  }
})();
