-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 012: Clear all users and auth data for fresh admin setup
--
-- Deletes all rows from auth-related tables in dependency order.
-- Job cards, customers, vehicles, technicians, etc. are preserved.
-- ─────────────────────────────────────────────────────────────────────────────

-- Sessions and accounts reference users → delete them first
DELETE FROM ba_session;
DELETE FROM ba_account;
DELETE FROM ba_verification;

-- Now delete all users
DELETE FROM users;
