-- Établi PostgreSQL / Supabase Schema Migration
-- Invariants enforced:
--   1. Row-Level Security (RLS) enabled and forced on EVERY table.
--   2. Zero raw IP columns anywhere in schema (uses salted daily SHA-256 client_fingerprint_hash).
--   3. All monetary / stipend / score columns are integer types (never floating point).

CREATE TABLE IF NOT EXISTS bench_telemetry_runs (
  id BIGSERIAL PRIMARY KEY,
  lesson_id TEXT NOT NULL CHECK (char_length(lesson_id) BETWEEN 3 AND 40),
  phase_mode TEXT NOT NULL CHECK (phase_mode IN ('show', 'guide', 'solo', 'debrief', 'explore')),
  position_code TEXT NOT NULL CHECK (position_code IN ('DU', 'DD', 'CU', 'CD', 'CL', 'CR')),
  amplitude_tenths_deg INTEGER NOT NULL CHECK (amplitude_tenths_deg BETWEEN 0 AND 3600),
  rate_tenths_sec_day INTEGER NOT NULL CHECK (rate_tenths_sec_day BETWEEN -9999 AND 9999),
  beat_error_tenths_ms INTEGER NOT NULL CHECK (beat_error_tenths_ms BETWEEN 0 AND 999),
  slips_count INTEGER NOT NULL DEFAULT 0 CHECK (slips_count >= 0),
  solo_passed BOOLEAN NOT NULL DEFAULT false,
  client_fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bench_telemetry_lesson ON bench_telemetry_runs (lesson_id, created_at DESC);

CREATE TABLE IF NOT EXISTS quiz_assessments (
  id BIGSERIAL PRIMARY KEY,
  stage TEXT NOT NULL CHECK (stage IN ('pre', 'post')),
  score_points INTEGER NOT NULL CHECK (score_points BETWEEN 0 AND 20),
  total_questions INTEGER NOT NULL DEFAULT 20 CHECK (total_questions = 20),
  client_fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advisor_lesson_reviews (
  lesson_id TEXT PRIMARY KEY CHECK (char_length(lesson_id) BETWEEN 3 AND 40),
  advisor_handle TEXT NOT NULL,
  approved_stipend_cents INTEGER NOT NULL DEFAULT 0 CHECK (approved_stipend_cents >= 0),
  signed_off_events_count INTEGER NOT NULL DEFAULT 0 CHECK (signed_off_events_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advisor_webhook_events (
  event_id TEXT PRIMARY KEY CHECK (char_length(event_id) BETWEEN 4 AND 128),
  session_id TEXT NOT NULL UNIQUE CHECK (char_length(session_id) BETWEEN 4 AND 128),
  lesson_id TEXT NOT NULL REFERENCES advisor_lesson_reviews (lesson_id) ON DELETE CASCADE,
  stipend_delta_cents INTEGER NOT NULL CHECK (stipend_delta_cents >= 0),
  payload_sha256 TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable & force RLS on every table so an exposed anon key can never dump rows
ALTER TABLE bench_telemetry_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bench_telemetry_runs FORCE ROW LEVEL SECURITY;

ALTER TABLE quiz_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_assessments FORCE ROW LEVEL SECURITY;

ALTER TABLE advisor_lesson_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_lesson_reviews FORCE ROW LEVEL SECURITY;

ALTER TABLE advisor_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_webhook_events FORCE ROW LEVEL SECURITY;

-- Public read-only access only to curriculum advisor review status; telemetry & webhook logs remain server-only
DROP POLICY IF EXISTS advisor_reviews_public_read ON advisor_lesson_reviews;
CREATE POLICY advisor_reviews_public_read
  ON advisor_lesson_reviews
  FOR SELECT
  TO PUBLIC
  USING (true);
