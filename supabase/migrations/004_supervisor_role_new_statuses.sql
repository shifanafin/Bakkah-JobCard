-- Add supervisor to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Add pending and assigned to job_status enum
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'assigned';
