/*
# Harden RLS policies for production

## Purpose
Tighten the wide-open RLS policies on the reports and report_responses tables.
The app has no sign-in (single-tenant, anon key), so data is intentionally shared,
but we remove the ability for anonymous users to DELETE reports or report_responses,
and restrict UPDATE on reports to only the status and status_updated_at columns
(admin workflow fields). This prevents anyone with the anon key from bulk-deleting
data or tampering with original submission content.

## Security Changes

### reports table
- DELETE policy: removed for anon/authenticated. Only service_role can delete.
- UPDATE policy: replaced with a restrictive policy that only allows changing
  the status and status_updated_at columns (the admin workflow columns).
  All original submission fields remain immutable through the API.
- SELECT and INSERT policies: unchanged (intentionally public for staff submissions).

### report_responses table
- DELETE policy: removed for anon/authenticated. Only service_role can delete.
- SELECT and INSERT policies: unchanged.
- UPDATE policy: removed (responses are append-only, never edited).

## Important Notes
1. The clearReports() function in the app will no longer work through the anon key.
   That admin function should be removed or moved to a service-role edge function.
2. Original report content (staff_name, headsup_text, etc.) can no longer be
   modified through the API, protecting submission integrity.
*/

-- reports: remove DELETE for anon
DROP POLICY IF EXISTS "anon_delete_reports" ON reports;

-- reports: replace UPDATE with column-restricted version
DROP POLICY IF EXISTS "anon_update_reports" ON reports;
CREATE POLICY "anon_update_status_only" ON reports FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Revoke UPDATE on submission content columns from anon and authenticated
-- They can only update status and status_updated_at
REVOKE UPDATE ON reports FROM anon, authenticated;
GRANT UPDATE (status, status_updated_at) ON reports TO anon, authenticated;

-- report_responses: remove DELETE and UPDATE (append-only)
DROP POLICY IF EXISTS "anon_delete_responses" ON report_responses;
DROP POLICY IF EXISTS "anon_update_responses" ON report_responses;
