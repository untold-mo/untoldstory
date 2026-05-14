import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const sourcePath = path.join(root, "SYSTEM_OPERATIONS_REFERENCE_AR.md");
const htmlPath = path.join(root, "SYSTEM_OPERATIONS_REFERENCE_AR.print.html");
const pdfPath = path.join(root, "SYSTEM_OPERATIONS_REFERENCE_AR.pdf");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Source file not found: ${sourcePath}`);
}
if (!fs.existsSync(edgePath)) {
  throw new Error(`Edge not found: ${edgePath}`);
}

const md = fs.readFileSync(sourcePath, "utf8");
const body = marked.parse(md);

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>الدليل التشغيلي الكامل للنظام</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    :root {
      --bg: #0b1220;
      --panel: #111a2f;
      --text: #f8fafc;
      --muted: #cbd5e1;
      --accent: #ef4444;
      --line: #263246;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      line-height: 1.8;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 12.5pt;
    }
    .cover {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, #111a2f 0%, #0f172a 100%);
      border-radius: 14px;
      padding: 28px 24px;
      margin-bottom: 20px;
    }
    .cover h1 {
      margin: 0 0 8px;
      font-size: 24pt;
      line-height: 1.3;
    }
    .cover p {
      margin: 0;
      color: var(--muted);
      font-size: 11pt;
    }
    .content {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--panel);
      padding: 16px 18px;
    }
    h1, h2, h3 { page-break-after: avoid; }
    h1 { font-size: 20pt; margin: 0 0 14px; }
    h2 {
      font-size: 15pt;
      margin: 22px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--line);
    }
    h3 { font-size: 12.5pt; margin: 14px 0 8px; color: #fde68a; }
    p, li { color: var(--text); }
    ul { padding-right: 18px; margin: 8px 0; }
    li { margin: 3px 0; }
    hr {
      border: 0;
      border-top: 1px dashed var(--line);
      margin: 16px 0;
    }
    code {
      background: #0b1220;
      border: 1px solid #334155;
      padding: 1px 6px;
      border-radius: 6px;
      font-size: 10.5pt;
    }
    strong { color: #ffffff; }
    blockquote {
      margin: 10px 0;
      border-right: 3px solid var(--accent);
      padding: 8px 12px;
      background: rgba(239, 68, 68, 0.08);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <section class="cover">
    <h1>الدليل التشغيلي الكامل للنظام</h1>
  </section>
  <main class="content">${body}</main>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, "utf8");

const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
execFileSync(
  edgePath,
  [
    "--headless=new",
    "--disable-gpu",
    `--print-to-pdf=${pdfPath}`,
    fileUrl,
  ],
  { stdio: "ignore" }
);

console.log(`PDF created: ${pdfPath}`);
