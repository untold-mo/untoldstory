-- عمود line_items_json كان مفقوداً في price_quotes (الواجهة تتوقعه دائماً)
ALTER TABLE public.price_quotes ADD COLUMN IF NOT EXISTS line_items_json JSONB;
