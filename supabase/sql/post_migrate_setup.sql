-- بعد نقل الداتا لمشروع Supabase جديد — شغّل بالترتيب (SQL Editor)
-- 1) هذا الملف ليس نسخاً كاملاً — كل قسم في ملفه الأصلي

-- أ) سياسات RLS حسب الدور (مهم جداً)
--    انسخ والصق محتوى: supabase/sql/role_based_rls_policies.sql

-- ب) إصلاح صلاحيات workspace_state للمحاسب
--    انسخ والصق: supabase/sql/fix_workspace_state_rls_accountant.sql

-- ج) جداول المشاريع/الشغلانات (إن لم تكن منقولة)
--    انسخ والصق: supabase/sql/add_projects_system.sql

-- د) Realtime (اختياري للتحديث الفوري)
--    enable_leads_realtime.sql
--    enable_workspace_realtime.sql

-- هـ) Storage للشعارات (إن وُجد)
--    workspace_assets_storage.sql
