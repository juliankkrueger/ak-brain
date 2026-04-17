const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase().trim();
}

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function matchCustomer(data) {
  const customers = await pool.query('SELECT id, name, contact_email FROM customers');
  const rows = customers.rows;

  // 1. Match by email domain
  const applicantEmail = data.email || data.Email || data.applicant_email || data.bewerber_email || '';
  if (applicantEmail) {
    const domain = extractDomain(applicantEmail);
    if (domain) {
      const match = rows.find(r => r.contact_email && extractDomain(r.contact_email) === domain);
      if (match) return match.id;
    }
  }

  // 2. Match by customer/company name in payload
  const payloadName = normalize(
    data.customer || data.company || data.firma || data.Firma ||
    data.Kunde || data.kunde || data.employer || data.arbeitgeber || ''
  );
  if (payloadName.length > 2) {
    const match = rows.find(r => {
      const n = normalize(r.name);
      return n.includes(payloadName) || payloadName.includes(n);
    });
    if (match) return match.id;
  }

  return null;
}

router.post('/applicants', async (req, res) => {
  const token = req.query.token || req.headers['x-webhook-token'];
  if (!token) return res.status(401).json({ error: 'Token erforderlich' });

  try {
    const tokenCheck = await pool.query(
      'SELECT id FROM webhook_tokens WHERE token = $1',
      [token]
    );
    if (tokenCheck.rows.length === 0) return res.status(401).json({ error: 'Ungültiger Token' });

    const data = req.body;

    const firstName = String(
      data.first_name || data.vorname || data.Vorname || data.firstName || ''
    ).trim().slice(0, 100);
    const lastName = String(
      data.last_name || data.nachname || data.Nachname || data.lastName ||
      data.name || data.Name || ''
    ).trim().slice(0, 100);
    const email = String(data.email || data.Email || data.applicant_email || '').trim().slice(0, 255);
    const phone = String(data.phone || data.telefon || data.Telefon || data.Phone || '').trim().slice(0, 50);
    const position = String(
      data.position || data.stelle || data.Stelle || data.job || data.Job ||
      data.jobtitle || data.Jobtitel || ''
    ).trim().slice(0, 255);

    const customerId = await matchCustomer(data);

    const result = await pool.query(
      `INSERT INTO applicants (customer_id, first_name, last_name, email, phone, position, source, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, 'webhook', $7)
       RETURNING id`,
      [customerId, firstName, lastName, email, phone, position, JSON.stringify(data)]
    );

    res.status(201).json({
      ok: true,
      id: result.rows[0].id,
      customer_matched: !!customerId,
    });
  } catch (err) {
    console.error('Webhook-Fehler:', err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
