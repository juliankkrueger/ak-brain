const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const VALID_STATUS = ['offen', 'kontaktiert', 'eingestellt', 'disqualifiziert'];

router.get('/', async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    let query = `
      SELECT a.*, c.name AS customer_name
      FROM applicants a
      LEFT JOIN customers c ON c.id = a.customer_id
    `;
    const params = [];
    const conditions = [];
    if (status && VALID_STATUS.includes(status)) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (customer_id) {
      params.push(customer_id);
      conditions.push(`a.customer_id = $${params.length}`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const statusCounts = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM applicants GROUP BY status`
    );

    const monthly = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        EXTRACT(MONTH FROM created_at)::int AS month,
        COUNT(*)::int AS count
       FROM applicants
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY year, month
       ORDER BY year, month`
    );

    res.json({
      byStatus: statusCounts.rows,
      monthly: monthly.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/webhook-token', requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT token, name, created_at FROM webhook_tokens ORDER BY created_at ASC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }
  try {
    const result = await pool.query(
      `UPDATE applicants SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, status`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bewerber nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', async (req, res) => {
  const { notes, customer_id, first_name, last_name, email, phone, position } = req.body;
  try {
    const result = await pool.query(
      `UPDATE applicants SET
        notes = COALESCE($1, notes),
        customer_id = COALESCE($2, customer_id),
        first_name = COALESCE($3, first_name),
        last_name = COALESCE($4, last_name),
        email = COALESCE($5, email),
        phone = COALESCE($6, phone),
        position = COALESCE($7, position),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        notes ?? null,
        customer_id ?? null,
        first_name ? String(first_name).trim().slice(0, 100) : null,
        last_name ? String(last_name).trim().slice(0, 100) : null,
        email ? String(email).trim().slice(0, 255) : null,
        phone ? String(phone).trim().slice(0, 50) : null,
        position ? String(position).trim().slice(0, 255) : null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bewerber nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', requireRole('admin', 'consultant'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM applicants WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bewerber nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
