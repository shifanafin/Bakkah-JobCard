-- 006: Attendance (WiFi check-in/out) + Customer Feedback

-- ATTENDANCE
-- One row per user per day. First WiFi connect = checkin, last disconnect = checkout.
CREATE TABLE IF NOT EXISTS attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_auth_read"   ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance_auth_insert" ON attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attendance_auth_update" ON attendance FOR UPDATE TO authenticated USING (true);

-- CUSTOMER FEEDBACK
-- Submitted via public track page; only approved ones are shown publicly.
CREATE TABLE IF NOT EXISTS customer_feedback (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id   UUID REFERENCES job_cards(id) ON DELETE SET NULL,
  job_number    TEXT,
  customer_name TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  approved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit; only authenticated (admin) can see all; anon can read approved only
CREATE POLICY "feedback_anyone_insert" ON customer_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_anon_read"     ON customer_feedback FOR SELECT USING (approved = true);
CREATE POLICY "feedback_auth_all"      ON customer_feedback FOR ALL TO authenticated USING (true);
