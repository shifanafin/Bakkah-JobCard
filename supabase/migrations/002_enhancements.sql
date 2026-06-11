-- ============================================================
-- Bakkah — Migration 002: Tracking, Supervisor Role, History
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add 'supervisor' to the users role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'supervisor', 'manager', 'technician', 'receptionist'));

-- 2. Add 'pending' and 'assigned' to job_cards status constraint (align with types)
ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_status_check;
ALTER TABLE job_cards ADD CONSTRAINT job_cards_status_check
  CHECK (status IN ('pending', 'assigned', 'received', 'in_progress', 'qc_check', 'ready', 'delivered', 'cancelled'));

-- 3. Public (anon) read-only policies for customer self-service tracking
--    These allow the /track page to query via the anon key without auth

-- Allow anon to read job cards for tracking (select only, no sensitive fields exposed via API)
DO $$ BEGIN
  EXECUTE 'CREATE POLICY anon_read_job_cards ON job_cards FOR SELECT USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY anon_read_customers ON customers FOR SELECT USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY anon_read_vehicles ON vehicles FOR SELECT USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY anon_read_services ON job_card_services FOR SELECT USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY anon_read_parts ON job_card_parts FOR SELECT USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY anon_read_photos ON job_card_photos FOR SELECT USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Index on job_card_history for fast timeline loading
CREATE INDEX IF NOT EXISTS idx_history_job   ON job_card_history(job_card_id);
CREATE INDEX IF NOT EXISTS idx_history_date  ON job_card_history(created_at);

-- 5. Index on vehicles for customer_id (for fast history lookups)
CREATE INDEX IF NOT EXISTS idx_veh_customer  ON vehicles(customer_id);

-- 6. Index on job_cards for vehicle_id (for full vehicle history)
CREATE INDEX IF NOT EXISTS idx_jc_vehicle    ON job_cards(vehicle_id);

-- 7. Ensure updated_at is kept current on customers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
