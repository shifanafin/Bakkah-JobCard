-- ============================================================
-- 016 — Add inspection status + signature columns
-- Run this in Supabase SQL editor
-- ============================================================

-- 1. Extend the status check constraint to include 'inspection'
ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_status_check;
ALTER TABLE job_cards ADD CONSTRAINT job_cards_status_check
  CHECK (status IN (
    'inspection',
    'waiting_for_approval',
    'pending',
    'assigned',
    'received',
    'in_progress',
    'qc_check',
    'ready',
    'delivered',
    'cancelled'
  ));

-- 2. Set the default status for new job cards to 'inspection'
ALTER TABLE job_cards ALTER COLUMN status SET DEFAULT 'inspection';

-- 3. Add customer and supervisor signature URL columns
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS customer_signature_url  TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_signature_url TEXT;

-- 4. Allow anon to read signature columns on public-facing rows
-- (existing RLS policies already cover the row; the new columns inherit them)
