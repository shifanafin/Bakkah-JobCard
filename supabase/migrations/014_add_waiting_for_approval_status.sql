-- Add 'waiting_for_approval' as the initial status for all new job cards.
-- Jobs start here and move to 'pending' (or 'assigned') once approved.

ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_status_check;

ALTER TABLE job_cards
  ADD CONSTRAINT job_cards_status_check
  CHECK (status IN ('waiting_for_approval', 'pending', 'assigned', 'received', 'in_progress', 'qc_check', 'ready', 'delivered', 'cancelled'));
