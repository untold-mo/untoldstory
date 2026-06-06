-- إصلاح: المحاسب (وباقي الأدوار) كانوا يقرأون workspace_state لكن RLS يمنع الكتابة إلا للمالك.
-- النتيجة: أكواد دليل الأكواد (journalCodebook) تختفي فور الإضافة لأن الحفظ يفشل بصمت.
-- التطبيق يتحقق من المفاتيح المسموحة لكل دور في workspaceStateSb / API.

DROP POLICY IF EXISTS workspace_state_role ON public.workspace_state;

CREATE POLICY workspace_state_role ON public.workspace_state
  FOR ALL TO authenticated
  USING (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج', 'مندوب']))
  WITH CHECK (public.app_is_role(ARRAY['مالك', 'مدير مبيعات', 'محاسب', 'مدير إنتاج', 'مندوب']));

-- تصحيح journalCodebook إن كان مخزناً كـ {} بدلاً من []
UPDATE public.workspace_state
SET doc_json = jsonb_set(
  doc_json,
  '{journalCodebook}',
  '[]'::jsonb,
  true
)
WHERE id = 'default'
  AND jsonb_typeof(doc_json->'journalCodebook') = 'object'
  AND (doc_json->'journalCodebook') = '{}'::jsonb;

UPDATE public.workspace_state
SET doc_json = jsonb_set(
  doc_json,
  '{chartOfAccounts}',
  '[]'::jsonb,
  true
)
WHERE id = 'default'
  AND jsonb_typeof(doc_json->'chartOfAccounts') = 'object'
  AND (doc_json->'chartOfAccounts') = '{}'::jsonb;
