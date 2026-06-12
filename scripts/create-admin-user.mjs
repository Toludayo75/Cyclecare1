import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const args = process.argv.slice(2);
const shouldResetPassword = args.includes("--reset-password");
const passwordArg = args.find((arg) => arg.startsWith("--password="));
const password = passwordArg ? passwordArg.split("=")[1] : "admin123";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
});

const client = await pool.connect();
try {
  const email = "admin@cyclecare.com";

  const existing = await client.query(
    "SELECT id, email, role FROM users WHERE email = $1 LIMIT 1",
    [email]
  );

  if (existing.rowCount > 0) {
    if (shouldResetPassword) {
      const passwordHash = await bcrypt.hash(password, 10);
      const update = await client.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, role",
        [passwordHash, email]
      );
      console.log("Reset admin user password:", update.rows[0]);
      process.exit(0);
    }

    console.log("Admin user already exists:", existing.rows[0]);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await client.query(
    `INSERT INTO users (name, email, phone, password_hash, role, has_completed_onboarding, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING id, email, role`,
    ["Admin", email, null, passwordHash, "admin"]
  );

  console.log("Created admin user:", insert.rows[0]);
} catch (error) {
  console.error("Failed to create admin user:", error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
