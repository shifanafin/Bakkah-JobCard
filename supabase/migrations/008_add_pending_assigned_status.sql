-- Fix job_cards_status_check to include 'pending' and 'assigned'
-- These statuses are used by createJobCard() but were missing from the original constraint.

ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_status_check;

ALTER TABLE job_cards
  ADD CONSTRAINT job_cards_status_check
  CHECK (status IN ('pending', 'assigned', 'received', 'in_progress', 'qc_check', 'ready', 'delivered', 'cancelled'));
