const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("select tablename from pg_tables where schemaname = current_schema()")
  .then((r) => {
    console.log(JSON.stringify(r.rows, null, 2));
  })
  .catch((e) => {
    console.error('DB error', e);
    process.exit(1);
  })
  .finally(() => pool.end());
