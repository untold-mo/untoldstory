/**
 * رفع يدوي لـ hostinger-dist/ (نفس منطق GitHub Actions).
 * يقرأ من متغيرات البيئة أو من ملف .env.deploy (غير مُتتبّع في git):
 *   FTP_SERVER, FTP_USERNAME, FTP_PASSWORD
 *   FTP_REMOTE_DIR (اختياري)
 *
 * الاستخدام:
 *   npm run pack:hostinger
 *   npm run deploy:hostinger
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadHostingerBundle } from './ftp-upload-hostinger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDir = path.join(root, 'hostinger-dist');

function loadEnvDeploy() {
  const f = path.join(root, '.env.deploy');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvDeploy();

const server = process.env.FTP_SERVER?.trim();
const user = process.env.FTP_USERNAME?.trim() || process.env.FTP_USER?.trim();
const pass = process.env.FTP_PASSWORD?.trim() || process.env.FTP_PASS?.trim();

if (!server || !user || !pass) {
  console.error('[deploy-hostinger] Missing FTP_SERVER / FTP_USERNAME / FTP_PASSWORD');
  console.error('  Create .env.deploy from .env.deploy.example or set env vars, then:');
  console.error('  npm run pack:hostinger && npm run deploy:hostinger');
  process.exit(1);
}

await uploadHostingerBundle({
  server,
  username: user,
  password: pass,
  localDir,
});

const bundle = fs.readFileSync(path.join(localDir, 'index.html'), 'utf8').match(/assets\/index-[^.]+\.js/)?.[0];
console.log('[deploy-hostinger] Uploaded. Bundle:', bundle || 'unknown');
