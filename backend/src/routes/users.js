const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('admin'));

const VALID_ROLES = ['admin', 'sales', 'consultant', 'manager', 'creative'];

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name erforderlich' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });

  const cleanRole = VALID_ROLES.includes(role) ? role : 'creative';

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [String(name).trim(), email.toLowerCase().trim(), hash, cleanRole]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'E-Mail bereits vergeben' });
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', async (req, res) => {
  const { name, role, password } = req.body;

  if (password) {
    if (String(password).length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });
    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]).catch(() => {});
  }

  const cleanRole = role && VALID_ROLES.includes(role) ? role : undefined;

  try {
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role)
       WHERE id = $3
       RETURNING id, name, email, role, created_at`,
      [name ? String(name).trim() : null, cleanRole ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Du kannst deinen eigenen Account nicht löschen' });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
