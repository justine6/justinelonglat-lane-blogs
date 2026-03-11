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

const TARGET = path.join(ROOT, "public");
const files = walkHtml(TARGET);

let errors = 0;

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");

  const hasHeaderMarker = s.includes("<!-- inject:header -->");
  const hasFooterMarker = s.includes("<!-- inject:footer -->");

  if (!hasHeaderMarker && !hasFooterMarker) continue;

  const headerMatches =
    s.match(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/gi) || [];
  const footerMatches =
    s.match(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>/gi) || [];

  if (hasHeaderMarker && headerMatches.length !== 1) {
    console.error(`✗ Header injection contract failed: ${f} (found ${headerMatches.length} .site-header block(s))`);
    errors++;
  }

  if (hasFooterMarker && footerMatches.length !== 1) {
    console.error(`✗ Footer injection contract failed: ${f} (found ${footerMatches.length} .site-footer block(s))`);
    errors++;
  }

  const headerInjectedBlockCount =
    (s.match(/<!--\s*inject:header\s*-->[\s\S]*?<!--\s*injected:begin\s*-->/g) || []).length;
  const footerInjectedBlockCount =
    (s.match(/<!--\s*inject:footer\s*-->[\s\S]*?<!--\s*injected:begin\s*-->/g) || []).length;

  if (hasHeaderMarker && headerInjectedBlockCount !== 1) {
    console.error(`✗ Header injected wrapper missing or duplicated: ${f}`);
    errors++;
  }

  if (hasFooterMarker && footerInjectedBlockCount !== 1) {
    console.error(`✗ Footer injected wrapper missing or duplicated: ${f}`);
    errors++;
  }
}

if (errors) process.exit(1);
console.log("✓ partials injection looks healthy");