/*
# Create reports and report_responses tables

## Purpose
This migration creates the database tables to store Moja Behavioral Services
staff communication submissions (Heads Up, Moja Moment, Tech Issue, SOS) and
the admin response log for each report. This replaces the previous localStorage
approach, making reports available across all devices and admin sessions.

## New Tables

### reports
Stores each individual staff submission.
- id (uuid, primary key)
- created_at (timestamptz, when the report was submitted)
- submission_type (text, e.g. "Heads Up", "Moja Moment", "Tech Issue", "SOS — URGENT HELP NEEDED")
- staff_name (text, name of the submitting staff member)
- staff_email (text, email of the submitting staff member)
- category (text, e.g. "Client / Session", "EMERGENCY")
- impact (text, what was impacted)
- involved_staff (text, names of staff involved)
- involved_client (text, client initials involved)
- headsup_text (text, main description for heads-up / tech / SOS reports)
- improvement (text, suggested improvement)
- urgency (text, e.g. "RED — Act immediately")
- followup (text, e.g. "Yes — follow up requested")
- moment_client (text, client initials for Moja Moment)
- moment_staff (text, staff involved in Moja Moment)
- moment_text (text, description for Moja Moment)
- photo_name (text, filename of attached photo)
- status (text, one of: New, Acknowledged, In Progress, Awaiting Response, Completed)
- status_updated_at (timestamptz, when status last changed)

### report_responses
Stores admin response notes attached to each report.
- id (uuid, primary key)
- report_id (uuid, foreign key to reports.id ON DELETE CASCADE)
- created_at (timestamptz, when the response was written)
- author_name (text, name of the admin who responded)
- response_text (text, the response message)
- status_change (text, nullable, the new status if the response included a status change)

## Security (RLS)
This is a single-tenant app with no sign-in screen. The frontend uses the anon
key, so all policies are scoped to TO anon, authenticated to allow the anon-key
client to read and write. The data is intentionally shared across all staff
and admin users.

## Indexes
- report_responses_report_id_idx: index on report_id for fast join lookups
- reports_created_at_idx: index on created_at for chronological ordering
- reports_status_idx: index on status for dashboard filtering
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  submission_type text NOT NULL DEFAULT '',
  staff_name text NOT NULL DEFAULT '',
  staff_email text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  impact text NOT NULL DEFAULT '',
  involved_staff text NOT NULL DEFAULT '',
  involved_client text NOT NULL DEFAULT '',
  headsup_text text NOT NULL DEFAULT '',
  improvement text NOT NULL DEFAULT '',
  urgency text NOT NULL DEFAULT '',
  followup text NOT NULL DEFAULT '',
  moment_client text NOT NULL DEFAULT '',
  moment_staff text NOT NULL DEFAULT '',
  moment_text text NOT NULL DEFAULT '',
  photo_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'New',
  status_updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON reports;
CREATE POLICY "anon_select_reports" ON reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON reports;
CREATE POLICY "anon_insert_reports" ON reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON reports;
CREATE POLICY "anon_update_reports" ON reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON reports;
CREATE POLICY "anon_delete_reports" ON reports FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS report_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  author_name text NOT NULL DEFAULT 'Admin',
  response_text text NOT NULL DEFAULT '',
  status_change text
);

ALTER TABLE report_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_responses" ON report_responses;
CREATE POLICY "anon_select_responses" ON report_responses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_responses" ON report_responses;
CREATE POLICY "anon_insert_responses" ON report_responses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_responses" ON report_responses;
CREATE POLICY "anon_update_responses" ON report_responses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_responses" ON report_responses;
CREATE POLICY "anon_delete_responses" ON report_responses FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS report_responses_report_id_idx ON report_responses(report_id);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
