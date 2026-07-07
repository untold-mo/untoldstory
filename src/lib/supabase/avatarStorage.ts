import { getSupabase } from '@/lib/supabase/client';
import { getSupabaseActor } from '@/lib/supabase/getActor';

const BUCKET = 'workspace-assets';
const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * رفع صورة موظف كملف إلى Supabase Storage.
 * مسموح: الموظف نفسه، أو المالك/مدير المبيعات.
 * يُرجع رابطاً عاماً يُحفَظ في users.avatar.
 */
export async function uploadEmployeeAvatarSb(file: File, userId: string): Promise<string> {
  const actor = await getSupabaseActor();
  const isSelf = actor.id === userId;
  const isManager = actor.role === 'مالك' || actor.role === 'مدير مبيعات';
  if (!isSelf && !isManager) throw new Error('غير مصرح بتغيير هذه الصورة');
  if (!file.type.startsWith('image/')) throw new Error('الملف يجب أن يكون صورة');
  if (file.size > MAX_BYTES) throw new Error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');

  const ext = MIME_EXT[file.type] || 'png';
  const path = `avatars/${userId}.${ext}`;
  const sb = getSupabase();
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl?.trim();
  if (!publicUrl) throw new Error('تعذّر الحصول على رابط الصورة');
  return `${publicUrl}?v=${Date.now()}`;
}
