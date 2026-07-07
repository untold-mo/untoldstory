-- سياسات رفع صور الموظفين (مجلد avatars/) في bucket workspace-assets.
-- يسمح للموظف برفع صورته، وللمالك/مدير المبيعات برفع صور الموظفين.
-- يعتمد على app_user_role() و app_user_id() من role_based_rls_policies.sql. آمن لإعادة التشغيل.

DROP POLICY IF EXISTS workspace_assets_avatar_insert ON storage.objects;
CREATE POLICY workspace_assets_avatar_insert
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-assets'
  AND starts_with(name, 'avatars/')
  AND (
    public.app_user_role() IN ('مالك', 'مدير مبيعات')
    OR starts_with(name, 'avatars/' || public.app_user_id() || '.')
  )
);

DROP POLICY IF EXISTS workspace_assets_avatar_update ON storage.objects;
CREATE POLICY workspace_assets_avatar_update
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspace-assets'
  AND starts_with(name, 'avatars/')
  AND (
    public.app_user_role() IN ('مالك', 'مدير مبيعات')
    OR starts_with(name, 'avatars/' || public.app_user_id() || '.')
  )
);
