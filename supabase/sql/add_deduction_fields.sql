-- حقول إضافية على خصومات الموظفين — لدعم الخصم لكل الأدوار بالتوثيق الكامل.
-- آمن لإعادة التشغيل.
ALTER TABLE public.employee_deductions ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.employee_deductions ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.employee_deductions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.employee_deductions ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true;
