-- إضافة مفهوم "تيم ليدر": مندوب له صلاحيات موسّعة على فريقه فقط
-- شغّل مرة واحدة على المشروع — آمن لإعادة التشغيل (IF NOT EXISTS)

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_team_leader_id ON public.users(team_leader_id);
