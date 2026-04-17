const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const EDIT_ROLES = ['admin', 'consultant'];

const VALID_STATUS = ['onboarding', 'active', 'paused', 'completed'];
const VALID_PACKAGES = ['schnellstart', 'jahrespaket', 'foerdermodell', 'individual'];
const VALID_MODULES = [
  'Marketing & Branding',
  'Never Stop Recruiting',
  'Das Große Blutbild',
  'Leadership & Mentoring',
  'Prozesse & Strukturen',
  'Elevate your Network',
];

function sanitizeText(v) {
  if (v == null) return null;
  return String(v).trim().slice(0, 500);
}

function sanitizeMoney(v) {
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? null : Math.round(n * 100) / 100;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kunde nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.post('/', requireRole(...EDIT_ROLES), async (req, res) => {
  const { name, practice_type, location, contact_name, contact_email, contact_phone,
    status, package_type, modules, price_setup, price_monthly, contract_start, contract_end, notes } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }

  const cleanStatus = VALID_STATUS.includes(status) ? status : 'onboarding';
  const cleanPackage = VALID_PACKAGES.includes(package_type) ? package_type : null;
  const cleanModules = Array.isArray(modules)
    ? modules.filter(m => VALID_MODULES.includes(m))
    : [];

  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers
        (name, practice_type, location, contact_name, contact_email, contact_phone,
         status, package_type, modules, price_setup, price_monthly,
         contract_start, contract_end, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        sanitizeText(name), sanitizeText(practice_type), sanitizeText(location),
        sanitizeText(contact_name), sanitizeText(contact_email), sanitizeText(contact_phone),
        cleanStatus, cleanPackage, cleanModules,
        sanitizeMoney(price_setup), sanitizeMoney(price_monthly),
        contract_start || null, contract_end || null, sanitizeText(notes),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.put('/:id', requireRole(...EDIT_ROLES), async (req, res) => {
  const { name, practice_type, location, contact_name, contact_email, contact_phone,
    status, package_type, modules, price_setup, price_monthly, contract_start, contract_end, notes } = req.body;

  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }

  const cleanStatus = status && VALID_STATUS.includes(status) ? status : undefined;
  const cleanPackage = package_type && VALID_PACKAGES.includes(package_type) ? package_type : undefined;
  const cleanModules = Array.isArray(modules)
    ? modules.filter(m => VALID_MODULES.includes(m))
    : undefined;

  try {
    const result = await pool.query(
      `UPDATE customers SET
        name = COALESCE($1, name),
        practice_type = COALESCE($2, practice_type),
        location = COALESCE($3, location),
        contact_name = COALESCE($4, contact_name),
        contact_email = COALESCE($5, contact_email),
        contact_phone = COALESCE($6, contact_phone),
        status = COALESCE($7, status),
        package_type = COALESCE($8, package_type),
        modules = COALESCE($9, modules),
        price_setup = COALESCE($10, price_setup),
        price_monthly = COALESCE($11, price_monthly),
        contract_start = COALESCE($12, contract_start),
        contract_end = COALESCE($13, contract_end),
        notes = COALESCE($14, notes),
        updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        name ? sanitizeText(name) : null,
        sanitizeText(practice_type), sanitizeText(location),
        sanitizeText(contact_name), sanitizeText(contact_email), sanitizeText(contact_phone),
        cleanStatus ?? null, cleanPackage ?? null, cleanModules ?? null,
        price_setup != null ? sanitizeMoney(price_setup) : null,
        price_monthly != null ? sanitizeMoney(price_monthly) : null,
        contract_start || null, contract_end || null,
        notes != null ? sanitizeText(notes) : null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kunde nicht gefunden' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kunde nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
