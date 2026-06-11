-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011: Fix ba_account.id default + backfill missing credential entries
--
-- Problem: ba_account.id had no DEFAULT so custom signup inserts failed silently,
-- leaving users with a `users` row but no `ba_account` entry (can't log in).
--
-- Fixes:
--   1. Add DEFAULT gen_random_uuid()::text to ba_account.id
--   2. Backfill ba_account rows for any users that are missing them
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add DEFAULT to ba_account.id ─────────────────────────────────────────
ALTER TABLE ba_account
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- ── 2. Backfill missing credential accounts ──────────────────────────────────
-- Insert a ba_account entry for every user that has a password_hash but no
-- existing credential account. Uses ON CONFLICT DO NOTHING for safety.

INSERT INTO ba_account (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT
  gen_random_uuid()::text,
  u.id::text,          -- account_id = user id (matches Better Auth credential convention)
  'credential',
  u.id,
  u.password_hash,
  COALESCE(u.created_at, NOW()),
  NOW()
FROM users u
WHERE u.password_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ba_account a
    WHERE a.user_id = u.id AND a.provider_id = 'credential'
  );
