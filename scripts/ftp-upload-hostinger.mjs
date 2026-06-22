/**
 * Upload hostinger-dist/ to Hostinger via FTP/FTPS (Node.js — no Python required).
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'basic-ftp';

function normalizeServer(raw) {
  let server = raw.trim();
  for (const prefix of ['ftps://', 'ftp://']) {
    if (server.toLowerCase().startsWith(prefix)) server = server.slice(prefix.length);
  }
  return server.split('/')[0].trim();
}

function usernameVariants(username) {
  const user = username.trim();
  const variants = [user];
  if (!user.includes('@')) {
    const domain = process.env.FTP_DOMAIN?.trim();
    if (domain) variants.push(`${user}@${domain}`);
  }
  return [...new Set(variants.filter(Boolean))];
}

async function connectFtp(server, username, password) {
  const host = normalizeServer(server);
  const users = usernameVariants(username);
  let lastError = null;

  for (const user of users) {
    if (user !== users[0]) console.log(`Retrying login as ${user}...`);

    for (const secure of [true, false]) {
      const label = secure ? 'FTPS' : 'FTP';
      const client = new Client(90_000);
      client.ftp.verbose = false;
      try {
        await client.access({
          host,
          user,
          password,
          secure,
          secureOptions: { rejectUnauthorized: false },
        });
        const pwd = await client.pwd();
        console.log(`${label} login successful as ${user} (pwd=${JSON.stringify(pwd)})`);
        return client;
      } catch (exc) {
        lastError = exc;
        console.log(`${label} as ${user} failed: ${exc.message || exc}`);
        client.close();
      }
    }
  }

  console.error('::error::All FTP connection modes failed');
  console.error(
    '::error::Check Hostinger hPanel → FTP Accounts, then update FTP_SERVER / FTP_USERNAME / FTP_PASSWORD.',
  );
  if (lastError) console.error(lastError);
  process.exit(1);
}

async function resolveRemoteRoot(client) {
  const configured = process.env.FTP_REMOTE_DIR?.trim();
  const candidates = [];
  if (configured) candidates.push(configured);
  candidates.push('/public_html', 'public_html', '.');
  const home = await client.pwd();
  candidates.push(home);

  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      await client.cd(candidate);
      const resolved = await client.pwd();
      console.log(`Using remote root: ${resolved}`);
      return resolved;
    } catch (exc) {
      console.log(`Skip remote root ${JSON.stringify(candidate)}: ${exc.message || exc}`);
    }
  }

  console.error('::error::Could not resolve Hostinger web root (set FTP_REMOTE_DIR)');
  process.exit(1);
}

async function deleteRemoteAssets(client, remoteRoot) {
  const assets = `${remoteRoot.replace(/\/+$/, '')}/assets`;
  try {
    await client.cd(assets);
  } catch (exc) {
    console.log(`Skip asset cleanup (${assets}): ${exc.message || exc}`);
    return;
  }

  for (const name of await client.list()) {
    const base = name.name;
    if (base === '.' || base === '..') continue;
    try {
      if (name.isDirectory) await client.removeDir(base);
      else await client.remove(base);
      console.log(`Deleted stale ${base}`);
    } catch (exc) {
      console.log(`Could not delete ${base}: ${exc.message || exc}`);
    }
  }

  await client.cd(remoteRoot);
}

async function uploadDir(client, localPath, remotePath) {
  await client.ensureDir(remotePath);
  const entries = fs.readdirSync(localPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const localItem = path.join(localPath, entry.name);
    const remoteItem = `${remotePath}/${entry.name}`;
    if (entry.isDirectory()) {
      await uploadDir(client, localItem, remoteItem);
      continue;
    }
    const size = fs.statSync(localItem).size;
    console.log(`Uploading ${remoteItem} (${size} bytes)`);
    await client.uploadFrom(localItem, remoteItem);
  }
}

export async function uploadHostingerBundle(options = {}) {
  const server = options.server || process.env.FTP_SERVER;
  const username = options.username || process.env.FTP_USER || process.env.FTP_USERNAME;
  const password = options.password || process.env.FTP_PASS || process.env.FTP_PASSWORD;
  const localDir = path.resolve(options.localDir || process.env.LOCAL_DIR || 'hostinger-dist');

  if (!server || !username || !password) {
    throw new Error('Missing FTP_SERVER / FTP_USERNAME / FTP_PASSWORD');
  }
  if (!fs.existsSync(path.join(localDir, 'index.html'))) {
    throw new Error(`Missing ${path.join(localDir, 'index.html')} — run pack:hostinger first`);
  }

  const files = walkFiles(localDir);
  const totalBytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);
  console.log(`Local bundle: ${localDir} (${files.length} files, ${totalBytes} bytes)`);

  const client = await connectFtp(server, username, password);
  try {
    const remoteRoot = await resolveRemoteRoot(client);
    await deleteRemoteAssets(client, remoteRoot);
    await uploadDir(client, localDir, remoteRoot);
    client.close();
  } catch (exc) {
    client.close();
    console.error('::error::FTP deploy failed', exc);
    process.exit(1);
  }

  console.log('Done!');
}

function walkFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}
