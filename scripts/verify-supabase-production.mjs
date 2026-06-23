#!/usr/bin/env node
/**
 * يتحقق أن إعداد Supabase للإنتاج يشير للمشروع الجديد وليس الموقوف.
 * الاستخدام: VITE_SUPABASE_URL=... node scripts/verify-supabase-production.mjs
 */
const BLOCKED_REFS = new Set(['hfbnysvmrqglccxswqfm']);

const url = String(process.env.VITE_SUPABASE_URL || '').trim();
const useSb = String(process.env.VITE_USE_SUPABASE || '1').trim();

if (useSb !== '1') {
  console.warn('[verify-supabase] VITE_USE_SUPABASE ليس 1 — تخطي.');
  process.exit(0);
}

if (!url) {
  console.error('❌ VITE_SUPABASE_URL غير معيّن');
  process.exit(1);
}

let ref = '';
try {
  const host = new URL(url).hostname.toLowerCase();
  const m = host.match(/^([a-z0-9]+)\.supabase\.co$/);
  ref = m?.[1] || '';
} catch {
  console.error('❌ VITE_SUPABASE_URL غير صالح:', url);
  process.exit(1);
}

if (!ref) {
  console.error('❌ لم يُستخرج project ref من:', url);
  process.exit(1);
}

if (BLOCKED_REFS.has(ref)) {
  console.error(`❌ مشروع Supabase القديم (${ref}) موقوف — لا تستخدمه في الإنتاج.`);
  console.error('   استخدم المشروع الجديد axkoidcmiqutdtcadfca في Vercel/GitHub secrets.');
  process.exit(1);
}

if (!process.env.VITE_SUPABASE_ANON_KEY?.trim()) {
  console.error('❌ VITE_SUPABASE_ANON_KEY غير معيّن');
  process.exit(1);
}

console.log(`✓ Supabase production OK (project: ${ref})`);
