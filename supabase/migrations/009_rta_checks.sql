-- UAE RTA Vehicle Checks
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS vehicle_rta_checks (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id            UUID REFERENCES job_cards(id) ON DELETE CASCADE NOT NULL,
  plate_number           TEXT NOT NULL,
  plate_code             TEXT,           -- e.g. "A", "B", "Dubai"
  emirate                TEXT DEFAULT 'Dubai',

  -- ── Traffic Fines ──────────────────────────────────
  fines_count            INTEGER DEFAULT 0,
  fines_total_aed        DECIMAL(10,2) DEFAULT 0,
  fines                  JSONB DEFAULT '[]'::jsonb,
  -- Each fine: { id, date, location, description, amount_aed, status, source }

  -- ── Salik (Toll) ────────────────────────────────────
  salik_tag_number       TEXT,
  salik_balance_aed      DECIMAL(10,2),
  salik_transactions     JSONB DEFAULT '[]'::jsonb,
  -- Each tx: { date, gate, amount_aed }

  -- ── Mulkiya / Vehicle Registration ─────────────────
  mulkiya_expiry         DATE,
  mulkiya_status         TEXT DEFAULT 'unknown',   -- active | expired | cancelled
  registration_number    TEXT,
  owner_name             TEXT,
  owner_phone            TEXT,

  -- ── Insurance ──────────────────────────────────────
  insurance_expiry       DATE,
  insurance_status       TEXT DEFAULT 'unknown',   -- valid | expired | unknown
  insurance_company      TEXT,
  insurance_policy       TEXT,

  -- ── RTA Inspection (Technical Test) ────────────────
  inspection_expiry      DATE,
  inspection_status      TEXT DEFAULT 'unknown',   -- pass | fail | unknown
  inspection_center      TEXT,

  -- ── Meta ────────────────────────────────────────────
  include_in_invoice     BOOLEAN DEFAULT TRUE,
  notes                  TEXT,
  data_source            TEXT DEFAULT 'manual',    -- manual | moi_api | dubai_police_api | rta_api
  checked_by             UUID REFERENCES users(id),
  raw_api_response       JSONB,

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- One check per job card (upsert-friendly)
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_rta_checks_job_card_idx
  ON vehicle_rta_checks (job_card_id);

-- Row-level security
ALTER TABLE vehicle_rta_checks ENABLE ROW LEVEL SECURITY;

-- Workshop staff can read/write their own checks
CREATE POLICY "rta_checks_staff_all" ON vehicle_rta_checks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public (invoice page) can read if include_in_invoice = true
CREATE POLICY "rta_checks_public_read" ON vehicle_rta_checks
  FOR SELECT TO anon
  USING (include_in_invoice = true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_rta_checks_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER rta_checks_updated_at
  BEFORE UPDATE ON vehicle_rta_checks
  FOR EACH ROW EXECUTE FUNCTION update_rta_checks_timestamp();
