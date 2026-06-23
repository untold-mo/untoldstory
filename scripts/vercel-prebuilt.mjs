/**
 * Package dist/ for `vercel deploy --prebuilt` (build on GitHub, skip Vercel npm build).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.join(root, '.vercel', 'output');
const staticDir = path.join(out, 'static');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('[vercel-prebuilt] dist/index.html missing — run npm run build first');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });

for (const name of fs.readdirSync(dist)) {
  const from = path.join(dist, name);
  const to = path.join(staticDir, name);
  fs.cpSync(from, to, { recursive: true });
}

fs.writeFileSync(
  path.join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
);

console.log('[vercel-prebuilt] Ready:', out);
