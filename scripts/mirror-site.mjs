import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://globaluntoldstory.com";
const TARGET_DIR = path.resolve("public", "globaluntoldstory");

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function toAbsolute(url) {
  if (!url) return null;
  if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("javascript:") || url.startsWith("data:")) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}/${url.replace(/^\.?\//, "")}`;
}

function mapUrlToLocalFile(url) {
  const u = new URL(url);
  const pathname = u.pathname === "/" ? "/index.html" : u.pathname;
  return path.join(TARGET_DIR, pathname);
}

async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url} (${res.status})`);
  const filePath = mapUrlToLocalFile(url);
  await ensureDir(filePath);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(filePath, buffer);
}

function extractAssetUrls(html) {
  const regex = /(?:src|href)=["']([^"'#]+)["']/gi;
  const urls = new Set();
  let match;
  while ((match = regex.exec(html))) {
    const raw = match[1];
    const absolute = toAbsolute(raw);
    if (!absolute) continue;
    if (absolute.startsWith(BASE_URL)) {
      urls.add(absolute.split("?")[0]);
    }
  }
  return [...urls];
}

function rewriteIndexHtml(html) {
  let out = html;
  out = out.replaceAll("https://globaluntoldstory.com/", "/globaluntoldstory/");
  out = out.replaceAll("http://globaluntoldstory.com/", "/globaluntoldstory/");
  // Prefix root-relative urls once only.
  out = out.replace(/(src|href)=["']\/(?!\/|globaluntoldstory\/)/g, '$1="/globaluntoldstory/');
  // Also cover srcset lists.
  out = out.replace(/,\s*\/(?!\/|globaluntoldstory\/)/g, ", /globaluntoldstory/");
  // Cleanup accidental double prefixes from previous runs.
  out = out.replaceAll("/globaluntoldstory/globaluntoldstory/", "/globaluntoldstory/");
  return out;
}

async function main() {
  await fs.mkdir(TARGET_DIR, { recursive: true });
  const homepage = await fetch(BASE_URL);
  if (!homepage.ok) throw new Error(`Failed homepage (${homepage.status})`);
  const homepageHtml = await homepage.text();

  const urls = extractAssetUrls(homepageHtml);
  for (const url of urls) {
    try {
      await downloadFile(url);
    } catch {
      // Ignore individual asset failures; keep mirror usable.
    }
  }

  const localIndex = rewriteIndexHtml(homepageHtml);
  const indexPath = path.join(TARGET_DIR, "index.html");
  await ensureDir(indexPath);
  await fs.writeFile(indexPath, localIndex, "utf8");

  console.log(`Mirrored homepage with ${urls.length} same-domain assets.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
