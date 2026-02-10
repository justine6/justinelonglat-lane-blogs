import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PARTIALS = path.join(ROOT, "partials");

const HEADER = fs.readFileSync(path.join(PARTIALS, "header.html"), "utf8").trim();
const FOOTER = fs.readFileSync(path.join(PARTIALS, "footer.html"), "utf8").trim();

// ✅ Set your canonical global stylesheet href
const GLOBAL_CSS_HREF = "/styles.css";

const TARGET_DIRS = [
  path.join(ROOT, "public", "posts"),
  path.join(ROOT, "public", "docs"),
  path.join(ROOT, "public"),
];

// --- helpers ---
function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
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

function indexOfRegex(haystack, re) {
  const m = haystack.match(re);
  if (!m) return -1;
  return haystack.search(re);
}

function hasGlobalCssLink(html) {
  // Accept rel/href in any order + allow querystrings like main.css?v=123
  const href = GLOBAL_CSS_HREF.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp(
    String.raw`<link\b(?=[^>]*\brel\s*=\s*["']?stylesheet["']?)(?=[^>]*\bhref\s*=\s*["']${href}(?:\?[^"']*)?["'])[^>]*>`,
    "i"
  );
  return re.test(html);
}

function headBodyBoundaryIsClean(html) {
  const headCloseIdx = indexOfRegex(html, /<\/head\s*>/i);
  const bodyOpenIdx = indexOfRegex(html, /<body\b/i);
  if (headCloseIdx === -1 || bodyOpenIdx === -1 || bodyOpenIdx <= headCloseIdx) return true;

  const headCloseMatch = html.match(/<\/head\s*>/i);
  const headCloseLen = headCloseMatch ? headCloseMatch[0].length : 7;

  const between = html.slice(headCloseIdx + headCloseLen, bodyOpenIdx);

  // allow only comments + whitespace
  const cleaned = between
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[\t\r\n ]+/g, "");

  return cleaned.length === 0;
}

function markerPlacementOk(html) {
  const headCloseIdx = indexOfRegex(html, /<\/head\s*>/i);
  const bodyOpenIdx = indexOfRegex(html, /<body\b/i);

  const headerMarkerIdx = html.indexOf("<!-- inject:header -->");
  const footerMarkerIdx = html.indexOf("<!-- inject:footer -->");

  // if no body/head present, don't block—just proceed as a fragment
  if (headCloseIdx === -1 || bodyOpenIdx === -1) return { ok: true };

  // header marker must be AFTER <body ...>
  if (headerMarkerIdx !== -1 && headerMarkerIdx < bodyOpenIdx) {
    return { ok: false, why: "header marker appears before <body> (likely inside <head> or between </head> and <body>)" };
  }

  // footer marker should also be after <body>
  if (footerMarkerIdx !== -1 && footerMarkerIdx < bodyOpenIdx) {
    return { ok: false, why: "footer marker appears before <body> (likely misplaced)" };
  }

  return { ok: true };
}

function injectOnce(original, marker, content) {
  // Idempotent: if marker already followed by content, don’t add again.
  // Also: if the marker had previous injected content from older runs, collapse to single canonical injection.
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Replace marker + any following injected block (until next marker or end) with marker + canonical content.
  // This keeps it stable even if someone modified injected parts.
  const re = new RegExp(
    `${escapedMarker}[\\t\\r\\n ]*(?:<!--\\s*injected:begin\\s*-->[\\s\\S]*?<!--\\s*injected:end\\s*-->[\\t\\r\\n ]*)?`,
    "g"
  );

  const wrapped = `${marker}\n<!-- injected:begin -->\n${content}\n<!-- injected:end -->\n`;
  return original.replace(re, wrapped);
}

function injectIntoFile(filePath) {
  let original = stripBom(fs.readFileSync(filePath, "utf8"));

  const hasHeaderMarker = original.includes("<!-- inject:header -->");
  const hasFooterMarker = original.includes("<!-- inject:footer -->");

  if (!hasHeaderMarker || !hasFooterMarker) {
    // Skip files without markers (safe default)
    return { changed: false, skipped: true };
  }

  // Enforce marker placement so you never end up violating the </head> -> <body> contract
  const placement = markerPlacementOk(original);
  if (!placement.ok) {
    return { changed: false, error: `${filePath}: ${placement.why}` };
  }

  // Enforce global CSS always linked
  if (!hasGlobalCssLink(original)) {
    return { changed: false, error: `${filePath}: missing global CSS link <link rel="stylesheet" href="${GLOBAL_CSS_HREF}">` };
  }

  // Enforce clean boundary between </head> and <body>
  if (!headBodyBoundaryIsClean(original)) {
    return { changed: false, error: `${filePath}: illegal content between </head> and <body> (only whitespace/comments allowed)` };
  }

  let next = original;
  next = injectOnce(next, "<!-- inject:header -->", HEADER);
  next = injectOnce(next, "<!-- inject:footer -->", FOOTER);

  if (next !== original) {
    fs.writeFileSync(filePath, next, "utf8");
    return { changed: true };
  }
  return { changed: false };
}

// --- run ---
let injected = 0;
let touched = 0;
let skipped = 0;
const errors = [];

for (const dir of TARGET_DIRS) {
  for (const file of walkHtml(dir)) {
    const res = injectIntoFile(file);
    touched++;
    if (res.skipped) skipped++;
    if (res.changed) injected++;
    if (res.error) errors.push(res.error);
  }
}

if (errors.length) {
  console.error("\n✗ Injection blocked due to contract violations:\n");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log(`✓ injected partials into ${injected} file(s) (scanned ${touched}, skipped ${skipped})`);
