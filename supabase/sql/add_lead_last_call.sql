-- عمود «آخر مكالمة» على الليدز — لعرض توقيت آخر مكالمة في القائمة بدون تحميل الـ timeline.
-- آمن لإعادة التشغيل.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ;

-- تعبئة أولية من الـ timeline الحالي (أحدث نشاط مكالمة لكل ليد) — يُنفَّذ مرة واحدة.
UPDATE public.leads l
SET last_call_at = sub.max_call
FROM (
  SELECT
    x.id,
    MAX((act->>'createdAt')::timestamptz) AS max_call
  FROM public.leads x
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(x.timeline_json) = 'array' THEN x.timeline_json ELSE '[]'::jsonb END
  ) AS act
  WHERE (act->>'channelType') = 'call'
     OR (act->>'action') ~ '(مكالمة|اتصال)'
  GROUP BY x.id
) AS sub
WHERE l.id = sub.id
  AND l.last_call_at IS NULL;
