-- إصلاح: shoot/equipment/meeting bookings تتطلب updated_at بدون DEFAULT على Supabase
ALTER TABLE IF EXISTS public.shoot_bookings
  ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE IF EXISTS public.equipment_bookings
  ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE IF EXISTS public.meeting_bookings
  ALTER COLUMN updated_at SET DEFAULT now();
