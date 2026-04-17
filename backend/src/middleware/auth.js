const pool = require('../db/pool');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const token = header.slice(7);
  try {
    const result = await pool.query(
      `SELECT s.user_id, s.expires_at, u.id, u.name, u.email, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Ungültige Session' });
    }

    const session = result.rows[0];
    if (new Date(session.expires_at) < new Date()) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
      return res.status(401).json({ error: 'Session abgelaufen' });
    }

    req.user = {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
    };
    next();
  } catch (err) {
    console.error('Auth-Fehler:', err.message);
    res.status(500).json({ error: 'Serverfehler' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Nicht authentifiziert' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
