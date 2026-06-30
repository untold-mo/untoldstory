-- =============================================================================
-- سياسات RLS حسب الدور — تشغّل بعد SUPABASE_SETUP_COPYPASTE.sql
-- يربط الجلسة بـ public.users عبر بريد Supabase Auth (auth.jwt()->>'email')
-- =============================================================================

-- دوال مساعدة (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.app_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(coalesce(auth.jwt() ->> 'email', '')));
$$;

CREATE OR REPLACE FUNCTION public.app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE lower(trim(u.email)) = public.app_auth_email()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role::text
  FROM public.users u
  WHERE lower(trim(u.email)) = public.app_auth_email()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_is_role(roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_user_role() = ANY (roles);
$$;

-- تيم ليدر: مندوب له صلاحيات موسّعة على فريقه فقط (يتطلب add_team_leader.sql)
CREATE OR REPLACE FUNCTION public.app_is_team_leader()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(u.is_team_leader, false)
  FROM public.users u
  WHERE lower(trim(u.email)) = public.app_auth_email()
  LIMIT 1;
$$;

-- معرفات فريق التيم ليدر الحالي (نفسه + المندوبين التابعين له)
CREATE OR REPLACE FUNCTION public.app_team_member_ids()
RETURNS TABLE(id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_user_id()
  UNION
  SELECT u.id FROM public.users u WHERE u.team_leader_id = public.app_user_id();
$$;

-- إزالة السياسات المفتوحة
DROP POLICY IF EXISTS app_authenticated_all_users ON public.users;
DROP POLICY IF EXISTS app_authenticated_all_leads ON public.leads;
DROP POLICY IF EXISTS app_authenticated_all_manual_customers ON public.manual_customers;
DROP POLICY IF EXISTS app_authenticated_all_invoices ON public.invoices;
DROP POLICY IF EXISTS app_authenticated_all_expenses ON public.expenses;
DROP POLICY IF EXISTS app_authenticated_all_price_quotes ON public.price_quotes;
DROP POLICY IF EXISTS app_authenticated_all_manual_journal_entries ON public.manual_journal_entries;
DROP POLICY IF EXISTS app_authenticated_all_accounting_policy ON public.accounting_policy;
DROP POLICY IF EXISTS app_authenticated_all_closed_months ON public.closed_months;
DROP POLICY IF EXISTS app_authenticated_all_monthly_targets ON public.monthly_targets;
DROP POLICY IF EXISTS app_authenticated_all_custody_settings ON public.custody_settings;
DROP POLICY IF EXISTS app_authenticated_all_audit_events ON public.audit_events;
DROP POLICY IF EXISTS app_authenticated_all_custody_funds ON public.custody_funds;
DROP POLICY IF EXISTS app_authenticated_all_shoot_bookings ON public.shoot_bookings;
DROP POLICY IF EXISTS app_authenticated_all_equipment_bookings ON public.equipment_bookings;
DROP POLICY IF EXISTS app_authenticated_all_meeting_bookings ON public.meeting_bookings;
DROP POLICY IF EXISTS app_authenticated_all_workspace_state ON public.workspace_state;
DROP POLICY IF EXISTS app_authenticated_all_attendance_records ON public.attendance_records;

-- إعادة تشغيل آمنة — احذف السياسات الجديدة إن وُجدت
DROP POLICY IF EXISTS users_select_role ON public.users;
DROP POLICY IF EXISTS users_write_owner ON public.users;
DROP POLICY IF EXISTS leads_select_role ON public.leads;
DROP POLICY IF EXISTS leads_insert_role ON public.leads;
DROP POLICY IF EXISTS leads_update_role ON public.leads;
DROP POLICY IF EXISTS leads_delete_role ON public.leads;
DROP POLICY IF EXISTS price_quotes_select_role ON public.price_quotes;
DROP POLICY IF EXISTS price_quotes_insert_role ON public.price_quotes;
DROP POLICY IF EXISTS price_quotes_update_role ON public.price_quotes;
DROP POLICY IF EXISTS invoices_accounting ON public.invoices;
DROP POLICY IF EXISTS expenses_role ON public.expenses;
DROP POLICY IF EXISTS accounting_policy_role ON public.accounting_policy;
DROP POLICY IF EXISTS manual_journals_role ON public.manual_journal_entries;
DROP POLICY IF EXISTS closed_months_role ON public.closed_months;
DROP POLICY IF EXISTS monthly_targets_role ON public.monthly_targets;
DROP POLICY IF EXISTS audit_events_read ON public.audit_events;
DROP POLICY IF EXISTS audit_events_insert ON public.audit_events;
DROP POLICY IF EXISTS workspace_state_role ON public.workspace_state;
DROP POLICY IF EXISTS manual_customers_role ON public.manual_customers;
DROP POLICY IF EXISTS custody_settings_role ON public.custody_settings;
DROP POLICY IF EXISTS custody_funds_role ON public.custody_funds;
DROP POLICY IF EXISTS shoot_bookings_role ON public.shoot_bookings;
DROP POLICY IF EXISTS equipment_bookings_role ON public.equipment_bookings;
DROP POLICY IF EXISTS meeting_bookings_role ON public.meeting_bookings;
DROP POLICY IF EXISTS attendance_records_role ON public.attendance_records;

-- ---------- users ----------
CREATE POLICY users_select_role ON public.users
  FOR SELECT TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج'])
    OR id = public.app_user_id()
    OR (public.app_is_team_leader() AND id IN (SELECT id FROM public.app_team_member_ids()))
  );

CREATE POLICY users_write_owner ON public.users
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'محاسب']));

