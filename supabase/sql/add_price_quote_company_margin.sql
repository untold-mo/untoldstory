-- نسبة هامش الشركة + مجموع بنود التكلفة (مدير الإنتاج عند التسعير)
-- Supabase Dashboard → SQL Editor → Run (مرة واحدة)

ALTER TABLE public.price_quotes
  ADD COLUMN IF NOT EXISTS company_margin_percent DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS production_cost_amount INTEGER;
