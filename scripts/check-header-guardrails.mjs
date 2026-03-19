import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const HEADER_PARTIAL = path.join(ROOT, "partials", "header.html");

let ok = true;

function fail(message) {
  console.error(`✗ ${message}`);
  ok = false;
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

if (!fs.existsSync(HEADER_PARTIAL)) {
  fail(`Missing canonical header partial: ${HEADER_PARTIAL}`);
  process.exit(1);
}

const headerHtml = fs.readFileSync(HEADER_PARTIAL, "utf8");

const requiredFragments = [
  'data-header-variant="eco"',
  'href="/"',
  'href="/posts/"',
  'href="https://docs.justinelonglat-lane.com"',
  'href="https://www.justinelonglat-lane.com/engineering-mesh"',
  'Ecosystem'
];

for (const bit of requiredFragments) {
  if (!headerHtml.includes(bit)) {
    fail(`header.html missing required fragment: ${bit}`);
  }
}

for (const file of walkHtml(PUBLIC_DIR)) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file).replaceAll("\\", "/");

  const headerMatches =
    html.match(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/gi) || [];

  if (headerMatches.length > 1) {
    fail(`${rel}: duplicate .site-header blocks detected`);
  }

  const badRelativePatterns = [
    /href="\.\.\/posts\/?"/i,
    /href="\.\.\/docs\/?"/i,
    /href="\.\/posts\/?"/i,
    /href="\.\/docs\/?"/i,
    /href="\.\.\/series\//i,
    /href="\.\/series\//i
  ];

  for (const pattern of badRelativePatterns) {
    if (pattern.test(html)) {
      fail(`${rel}: disallowed relative navigation path found (${pattern})`);
    }
  }

  const externalLinks = html.match(/<a\b[^>]*href="https?:\/\/[^">]+"[^>]*>/gi) || [];
  for (const tag of externalLinks) {
    const hasBlank = /target="_blank"/i.test(tag);
    const hasSafeRel = /rel="noopener noreferrer"/i.test(tag);
    if (hasBlank && !hasSafeRel) {
      fail(`${rel}: external link missing rel="noopener noreferrer"`);
    }
  }
}

if (!ok) {
  console.error("\nHeader guardrail check FAILED.");
  process.exit(1);
}

console.log("✓ header guardrails look healthy");