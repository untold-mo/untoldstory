-- نفّذ هذا الملف مرة واحدة من Supabase → SQL Editor إذا ظهر خطأ:
-- "Could not find the 'submitted_by_id' column of 'expenses' in the schema cache"
-- بعد التنفيذ انتظر ~١ دقيقة أو أعد تحميل الصفحة ثم جرّب إرسال المصروف مرة أخرى.

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS submitted_by_id text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS submitted_by_name text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text;
