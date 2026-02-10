// scripts/validate-head-body.js
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

// ✅ set your canonical global CSS href here
const GLOBAL_CSS_HREF = "/assets/css/main.css";

// ✅ which folders to validate
const TARGET_DIRS = [
  PUBLIC_DIR,
  // add others if you mirror pages elsewhere
];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

function listHtmlFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && p.toLowerCase().endsWith(".html")) out.push(p);
    }
  }
  return out;
}

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function validateFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  html = stripBom(html);

  // 1) Global CSS must be linked
  // Allow attributes in any order and optional quotes style variance.
  const cssRe = new RegExp(
    String.raw`<link\b[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*href\s*=\s*["']${GLOBAL_CSS_HREF.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}["'][^>]*>`,
    "i"
  );

  if (!cssRe.test(html)) {
    fail(`${filePath}: missing global CSS link: <link rel="stylesheet" href="${GLOBAL_CSS_HREF}">`);
  }

  // 2) Nothing except comments/whitespace between </head> and <body>
  const headCloseIdx = html.search(/<\/head\s*>/i);
  const bodyOpenIdx = html.search(/<body\b/i);

  // Only enforce if both exist (some partials/fragments might not)
  if (headCloseIdx !== -1 && bodyOpenIdx !== -1 && bodyOpenIdx > headCloseIdx) {
    const between = html.slice(headCloseIdx + html.match(/<\/head\s*>/i)[0].length, bodyOpenIdx);

    // remove whitespace + HTML comments; anything left is a violation
    const cleaned = between
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/[\t\r\n ]+/g, "");

    if (cleaned.length > 0) {
      fail(`${filePath}: illegal content between </head> and <body>: "${cleaned.slice(0, 80)}"`);
    }
  }
}

let htmlFiles = [];
for (const d of TARGET_DIRS) htmlFiles.push(...listHtmlFiles(d));

if (htmlFiles.length === 0) {
  console.log("No HTML files found to validate.");
  process.exit(0);
}

for (const f of htmlFiles) validateFile(f);

if (!process.exitCode) {
  console.log(`✓ validate-head-body: OK (${htmlFiles.length} files)`);
}
