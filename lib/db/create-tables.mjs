import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
  });

  const client = await pool.connect();
  
  try {
    console.log("Connected to Aiven!");
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        has_completed_onboarding BOOLEAN NOT NULL DEFAULT false,
        age INTEGER,
        address TEXT,
        city TEXT,
        state TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ users table created");

    // Create cycle_profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cycle_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        last_period_date TEXT NOT NULL,
        cycle_length INTEGER NOT NULL DEFAULT 28,
        period_duration INTEGER NOT NULL DEFAULT 5,
        flow_type TEXT NOT NULL DEFAULT 'medium',
        notifications_enabled BOOLEAN NOT NULL DEFAULT true,
        rollover_balance INTEGER NOT NULL DEFAULT 0,
        rollover_month TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ cycle_profiles table created");

    // Create cycle_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cycle_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        start_date TEXT NOT NULL,
        end_date TEXT,
        flow_intensity TEXT NOT NULL,
        symptoms TEXT[],
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ cycle_logs table created");

    // Create pad_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pad_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        ngo_id INTEGER,
        pickup_center_id INTEGER,
        quantity INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        pickup_code TEXT,
        pickup_location TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ pad_requests table created");

    // Create articles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_yo TEXT,
        title_ig TEXT,
        title_ha TEXT,
        body_en TEXT NOT NULL,
        body_yo TEXT,
        body_ig TEXT,
        body_ha TEXT,
        excerpt_en TEXT NOT NULL,
        excerpt_yo TEXT,
        excerpt_ig TEXT,
        excerpt_ha TEXT,
        category TEXT NOT NULL,
        read_min INTEGER NOT NULL DEFAULT 5,
        published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ articles table created");

    // Create ngos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ngos (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        state TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        monthly_quota INTEGER NOT NULL DEFAULT 50,
        available_pads INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ngos_unique_cyclecare_charity
      ON ngos (name)
      WHERE name = 'CycleCare Charity'
    `);
    console.log("✓ ngos table created");

    // Create ngo_workers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ngo_workers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ngo_id INTEGER NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ ngo_workers table created");

    // Create pickup_centers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pickup_centers (
        id SERIAL PRIMARY KEY,
        ngo_id INTEGER NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        landmark TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ pickup_centers table created");

    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        from_ngo_id INTEGER,
        to_ngo_id INTEGER,
        ngo_id INTEGER,
        user_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ events table created");

    console.log("\n✅ All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
