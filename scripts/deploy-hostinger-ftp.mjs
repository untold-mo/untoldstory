/**
 * رفع يدوي لـ hostinger-dist/ (نفس منطق GitHub Actions).
 * يقرأ من متغيرات البيئة أو من ملف .env.deploy (غير مُتتبّع في git):
 *   FTP_SERVER, FTP_USERNAME, FTP_PASSWORD
 *
 * الاستخدام:
 *   npm run pack:hostinger
 *   node scripts/deploy-hostinger-ftp.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  console.error('  npm run pack:hostinger && node scripts/deploy-hostinger-ftp.mjs');
  process.exit(1);
}

if (!fs.existsSync(path.join(localDir, 'index.html'))) {
  console.error('[deploy-hostinger] Run: npm run pack:hostinger');
  process.exit(1);
}

const py = `
import ftplib, os, pathlib, sys
server   = os.environ["FTP_SERVER"]
username = os.environ["FTP_USER"]
password = os.environ["FTP_PASS"]
local_dir = pathlib.Path(${JSON.stringify(localDir)})
remote_dir = "/public_html"
print(f"Connecting to {server} as {username}...")
try:
    ftp = ftplib.FTP_TLS()
    ftp.connect(server, 21, timeout=60)
    ftp.auth()
    ftp.prot_p()
except Exception:
    print("FTPS failed, trying plain FTP...")
    ftp = ftplib.FTP()
    ftp.connect(server, 21, timeout=60)
ftp.login(username, password)
print("Login successful!")
def delete_remote_assets(ftp, remote_assets_path):
    try:
        names = ftp.nlst(remote_assets_path)
    except Exception as exc:
        print(f"Skip asset cleanup ({remote_assets_path}): {exc}")
        return
    for name in names:
        base = name.rsplit("/", 1)[-1]
        if base in (".", ".."):
            continue
        try:
            ftp.delete(name)
            print(f"Deleted stale {name}")
        except Exception:
            try:
                ftp.rmd(name)
            except Exception as exc:
                print(f"Could not delete {name}: {exc}")
delete_remote_assets(ftp, f"{remote_dir}/assets")
def upload_dir(ftp, local_path, remote_path):
    try:
        ftp.mkd(remote_path)
    except Exception:
        pass
    for item in local_path.iterdir():
        r = f"{remote_path}/{item.name}"
        if item.is_dir():
            upload_dir(ftp, item, r)
        else:
            print(f"Uploading {r}")
            with open(item, "rb") as f:
                ftp.storbinary(f"STOR {r}", f)
upload_dir(ftp, local_dir, remote_dir)
ftp.quit()
print("Done!")
`;

execSync('python -c ' + JSON.stringify(py), {
  stdio: 'inherit',
  env: { ...process.env, FTP_SERVER: server, FTP_USER: user, FTP_PASS: pass },
});

const bundle = fs.readFileSync(path.join(localDir, 'index.html'), 'utf8').match(/assets\/index-[^.]+\.js/)?.[0];
console.log('[deploy-hostinger] Uploaded. Bundle:', bundle || 'unknown');
