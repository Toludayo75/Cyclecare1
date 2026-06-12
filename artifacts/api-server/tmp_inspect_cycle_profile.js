const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const res = await pool.query('SELECT id, user_id, last_period_date, cycle_length, period_duration, rollover_balance, rollover_month FROM cycle_profiles LIMIT 20');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
