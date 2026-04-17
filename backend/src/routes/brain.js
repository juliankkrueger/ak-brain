const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const FOLDERS = [
  { key: '00_Unternehmen', label: 'Unternehmen' },
  { key: '01_Kunden',      label: 'Kunden' },
  { key: '02_Sales',       label: 'Sales' },
  { key: '03_Beratung',    label: 'Beratung' },
  { key: '04_Marketing',   label: 'Marketing' },
  { key: '05_Kreation',    label: 'Kreation' },
  { key: '06_Fuehrung',    label: 'Führung' },
  { key: '07_Finance',     label: 'Finance' },
  { key: '08_Events',      label: 'Events' },
  { key: 'assets',         label: 'Assets' },
];

router.get('/folders', (_req, res) => {
  res.json(FOLDERS);
});

router.get('/files', async (req, res) => {
  try {
    const { folder } = req.query;
    let query = 'SELECT id, folder, filename, title, has_todos, updated_at FROM brain_files';
    const params = [];
    if (folder) {
      params.push(folder);
      query += ` WHERE folder = $1`;
    }
    query += ' ORDER BY folder ASC, filename ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/files/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM brain_files WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Datei nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/files', requireRole('admin'), async (req, res) => {
  const { folder, filename, title, content } = req.body;
  if (!folder || !filename || !title) {
    return res.status(400).json({ error: 'folder, filename und title erforderlich' });
  }
  const cleanFolder = String(folder).trim().slice(0, 100);
  const cleanFilename = String(filename).trim().replace(/[^a-zA-Z0-9_\-\.]/g, '-').slice(0, 255);
  const cleanTitle = String(title).trim().slice(0, 255);
  const cleanContent = String(content || '');
  const hasTodos = /\[TODO:/i.test(cleanContent);

  try {
    const result = await pool.query(
      `INSERT INTO brain_files (folder, filename, title, content, has_todos)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (folder, filename) DO UPDATE
         SET title = EXCLUDED.title, content = EXCLUDED.content,
             has_todos = EXCLUDED.has_todos, updated_at = NOW()
       RETURNING *`,
      [cleanFolder, cleanFilename, cleanTitle, cleanContent, hasTodos]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/files/:id', requireRole('admin'), async (req, res) => {
  const { title, content } = req.body;
  const cleanContent = String(content || '');
  const hasTodos = /\[TODO:/i.test(cleanContent);
  try {
    const result = await pool.query(
      `UPDATE brain_files SET
         title = COALESCE($1, title),
         content = $2,
         has_todos = $3,
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title ? String(title).trim().slice(0, 255) : null, cleanContent, hasTodos, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Datei nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/files/:id', requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM brain_files WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Datei nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