-- ---------- leads ----------
CREATE POLICY leads_select_role ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات'])
    OR (
      public.app_user_role() = 'مندوب'
      AND (
        assigned_to_id = public.app_user_id()
        OR (public.app_is_team_leader() AND assigned_to_id IN (SELECT id FROM public.app_team_member_ids()))
      )
    )
    OR (
      public.app_user_role() = 'مدير إنتاج'
      AND id IN (
        SELECT pq.lead_id
        FROM public.price_quotes pq
        WHERE pq.production_assigned_id = public.app_user_id()
           OR pq.priced_by_id = public.app_user_id()
      )
    )
    OR (
      public.app_user_role() = 'محاسب'
      AND id IN (
        SELECT i.lead_id
        FROM public.invoices i
        WHERE i.record_origin = 'عرض_سعر_معتمد'
          AND i.lead_id IS NOT NULL
          AND i.lead_id <> 'manual'
      )
    )
  );

CREATE POLICY leads_insert_role ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب'])
  );

CREATE POLICY leads_update_role ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات'])
    OR (public.app_user_role() = 'مندوب' AND assigned_to_id = public.app_user_id())
    OR (
      public.app_user_role() = 'مندوب'
      AND public.app_is_team_leader()
      AND (assigned_to_id IS NULL OR assigned_to_id IN (SELECT id FROM public.app_team_member_ids()))
    )
  )
  WITH CHECK (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات'])
    OR (public.app_user_role() = 'مندوب' AND assigned_to_id = public.app_user_id())
    OR (
      public.app_user_role() = 'مندوب'
      AND public.app_is_team_leader()
      AND (assigned_to_id IS NULL OR assigned_to_id IN (SELECT id FROM public.app_team_member_ids()))
    )
  );

CREATE POLICY leads_delete_role ON public.leads
  FOR DELETE TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات']));

-- ---------- price_quotes ----------
CREATE POLICY price_quotes_select_role ON public.price_quotes
  FOR SELECT TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب'])
    OR (public.app_user_role() = 'مندوب' AND created_by_id = public.app_user_id())
    OR (
      public.app_user_role() = 'مدير إنتاج'
      AND (production_assigned_id = public.app_user_id() OR priced_by_id = public.app_user_id())
    )
  );

CREATE POLICY price_quotes_insert_role ON public.price_quotes
  FOR INSERT TO authenticated
  WITH CHECK (public.app_is_role(ARRAY['مندوب', 'مدير مبيعات']));

CREATE POLICY price_quotes_update_role ON public.price_quotes
  FOR UPDATE TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات'])
    OR (public.app_user_role() = 'مندوب' AND created_by_id = public.app_user_id())
    OR (
      public.app_user_role() = 'مدير إنتاج'
      AND production_assigned_id = public.app_user_id()
    )
  )
  WITH CHECK (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات'])
    OR (public.app_user_role() = 'مندوب' AND created_by_id = public.app_user_id())
    OR (
      public.app_user_role() = 'مدير إنتاج'
      AND production_assigned_id = public.app_user_id()
    )
  );

-- ---------- invoices (محاسب + مالك) ----------
CREATE POLICY invoices_accounting ON public.invoices
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'محاسب']));

-- ---------- expenses ----------
CREATE POLICY expenses_role ON public.expenses
  FOR ALL TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج'])
  )
  WITH CHECK (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج'])
  );

-- ---------- accounting (محاسب + مالك) ----------
CREATE POLICY accounting_policy_role ON public.accounting_policy
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'محاسب']));

CREATE POLICY manual_journals_role ON public.manual_journal_entries
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'محاسب']));

CREATE POLICY closed_months_role ON public.closed_months
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'محاسب']));

-- ---------- targets / audit / workspace ----------
CREATE POLICY monthly_targets_role ON public.monthly_targets
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات']));

CREATE POLICY audit_events_read ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب']));

CREATE POLICY audit_events_insert ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY workspace_state_role ON public.workspace_state
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج', 'مندوب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج', 'مندوب']));

-- ---------- manual_customers ----------
CREATE POLICY manual_customers_role ON public.manual_customers
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مندوب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب']));

-- ---------- custody ----------
CREATE POLICY custody_settings_role ON public.custody_settings
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير إنتاج', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك']));

CREATE POLICY custody_funds_role ON public.custody_funds
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير إنتاج', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير إنتاج', 'محاسب']));

-- ---------- bookings (JSON doc — فتح للأدوار التشغيلية؛ التصفية في التطبيق) ----------
CREATE POLICY shoot_bookings_role ON public.shoot_bookings
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب', 'مدير إنتاج', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب', 'مدير إنتاج']));

CREATE POLICY equipment_bookings_role ON public.equipment_bookings
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب', 'مدير إنتاج', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب', 'مدير إنتاج']));

CREATE POLICY meeting_bookings_role ON public.meeting_bookings
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب', 'مدير إنتاج', 'محاسب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'مندوب', 'مدير إنتاج']));

CREATE POLICY attendance_records_role ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'محاسب', 'مدير مبيعات']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'محاسب']));
