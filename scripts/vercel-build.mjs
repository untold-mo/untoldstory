/**
 * Vercel Hobby: max 12 Serverless Functions. Root /api is auto-detected.
 * On Vercel CI, remove api/ before build (restored from git each deploy).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'api');

process.chdir(root);

if (process.env.VERCEL === '1' && fs.existsSync(apiDir)) {
  fs.rmSync(apiDir, { recursive: true, force: true });
  console.log('[vercel-build] Removed api/ on Vercel (static SPA only, no Express functions)');
}

execSync('npm run pack:hostinger', { stdio: 'inherit', env: process.env });

if (!fs.existsSync(path.join(root, 'hostinger-dist', 'index.html'))) {
  console.error('[vercel-build] hostinger-dist/index.html missing');
  process.exit(1);
}

console.log('[vercel-build] OK — static bundle in hostinger-dist/');
