const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Datenbank-Schema bereit ✓');
}

module.exports = { initSchema };
