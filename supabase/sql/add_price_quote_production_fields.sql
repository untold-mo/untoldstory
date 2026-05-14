-- =============================================================================
-- ترقية جدول price_quotes لدعم مسار التسعير من الإنتاج وجداول الدفع
-- انسخ هذا السكريبت والصقه في: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

ALTER TABLE public.price_quotes
  ADD COLUMN IF NOT EXISTS production_assigned_id   TEXT,
  ADD COLUMN IF NOT EXISTS production_assigned_name TEXT,
  ADD COLUMN IF NOT EXISTS priced_by_id             TEXT,
  ADD COLUMN IF NOT EXISTS priced_by_name           TEXT,
  ADD COLUMN IF NOT EXISTS priced_at                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_note             TEXT,
  ADD COLUMN IF NOT EXISTS payment_schedule_json    JSONB,
  ADD COLUMN IF NOT EXISTS initial_payment          INTEGER DEFAULT 0,
  -- حقول موافقة / رفض العميل
  ADD COLUMN IF NOT EXISTS client_payments_json     JSONB,
  ADD COLUMN IF NOT EXISTS client_accepted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_rejected_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_rejection_note    TEXT;
