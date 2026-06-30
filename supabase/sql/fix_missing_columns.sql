-- إضافة الأعمدة الناقصة بعد الترحيل — آمن لإعادة التشغيل (IF NOT EXISTS)

-- leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_label TEXT;

-- invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS lines_json JSONB;

-- expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS description TEXT;

-- monthly_targets
ALTER TABLE public.monthly_targets ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.monthly_targets ADD COLUMN IF NOT EXISTS month_key TEXT;
ALTER TABLE public.monthly_targets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.monthly_targets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- manual_customers
ALTER TABLE public.manual_customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- manual_journal_entries
ALTER TABLE public.manual_journal_entries ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.manual_journal_entries ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.manual_journal_entries ADD COLUMN IF NOT EXISTS cost_center TEXT;

-- projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
