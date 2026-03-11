import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const mustExist = [
  ".vercel/output/config.json",
  ".vercel/output/static/index.html",
  ".vercel/output/static/posts/index.html",
  ".vercel/output/static/_data/posts.json",
];

const htmlFilesToInspect = [
  ".vercel/output/static/index.html",
  ".vercel/output/static/posts/index.html",
];

let ok = true;

function fail(message) {
  console.error(`✗ ${message}`);
  ok = false;
}

for (const p of mustExist) {
  const abs = path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) {
    fail(`Missing required output: ${p}`);
  } else {
    console.log(`✓ ${p}`);
  }
}

for (const p of htmlFilesToInspect) {
  const abs = path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) continue;

  const html = fs.readFileSync(abs, "utf8");

  const headerMatches =
    html.match(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/gi) || [];
  const footerMatches =
    html.match(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>/gi) || [];

  if (headerMatches.length !== 1) {
    fail(`${p}: expected exactly 1 .site-header, found ${headerMatches.length}`);
  }

  if (footerMatches.length !== 1) {
    fail(`${p}: expected exactly 1 .site-footer, found ${footerMatches.length}`);
  }

  if (/href="\.\.\/posts\/?"/i.test(html) || /href="\.\/posts\/?"/i.test(html)) {
    fail(`${p}: contains non-canonical posts link`);
  }

  const externalLinks = html.match(/<a\b[^>]*href="https?:\/\/[^">]+"[^>]*>/gi) || [];
  for (const tag of externalLinks) {
    const hasBlank = /target="_blank"/i.test(tag);
    const hasSafeRel = /rel="noopener noreferrer"/i.test(tag);
    if (hasBlank && !hasSafeRel) {
      fail(`${p}: external link missing rel="noopener noreferrer"`);
    }
  }
}

if (!ok) {
  console.error("\nBuild output contract FAILED. Aborting.");
  process.exit(1);
}

console.log("\nBuild output contract OK.");