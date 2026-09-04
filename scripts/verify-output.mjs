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

const outputStaticDir = path.resolve(ROOT, ".vercel/output/static");
const canonicalFaviconPath = path.join(
  outputStaticDir,
  "assets",
  "img",
  "crest.png",
);
const canonicalFaviconHref = "/assets/img/crest.png";
const retiredFaviconPaths = [
  path.join(outputStaticDir, "favicon.ico"),
  path.join(outputStaticDir, "assets", "img", "favicon.ico"),
  path.join(outputStaticDir, "assets", "css", "favicon.ico"),
];

function collectHtmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(absolutePath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function attributeValue(tag, attributeName) {
  const pattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*["']([^"']+)["']`,
    "i",
  );
  const match = tag.match(pattern);
  return match ? match[1].trim() : null;
}

function isIconLink(tag) {
  const rel = attributeValue(tag, "rel");
  if (!rel) return false;

  const tokens = rel.toLowerCase().split(/\s+/);
  return tokens.includes("icon") || tokens.includes("apple-touch-icon");
}

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

if (!fs.existsSync(canonicalFaviconPath)) {
  fail(
    "Missing canonical favicon output: " +
      path.relative(ROOT, canonicalFaviconPath),
  );
} else {
  const signature = fs.readFileSync(canonicalFaviconPath).subarray(0, 8);
  const expectedPngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  if (!signature.equals(expectedPngSignature)) {
    fail("Canonical favicon output is not a valid PNG.");
  }
}

for (const retiredPath of retiredFaviconPaths) {
  if (fs.existsSync(retiredPath)) {
    fail(
      "Retired favicon output still exists: " +
        path.relative(ROOT, retiredPath),
    );
  }
}

const allOutputHtmlFiles = collectHtmlFiles(outputStaticDir);

for (const absoluteHtmlPath of allOutputHtmlFiles) {
  const relativeHtmlPath = path.relative(ROOT, absoluteHtmlPath);
  const html = fs.readFileSync(absoluteHtmlPath, "utf8");

  if (/favicon\.ico/i.test(html)) {
    fail(`${relativeHtmlPath}: contains a retired favicon.ico reference`);
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const iconLinks = linkTags.filter(isIconLink);

  if (iconLinks.length > 1) {
    fail(
      `${relativeHtmlPath}: expected at most 1 icon declaration, ` +
        `found ${iconLinks.length}`,
    );
  }

  for (const tag of iconLinks) {
    const href = attributeValue(tag, "href");
    const type = attributeValue(tag, "type");

    if (href !== canonicalFaviconHref) {
      fail(
        `${relativeHtmlPath}: non-canonical icon href ` +
          `${JSON.stringify(href)}`,
      );
    }

    if (!type || type.toLowerCase() !== "image/png") {
      fail(
        `${relativeHtmlPath}: canonical icon must declare type="image/png"`,
      );
    }
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