-- AutoEdge Pro — Complete Database Schema
-- Run in: Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (workshop staff)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT DEFAULT 'receptionist' CHECK (role IN ('admin','manager','technician','receptionist')),
  avatar_url    TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@autoedgepro.ae', '$2a$10$jwGEki0g7JA11/PGPnfhm.S08.mdNkNLQixmeCjoAwmHQJhbvTLwa', 'Admin User', 'admin')
ON CONFLICT DO NOTHING;

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  emirates_id   TEXT,
  company_name  TEXT,
  is_fleet      BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,
  plate_number  TEXT NOT NULL,
  make          TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INTEGER,
  color         TEXT,
  vin           TEXT,
  mileage_in    INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TECHNICIANS
CREATE TABLE IF NOT EXISTS technicians (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  phone      TEXT,
  role       TEXT DEFAULT 'Technician',
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO technicians (name, role) VALUES
  ('Ahmed Al Mansoori', 'Inspector'),
  ('Mohammed Rashid', 'Technician'),
  ('Sanjay Kumar', 'Detailer')
ON CONFLICT DO NOTHING;

-- JOB CARDS
CREATE SEQUENCE IF NOT EXISTS job_card_seq START 1;

CREATE TABLE IF NOT EXISTS job_cards (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number          TEXT UNIQUE NOT NULL DEFAULT '',
  customer_id         UUID REFERENCES customers(id),
  vehicle_id          UUID REFERENCES vehicles(id),
  technician_id       UUID REFERENCES technicians(id),
  status              TEXT DEFAULT 'received' CHECK (status IN ('received','in_progress','qc_check','ready','delivered','cancelled')),
  job_type            TEXT DEFAULT 'service' CHECK (job_type IN ('service','inspection','detailing','repair','rta_check','valuation','other')),
  date_in             DATE NOT NULL DEFAULT CURRENT_DATE,
  date_out            DATE,
  date_delivered      TIMESTAMPTZ,
  mileage_in          INTEGER,
  mileage_out         INTEGER,
  customer_complaint  TEXT,
  work_instructions   TEXT,
  subtotal            NUMERIC(10,2) DEFAULT 0,
  vat_amount          NUMERIC(10,2) DEFAULT 0,
  discount            NUMERIC(10,2) DEFAULT 0,
  total               NUMERIC(10,2) DEFAULT 0,
  payment_status      TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  payment_method      TEXT,
  internal_notes      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.job_number := 'JC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('job_card_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_job_number BEFORE INSERT ON job_cards
  FOR EACH ROW WHEN (NEW.job_number = '' OR NEW.job_number IS NULL)
  EXECUTE FUNCTION set_job_number();

-- SERVICES
CREATE TABLE IF NOT EXISTS job_card_services (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id  UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  quantity     NUMERIC(10,2) DEFAULT 1,
  unit_price   NUMERIC(10,2) NOT NULL,
  total_price  NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  completed    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- PARTS
CREATE TABLE IF NOT EXISTS job_card_parts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id  UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  part_name    TEXT NOT NULL,
  part_number  TEXT,
  quantity     NUMERIC(10,2) DEFAULT 1,
  unit_price   NUMERIC(10,2) NOT NULL,
  total_price  NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- PHOTOS
CREATE TABLE IF NOT EXISTS job_card_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id     UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  cloudinary_url  TEXT NOT NULL,
  cloudinary_id   TEXT,
  category        TEXT DEFAULT 'other' CHECK (category IN ('exterior_front','exterior_rear','exterior_left','exterior_right','interior','engine_bay','damage','before_work','after_work','other')),
  caption         TEXT,
  taken_by        TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- HISTORY
CREATE TABLE IF NOT EXISTS job_card_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id  UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  old_status   TEXT,
  new_status   TEXT NOT NULL,
  changed_by   TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- AUTO-RECALCULATE TOTALS
CREATE OR REPLACE FUNCTION recalc_totals(p_id UUID) RETURNS VOID AS $$
DECLARE v_svc NUMERIC; v_prt NUMERIC; v_sub NUMERIC; v_disc NUMERIC; v_vat NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total_price),0) INTO v_svc FROM job_card_services WHERE job_card_id = p_id;
  SELECT COALESCE(SUM(total_price),0) INTO v_prt FROM job_card_parts WHERE job_card_id = p_id;
  SELECT COALESCE(discount,0) INTO v_disc FROM job_cards WHERE id = p_id;
  v_sub := v_svc + v_prt - v_disc;
  v_vat := ROUND(v_sub * 0.05, 2);
  UPDATE job_cards SET subtotal=v_sub, vat_amount=v_vat, total=v_sub+v_vat, updated_at=NOW() WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_recalc() RETURNS TRIGGER AS $$
BEGIN PERFORM recalc_totals(CASE WHEN TG_OP='DELETE' THEN OLD.job_card_id ELSE NEW.job_card_id END); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_svc AFTER INSERT OR UPDATE OR DELETE ON job_card_services FOR EACH ROW EXECUTE FUNCTION trg_recalc();
CREATE TRIGGER recalc_prt AFTER INSERT OR UPDATE OR DELETE ON job_card_parts FOR EACH ROW EXECUTE FUNCTION trg_recalc();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
DO $$ BEGIN
  EXECUTE 'CREATE POLICY auth_all ON users FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON customers FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON vehicles FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON technicians FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON job_cards FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON job_card_services FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON job_card_parts FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON job_card_photos FOR ALL USING (auth.role() = ''authenticated'')';
  EXECUTE 'CREATE POLICY auth_all ON job_card_history FOR ALL USING (auth.role() = ''authenticated'')';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_jc_status     ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_jc_date       ON job_cards(date_in);
CREATE INDEX IF NOT EXISTS idx_jc_customer   ON job_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_veh_plate     ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_photos_job    ON job_card_photos(job_card_id);
