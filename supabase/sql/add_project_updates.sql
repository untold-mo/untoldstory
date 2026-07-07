-- ربط الشغلانة بالسيلز + جدول تحديثات الشغلانة (يكتبه السيلز/التيم ليدر/الإنتاج).
-- آمن لإعادة التشغيل.

-- 1) عمود السيلز المسؤول (معرّف) على الشغلانات
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sales_id TEXT;

-- 2) جدول تحديثات الشغلانة
CREATE TABLE IF NOT EXISTS public.project_updates (
  id TEXT PRIMARY KEY,
  project_code TEXT NOT NULL REFERENCES public.projects(code) ON DELETE CASCADE,
  author_id TEXT,
  author_name TEXT,
  author_role TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_updates_code ON public.project_updates(project_code);

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- أي مستخدم مسجّل يقرأ/يكتب التحديثات (النطاق يُدار في الواجهة حسب الدور).
DROP POLICY IF EXISTS project_updates_all ON public.project_updates;
CREATE POLICY project_updates_all ON public.project_updates
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
