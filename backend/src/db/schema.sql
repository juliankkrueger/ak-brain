CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'creative'
    CHECK (role IN ('admin', 'sales', 'consultant', 'manager', 'creative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  practice_type VARCHAR(100),
  location VARCHAR(255),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'onboarding'
    CHECK (status IN ('onboarding', 'active', 'paused', 'completed')),
  package_type VARCHAR(100)
    CHECK (package_type IN ('schnellstart', 'jahrespaket', 'foerdermodell', 'individual')),
  modules TEXT[] DEFAULT '{}',
  price_setup NUMERIC(10,2),
  price_monthly NUMERIC(10,2),
  contract_start DATE,
  contract_end DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  applications INTEGER,
  google_reviews_count INTEGER,
  social_reach INTEGER,
  website_traffic INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_kpis_customer ON kpis(customer_id);
CREATE INDEX IF NOT EXISTS idx_kpis_period ON kpis(year, month);
