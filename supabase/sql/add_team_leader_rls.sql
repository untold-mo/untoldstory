-- توسيع RLS لدعم "تيم ليدر" (مندوب له صلاحيات على فريقه فقط)
-- شغّل بعد add_team_leader.sql و role_based_rls_policies.sql

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

-- ---------- users: تيم ليدر يشوف أعضاء فريقه ----------
DROP POLICY IF EXISTS users_select_role ON public.users;
CREATE POLICY users_select_role ON public.users
  FOR SELECT TO authenticated
  USING (
    public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج'])
    OR id = public.app_user_id()
    OR (public.app_is_team_leader() AND id IN (SELECT id FROM public.app_team_member_ids()))
  );

-- ---------- leads: تيم ليدر يشوف ويوزع ليدز فريقه ----------
DROP POLICY IF EXISTS leads_select_role ON public.leads;
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

DROP POLICY IF EXISTS leads_update_role ON public.leads;
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
