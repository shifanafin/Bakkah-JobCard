-- 007: Visitor Analytics — track public website interactions

CREATE TABLE IF NOT EXISTS visitor_analytics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   TEXT NOT NULL,   -- page_view | track_search | track_found | track_not_found | feedback_submit
  session_id   TEXT,            -- client-generated UUID for session grouping
  job_number   TEXT,            -- if a job was found or submitted
  query_type   TEXT,            -- job_number | phone
  device_type  TEXT,            -- mobile | tablet | desktop
  ip_partial   TEXT,            -- first 3 octets only (anonymized for privacy)
  country      TEXT,
  city         TEXT,
  user_agent   TEXT,
  referrer     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Public can insert (fire-and-forget from track page)
CREATE POLICY "analytics_public_insert" ON visitor_analytics FOR INSERT WITH CHECK (true);
-- Only authenticated staff can read
CREATE POLICY "analytics_auth_read" ON visitor_analytics FOR SELECT TO authenticated USING (true);

-- Index for fast admin queries
CREATE INDEX IF NOT EXISTS analytics_event_type_idx ON visitor_analytics(event_type);
CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON visitor_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_session_idx ON visitor_analytics(session_id);
