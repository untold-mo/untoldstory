-- إزالة logoDataUrl (base64 ضخم) من workspace_state.doc_json
-- شغّل مرة واحدة في SQL Editor على الإنتاج بعد رفع الشعار إلى Storage (logoUrl).
-- يقلّل egress عند كل تحميل للـ Workspace.

UPDATE public.workspace_state
SET doc_json = jsonb_set(
  doc_json,
  '{printBranding}',
  (doc_json -> 'printBranding') - 'logoDataUrl',
  true
)
WHERE id = 'default'
  AND doc_json ? 'printBranding'
  AND (doc_json -> 'printBranding') ? 'logoDataUrl';

-- اختياري: تفريغ avatar base64 في users (يُعاد رفعها لاحقاً أو تُخزَّن في Storage)
-- UPDATE public.users SET avatar = NULL WHERE avatar LIKE 'data:%' AND length(avatar) > 500;
