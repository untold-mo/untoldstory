-- حقول إضافية على الشغلانات (المشاريع) — تاريخ الشغلانة، الانتهاء المتوقع، المسؤولون.
-- آمن لإعادة التشغيل.
-- التواريخ تُخزَّن كنصوص (YYYY-MM-DD) مثل start_date الموجود.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_date TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_end_date TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS production_manager_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sales_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS accountant_name TEXT;

-- تعبئة تاريخ الشغلانة من تاريخ البداية للصفوف القديمة
UPDATE public.projects SET project_date = start_date WHERE project_date IS NULL AND start_date IS NOT NULL;
