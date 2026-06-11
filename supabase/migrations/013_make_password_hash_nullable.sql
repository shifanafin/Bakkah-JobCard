-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013: Make password_hash nullable
--
-- Better Auth stores passwords in ba_account.password, NOT in users.password_hash.
-- The NOT NULL constraint on password_hash prevents Better Auth from inserting
-- users via its native signUpEmail API (it doesn't know about this column).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
