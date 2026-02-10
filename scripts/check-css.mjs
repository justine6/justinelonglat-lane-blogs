// scripts/check-css.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const CSS_PATH = path.join(process.cwd(), "public", "assets", "css", "main.css");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

/**
 * Strip /* ... *\/ comments so "<style>" inside comments doesn't false-positive.
 */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function main() {
  if (!existsSync(CSS_PATH)) {
    fail(`main.css not found at: ${CSS_PATH}`);
  }

  const raw = readFileSync(CSS_PATH, "utf8");
  const css = stripCssComments(raw);

  // Detect real HTML style tags (allow whitespace + attributes)
  // Matches: <style>, <style ...>, </style>
  const styleTagRe = /<\s*\/?\s*style\b[^>]*>/i;

  if (styleTagRe.test(css)) {
    fail(`main.css contains real <style> tag(s). Remove them from: ${CSS_PATH}`);
  }

  console.log("✓ CSS guardrail OK (no real <style> tags found)");
}

main();
