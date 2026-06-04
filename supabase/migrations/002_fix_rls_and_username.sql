-- AutoEdge Pro — Fix RLS policies + add username login
-- Run in: Supabase Dashboard → SQL Editor

-- ── 1. Add username column ───────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Set default username for existing admin user
UPDATE users
SET username = 'admin'
WHERE email = 'admin@autoedgepro.ae' AND username IS NULL;

-- ── 2. Grant table access to anon role ───────────────────────
-- (Auth is handled by NextAuth JWT — Supabase is used as DB only)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ── 3. Fix RLS — replace auth.role()='authenticated' with true ─
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','customers','vehicles','technicians',
    'job_cards','job_card_services','job_card_parts',
    'job_card_photos','job_card_history'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS auth_all ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_all ON %I', tbl);
    -- Allow all operations — NextAuth middleware handles authentication
    EXECUTE format(
      'CREATE POLICY allow_all ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;
