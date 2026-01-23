import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const REQUIRED = [
  path.join(ROOT, "partials", "header.html"),
  path.join(ROOT, "partials", "footer.html"),
];

for (const p of REQUIRED) {
  if (!fs.existsSync(p)) {
    console.error(`✗ Missing required partial: ${p}`);
    process.exit(1);
  }
}

function walkHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(p));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const TARGET = path.join(ROOT, "public", "posts");
const files = walkHtml(TARGET);

let missing = 0;
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (!s.includes("<!-- inject:header -->") || !s.includes("<!-- inject:footer -->")) continue; // only enforce where markers exist
  if (!s.includes("class=\"site-header\"")) {
    console.error(`✗ Header not injected: ${f}`);
    missing++;
  }
  if (!s.includes("class=\"site-footer\"")) {
    console.error(`✗ Footer not injected: ${f}`);
    missing++;
  }
}

if (missing) process.exit(1);
console.log("✓ partials injection looks healthy");
