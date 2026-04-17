require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./pool');
const { initSchema } = require('./init');

async function seed() {
  await initSchema();

  const email = process.env.SEED_EMAIL || 'j.krueger@agenturkrueger-digital.de';
  const password = process.env.SEED_PASSWORD || 'Krueger2026!';
  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ['Julian Krüger', email, hash]
  );

  console.log(`Admin-User bereit: ${email}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed fehlgeschlagen:', err.message);
  process.exit(1);
});
