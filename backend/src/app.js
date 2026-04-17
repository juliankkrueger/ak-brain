require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db/pool');
const { initSchema } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Only allow requests from same origin in production
app.use((req, res, next) => {
  if (isProd && req.headers.origin && req.headers.origin !== `https://${req.headers.host}`) {
    return res.status(403).json({ error: 'Zugriff verweigert' });
  }
  next();
});

app.use(express.json({ limit: '512kb' }));

// Global rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte warten.' },
}));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/kpis', require('./routes/kpis'));
app.use('/api/users', require('./routes/users'));

// Health check (no auth needed)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React build in production
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function cleanExpiredSessions() {
  try {
    const result = await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    if (result.rowCount > 0) {
      console.log(`${result.rowCount} abgelaufene Sessions bereinigt`);
    }
  } catch (err) {
    console.error('Session-Cleanup fehlgeschlagen:', err.message);
  }
}

initSchema()
  .then(async () => {
    await cleanExpiredSessions();
    // Clean expired sessions every hour
    setInterval(cleanExpiredSessions, 60 * 60 * 1000);
    app.listen(PORT, () => {
      console.log(`Agency Dashboard läuft auf Port ${PORT} ✓`);
    });
  })
  .catch((err) => {
    console.error('DB-Init fehlgeschlagen:', err.message);
    process.exit(1);
  });
