-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Migrate from NextAuth to Better Auth
--
-- Changes to existing `users` table:
--   • Add email_verified (BA requires it)
--   • Add updated_at       (BA requires it)
--   • Add display_username (BA username plugin stores display form)
--
-- New tables:
--   • ba_session     — Better Auth sessions
--   • ba_account     — Better Auth accounts + credential passwords
--   • ba_verification — Better Auth email/phone verification tokens
--
-- Password migration:
--   Existing bcrypt hashes from users.password_hash are copied into
--   ba_account.password so existing logins continue to work.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Patch users table ─────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS display_username  TEXT;

-- Back-fill updated_at from created_at for existing rows
UPDATE users SET updated_at = created_at WHERE updated_at = NOW() AND created_at IS NOT NULL;

-- ── 2. Create ba_session ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ba_session (
  id         TEXT        PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  token      TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ba_session_user_id_idx ON ba_session(user_id);

-- ── 3. Create ba_account ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ba_account (
  id                        TEXT PRIMARY KEY,
  account_id                TEXT        NOT NULL,
  provider_id               TEXT        NOT NULL,
  user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token              TEXT,
  refresh_token             TEXT,
  id_token                  TEXT,
  access_token_expires_at   TIMESTAMPTZ,
  refresh_token_expires_at  TIMESTAMPTZ,
  scope                     TEXT,
  password                  TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ba_account_user_id_idx ON ba_account(user_id);

-- ── 4. Create ba_verification ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ba_verification (
  id         TEXT        PRIMARY KEY,
  identifier TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ         DEFAULT NOW(),
  updated_at TIMESTAMPTZ         DEFAULT NOW()
);

-- ── 5. Migrate existing passwords into ba_account ───────────────────────────
--
-- This lets existing users log in immediately without a password reset.
-- account_id = email (BA credential provider uses email as accountId).

INSERT INTO ba_account (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT
  gen_random_uuid()::text,
  email,
  'credential',
  id,
  password_hash,
  created_at,
  NOW()
FROM users
WHERE password_hash IS NOT NULL
ON CONFLICT DO NOTHING;
