-- Fix users table CHECK constraint to include supervisor role
-- (Migration 004 fixed the enum but not the TEXT column's CHECK constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','manager','technician','receptionist','supervisor'));
