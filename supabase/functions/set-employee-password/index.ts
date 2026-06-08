/**
 * المالك يعيّن كلمة مرور دخول Supabase Auth لموظف (بريد حقيقي في public.users).
 * يتطلّب نشر الدالة: supabase functions deploy set-employee-password
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: 'إعدادات الدالة ناقصة على الخادم' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'غير مصرح — سجّل الدخول كمالك' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authErr } = await userClient.auth.getUser();
    const actorEmail = authData.user?.email?.trim().toLowerCase();
    if (authErr || !actorEmail) {
      return json({ error: 'غير مصرح — جلسة غير صالحة' }, 401);
    }

    const { data: actorRow, error: actorErr } = await userClient
      .from('users')
      .select('id,role')
      .eq('email', actorEmail)
      .maybeSingle();
    if (actorErr || !actorRow || actorRow.role !== 'مالك') {
      return json({ error: 'تعيين كلمة مرور الموظف متاح للمالك فقط' }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const targetUserId = String(body.targetUserId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    if (!targetUserId || !email) {
      return json({ error: 'معرّف الموظف والبريد مطلوبان' }, 400);
    }
    if (password.length < 8) {
      return json({ error: 'كلمة المرور ٨ أحرف أو أكثر' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith('@staff.internal')) {
      return json({ error: 'يجب أن يكون للموظف بريد حقيقي (ليس @staff.internal)' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: targetRow, error: targetErr } = await admin
      .from('users')
      .select('id,email,role')
      .eq('id', targetUserId)
      .maybeSingle();
    if (targetErr || !targetRow) {
      return json({ error: 'الموظف غير موجود' }, 404);
    }
    if (String(targetRow.role) === 'مالك') {
      return json({ error: 'لا يمكن تغيير كلمة مرور حساب مالك آخر من هنا' }, 400);
    }
    if (String(targetRow.email || '').trim().toLowerCase() !== email) {
      return json({ error: 'البريد لا يطابق سجل الموظف' }, 400);
    }

    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) {
      return json({ error: listErr.message || 'تعذر البحث في حسابات الدخول' }, 500);
    }
    const users = listData?.users ?? [];
    let authUser = users.find((u) => String(u.email || '').toLowerCase() === email);

    if (!authUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) {
        return json({ error: createErr.message || 'تعذر إنشاء حساب الدخول' }, 400);
      }
      authUser = created.user;
    } else {
      const { error: updateErr } = await admin.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
      });
      if (updateErr) {
        return json({ error: updateErr.message || 'تعذر تحديث كلمة المرور' }, 400);
      }
    }

    return json({ ok: true, authUserId: authUser?.id ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    return json({ error: msg }, 500);
  }
});
