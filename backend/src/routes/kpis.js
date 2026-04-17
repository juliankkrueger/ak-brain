const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const EDIT_ROLES = ['admin', 'consultant'];

function safeInt(v, min, max) {
  const n = parseInt(v, 10);
  if (isNaN(n) || n < min || n > max) return null;
  return n;
}

router.get('/', async (req, res) => {
  const { customerId, year } = req.query;
  try {
    let query = 'SELECT * FROM kpis WHERE 1=1';
    const params = [];

    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }
    const yearInt = safeInt(year, 2000, 2100);
    if (yearInt !== null) {
      params.push(yearInt);
      query += ` AND year = $${params.length}`;
    }
    query += ' ORDER BY year DESC, month DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/', requireRole(...EDIT_ROLES), async (req, res) => {
  const { customer_id, month, year, applications, google_reviews_count, social_reach, website_traffic, notes } = req.body;

  const monthInt = safeInt(month, 1, 12);
  const yearInt = safeInt(year, 2000, 2100);
  if (!customer_id) return res.status(400).json({ error: 'customer_id erforderlich' });
  if (!monthInt) return res.status(400).json({ error: 'Ungültiger Monat (1-12)' });
  if (!yearInt) return res.status(400).json({ error: 'Ungültiges Jahr (2000-2100)' });

  try {
    const result = await pool.query(
      `INSERT INTO kpis (customer_id, month, year, applications, google_reviews_count, social_reach, website_traffic, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (customer_id, month, year)
       DO UPDATE SET
         applications = EXCLUDED.applications,
         google_reviews_count = EXCLUDED.google_reviews_count,
         social_reach = EXCLUDED.social_reach,
         website_traffic = EXCLUDED.website_traffic,
         notes = EXCLUDED.notes
       RETURNING *`,
      [
        customer_id, monthInt, yearInt,
        safeInt(applications, 0, 99999),
        safeInt(google_reviews_count, 0, 99999),
        safeInt(social_reach, 0, 9999999),
        safeInt(website_traffic, 0, 9999999),
        notes ? String(notes).trim().slice(0, 1000) : null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', requireRole(...EDIT_ROLES), async (req, res) => {
  const { applications, google_reviews_count, social_reach, website_traffic, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE kpis SET
        applications = COALESCE($1, applications),
        google_reviews_count = COALESCE($2, google_reviews_count),
        social_reach = COALESCE($3, social_reach),
        website_traffic = COALESCE($4, website_traffic),
        notes = COALESCE($5, notes)
       WHERE id = $6
       RETURNING *`,
      [
        safeInt(applications, 0, 99999),
        safeInt(google_reviews_count, 0, 99999),
        safeInt(social_reach, 0, 9999999),
        safeInt(website_traffic, 0, 9999999),
        notes ? String(notes).trim().slice(0, 1000) : null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'KPI-Eintrag nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', requireRole(...EDIT_ROLES), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM kpis WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'KPI-Eintrag nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
