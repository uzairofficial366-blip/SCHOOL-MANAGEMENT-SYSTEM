/**
 * Raw SQL for features not supported by Prisma:
 * - RLS policies
 * - Table partitioning (pg_partman)
 * - Audit triggers
 * - pgcrypto encryption
 */
export const RLS_SETUP_SQL = `
-- Enable pgcrypto for PII encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Apply to every tenant-scoped table
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','staff','students','guardians','enrollments',
    'academic_years','terms','grades','sections','subjects',
    'timetable_slots','attendance_records','exam_schedules',
    'exams','grade_records','lms_content','assignments',
    'submissions','fee_structures','fee_payments','messages',
    'notifications','announcements','gamification',
    'books','library_cards','book_issues','rooms',
    'hostel_allocations','vehicles','transport_assignments',
    'inventory_items','audit_logs','ai_predictions','visitors'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
    EXECUTE format($$
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
    $$, tbl);
  END LOOP;
END $$;

-- ── AUDIT TRIGGER ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  audit_row audit_logs%ROWTYPE;
BEGIN
  audit_row.id          := gen_random_uuid()::text;
  audit_row.tenant_id   := COALESCE(NEW.tenant_id, OLD.tenant_id);
  audit_row.user_id     := current_setting('app.current_user_id', TRUE);
  audit_row.action      := TG_OP;
  audit_row.table_name  := TG_TABLE_NAME;
  audit_row.record_id   := COALESCE(NEW.id, OLD.id);
  audit_row.old_values  := CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END;
  audit_row.new_values  := CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END;
  audit_row.ip_address  := current_setting('app.current_ip', TRUE);
  audit_row.created_at  := now();
  INSERT INTO audit_logs VALUES (audit_row.*);
  RETURN NEW;
END;
$$;

-- Apply audit trigger to core tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','students','staff','enrollments','fee_payments',
    'grade_records','attendance_records','submissions'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', tbl, tbl);
    EXECUTE format($$
      CREATE TRIGGER audit_%I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()
    $$, tbl, tbl);
  END LOOP;
END $$;

-- ── ATTENDANCE PARTITIONING (monthly) ───────────────────────────────────────
-- Recreate attendance_records as partitioned table
-- Note: Run this BEFORE prisma migrate (or in a separate migration)
/*
CREATE TABLE attendance_records_partitioned (
  LIKE attendance_records INCLUDING ALL
) PARTITION BY RANGE (date);

SELECT partman.create_parent(
  p_parent_table := 'public.attendance_records_partitioned',
  p_control      := 'date',
  p_interval     := 'monthly'
);
*/

-- ── AUDIT LOG PARTITIONING ──────────────────────────────────────────────────
/*
SELECT partman.create_parent(
  p_parent_table := 'public.audit_logs',
  p_control      := 'created_at',
  p_interval     := 'monthly'
);
*/

-- ── COLD DATA ARCHIVAL via pg_cron ──────────────────────────────────────────
/*
SELECT cron.schedule(
  'archive-old-audit-logs',
  '0 2 1 * *',
  $$DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years'$$
);
*/
`;

export const MATERIALIZED_VIEWS_SQL = `
-- Dashboard stats materialized view (refreshed every 15 min)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT
  s.tenant_id,
  COUNT(DISTINCT s.id)                                              AS total_students,
  COUNT(DISTINCT st.id)                                             AS total_staff,
  ROUND(
    100.0 * COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)
    / NULLIF(COUNT(ar.id), 0), 2
  )                                                                 AS attendance_rate,
  COUNT(CASE WHEN fp.status = 'OVERDUE' THEN 1 END)                AS overdue_fees
FROM tenants t
LEFT JOIN students s    ON s.tenant_id = t.id AND s.deleted_at IS NULL
LEFT JOIN staff st      ON st.tenant_id = t.id AND st.deleted_at IS NULL
LEFT JOIN attendance_records ar ON ar.tenant_id = t.id
  AND ar.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN fee_payments fp ON fp.tenant_id = t.id
GROUP BY s.tenant_id;

CREATE UNIQUE INDEX IF NOT EXISTS mv_dashboard_stats_tenant
  ON mv_dashboard_stats(tenant_id);

-- Refresh every 15 minutes via pg_cron
-- SELECT cron.schedule('refresh-mv-dashboard', '*/15 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats');
`;
