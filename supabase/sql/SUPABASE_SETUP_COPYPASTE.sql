-- =============================================================================
-- انسخ الملف كاملًا والصقه في: Supabase Dashboard → SQL Editor → Run
-- يفترض أن الجداول موجودة أصلاً (من Prisma migrate أو استيراد نفس سكيمة المشروع).
-- ترتيب التنفيذ: 1) تجهيز الأعمدة والصفوف الافتراضية  2) تفعيل RLS والسياسات
-- =============================================================================
--
-- ⚠️ مهم — ليه Authentication → Users فاضية؟
--   • شاشة "Authentication → Users" تعرض فقط حسابات **Supabase Auth** (تسجيل الدخول بالبريد/كلمة المرور).
--   • صفوف **public.users** (جدول الموظفين في المشروع) شيء **منفصل** — السكربت SQL لا ينشئ مستخدمين في Auth.
--   • الواجهة عندك تعمل: signInWithPassword (Auth) ثم تبحث في **public.users** بنفس البريد.
--   ⇒ لازم تعمل الاتنين: (1) مستخدم في Auth  (2) صف في public.users بنفس البريد.
--
-- إضافة مستخدم للدخول (من لوحة Supabase — بدون SQL):
--   Dashboard → Authentication → Users → زر "Add user" أو "Invite"
--   أدخل Email + Password (فعّل "Auto Confirm User" في التطوير إن وُجد).
--   تأكد أن جدول public.users فيه صف بنفس الـ email (حروف صغيرة مثل ما هتدخل من الواجهة).
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) عمود password_hash في users
-- التطبيق مع Supabase Auth لا يعتمد على bcrypt في هذا العمود.
-- إن كان العمود NOT NULL، نجعله يقبل NULL أو قيمة فارغة لصفوف تُدار من Auth فقط.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN password_hash DROP NOT NULL;
    COMMENT ON COLUMN public.users.password_hash IS
      'اختياري مع Supabase Auth — يمكن تركه فارغاً أو NULL إذا كان الدخول عبر auth.users فقط.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) صفوف افتراضية (مرة واحدة — لا تُكرّر إن وُجدت)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspace_state') THEN
    INSERT INTO public.workspace_state (id, doc_json, updated_at)
    VALUES ('default', '{}'::jsonb, now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounting_policy') THEN
    INSERT INTO public.accounting_policy (id, policy_notes, allowed_cost_centers_json, min_amount_highlight, updated_at)
    VALUES ('default', '', '[]'::jsonb, 0, now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custody_settings') THEN
    INSERT INTO public.custody_settings (id, custody_account_map_json, updated_at)
    VALUES ('default', '{}'::jsonb, now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Row Level Security — سياسات مؤقتة مفتوحة (للتطوير السريع)
-- ⚠️ للإنتاج: شغّل بعد هذا الملف → supabase/sql/role_based_rls_policies.sql
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manual_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manual_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounting_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.closed_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custody_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custody_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shoot_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_records ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY app_authenticated_all_users ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_leads ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_manual_customers ON public.manual_customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_invoices ON public.invoices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_expenses ON public.expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_price_quotes ON public.price_quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_manual_journal_entries ON public.manual_journal_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_accounting_policy ON public.accounting_policy
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_closed_months ON public.closed_months
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_monthly_targets ON public.monthly_targets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_custody_settings ON public.custody_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_audit_events ON public.audit_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_custody_funds ON public.custody_funds
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_shoot_bookings ON public.shoot_bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_equipment_bookings ON public.equipment_bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_meeting_bookings ON public.meeting_bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_workspace_state ON public.workspace_state
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY app_authenticated_all_attendance_records ON public.attendance_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- بعد التشغيل — خطوات يدوية في لوحة Supabase (لا يمكن أتمتتها من هنا بالكامل):
--
-- أ) Authentication → Users → **Add user** (أو Invite): هذا هو المكان الوحيد اللي هيظهر فيه المستخدم
--     لو الصفحة فاضية = مفيش حد اتسجل في Auth بعد؛ إنشاء صفوف في public.users لوحدها لا يملأ هذه القائمة.
--
-- ب) Table Editor → public.users: أضف صفًا لنفس البريد (حقل email مطابق تمامًا لبريد Auth)،
--    مع id فريد (مثل cuid)، name، role (مثلاً: مالك / محاسب / مندوب …)، skills_json = []، stats_json = {}.
--    مثال (عدّل القيم ثم نفّذ من SQL Editor إن رغبت):
--
--    INSERT INTO public.users (id, email, password_hash, name, role, avatar, base_salary, skills_json, stats_json, created_at, updated_at)
--    VALUES (
--      'clxxxxxxxxxxxxxxxx',           -- استبدل بـ id فريد
--      'owner@company.com',            -- نفس بريد المستخدم في Auth
--      '',                             -- فارغ مع Supabase Auth
--      'المالك',
--      'مالك',
--      NULL,
--      NULL,
--      '[]'::jsonb,
--      '{}'::jsonb,
--      now(),
--      now()
--    )
--    ON CONFLICT (email) DO NOTHING;
--
-- ج) في الواجهة (.env.local): VITE_USE_SUPABASE=1 و VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY و VITE_DATA_SOURCE=server
--
-- -----------------------------------------------------------------------------
-- 4) أعمدة مقدّم طلب المصروف على public.expenses (بدونها يظهر خطأ schema cache عند إدراج مصروف)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS submitted_by_id text;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS submitted_by_name text;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text;
  END IF;
END $$;
-- =============================================================================
