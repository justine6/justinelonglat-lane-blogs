import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PARTIALS = path.join(ROOT, "partials");

const HEADER = fs.readFileSync(path.join(PARTIALS, "header.html"), "utf8").trim();
const FOOTER = fs.readFileSync(path.join(PARTIALS, "footer.html"), "utf8").trim();

const GLOBAL_CSS_HREF = "/assets/css/main.css";
const TARGET_ROOT = path.join(ROOT, "public");

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
  const cleaned = between
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[\t\r\n ]+/g, "");

  return cleaned.length === 0;
}

function markerPlacementOk(html) {
  const bodyOpenIdx = indexOfRegex(html, /<body\b/i);
  const headerMarkerIdx = html.indexOf("<!-- inject:header -->");
  const footerMarkerIdx = html.indexOf("<!-- inject:footer -->");

  if (bodyOpenIdx === -1) return { ok: true };

  if (headerMarkerIdx !== -1 && headerMarkerIdx < bodyOpenIdx) {
    return {
      ok: false,
      why: "header marker appears before <body> (likely inside <head> or between </head> and <body>)"
    };
  }

  if (footerMarkerIdx !== -1 && footerMarkerIdx < bodyOpenIdx) {
    return {
      ok: false,
      why: "footer marker appears before <body> (likely misplaced)"
    };
  }

  return { ok: true };
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function injectOnce(original, marker, content) {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const re = new RegExp(
    `${escapedMarker}[\\t\\r\\n ]*(?:<!--\\s*injected:begin\\s*-->[\\s\\S]*?<!--\\s*injected:end\\s*-->[\\t\\r\\n ]*)?`,
    "g"
  );

  const wrapped = `${marker}\n<!-- injected:begin -->\n${content}\n<!-- injected:end -->\n`;
  return original.replace(re, wrapped);
}

function hasDuplicateInjectedHeader(html) {
  const matches = html.match(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/gi) || [];
  return matches.length > 1;
}

function hasDuplicateInjectedFooter(html) {
  const matches = html.match(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>/gi) || [];
  return matches.length > 1;
}

function injectIntoFile(filePath) {
  let original = stripBom(fs.readFileSync(filePath, "utf8"));

  const headerMarkerCount = countOccurrences(original, "<!-- inject:header -->");
  const footerMarkerCount = countOccurrences(original, "<!-- inject:footer -->");

  if (headerMarkerCount === 0 && footerMarkerCount === 0) {
    return { changed: false, skipped: true };
  }

  if (headerMarkerCount !== 1) {
    return { changed: false, error: `${filePath}: expected exactly 1 <!-- inject:header --> marker, found ${headerMarkerCount}` };
  }

  if (footerMarkerCount !== 1) {
    return { changed: false, error: `${filePath}: expected exactly 1 <!-- inject:footer --> marker, found ${footerMarkerCount}` };
  }

  const placement = markerPlacementOk(original);
  if (!placement.ok) {
    return { changed: false, error: `${filePath}: ${placement.why}` };
  }

  if (!hasGlobalCssLink(original)) {
    return {
      changed: false,
      error: `${filePath}: missing global CSS link <link rel="stylesheet" href="${GLOBAL_CSS_HREF}">`
    };
  }

  if (!headBodyBoundaryIsClean(original)) {
    return {
      changed: false,
      error: `${filePath}: illegal content between </head> and <body> (only whitespace/comments allowed)`
    };
  }

  let next = original;
  next = injectOnce(next, "<!-- inject:header -->", HEADER);
  next = injectOnce(next, "<!-- inject:footer -->", FOOTER);

  if (hasDuplicateInjectedHeader(next)) {
    return { changed: false, error: `${filePath}: duplicate .site-header detected after injection` };
  }

  if (hasDuplicateInjectedFooter(next)) {
    return { changed: false, error: `${filePath}: duplicate .site-footer detected after injection` };
  }

  if (next !== original) {
    fs.writeFileSync(filePath, next, "utf8");
    return { changed: true };
  }

  return { changed: false };
}

let injected = 0;
let touched = 0;
let skipped = 0;
const errors = [];

for (const file of walkHtml(TARGET_ROOT)) {
  const res = injectIntoFile(file);
  touched++;
  if (res.skipped) skipped++;
  if (res.changed) injected++;
  if (res.error) errors.push(res.error);
}

if (errors.length) {
  console.error("\n✗ Injection blocked due to contract violations:\n");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log(`✓ injected partials into ${injected} file(s) (scanned ${touched}, skipped ${skipped})`);

