import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const ngoResult = await client.query('SELECT id FROM ngos LIMIT 1');
  let ngoId;

  if (ngoResult.rowCount === 0) {
    const insertNgo = await client.query(
      `INSERT INTO ngos (name, region, state, contact_email, monthly_quota, available_pads, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [
        'Example NGO',
        'Southwest',
        'Lagos',
        'contact@ngo.example',
        200,
        150,
      ]
    );
    ngoId = insertNgo.rows[0].id;
    console.log('Created default NGO with id', ngoId);
  } else {
    ngoId = ngoResult.rows[0].id;
    console.log('Existing NGO found with id', ngoId);
  }

  const userResult = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['worker@ngo.com']);
  if (userResult.rowCount === 0) {
    console.error('No user found with email worker@ngo.com');
    process.exit(1);
  }

  const userId = userResult.rows[0].id;
  const workerResult = await client.query('SELECT id FROM ngo_workers WHERE user_id = $1 LIMIT 1', [userId]);

  if (workerResult.rowCount === 0) {
    const insertWorker = await client.query(
      'INSERT INTO ngo_workers (user_id, ngo_id, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [userId, ngoId]
    );
    console.log('Created ngo_worker link with id', insertWorker.rows[0].id);
  } else {
    console.log('Existing ngo_worker link found for user', userId);
  }

  const centerResult = await client.query('SELECT id FROM pickup_centers WHERE ngo_id = $1 LIMIT 1', [ngoId]);
  if (centerResult.rowCount === 0) {
    const insertCenter = await client.query(
      `INSERT INTO pickup_centers (ngo_id, name, address, city, state, landmark, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [ngoId, 'Main Pickup Center', '123 Market Street', 'Lagos', 'Lagos', 'Near Central Park']
    );
    console.log('Created default pickup center with id', insertCenter.rows[0].id);
  } else {
    console.log('Existing pickup center found for NGO', ngoId);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
