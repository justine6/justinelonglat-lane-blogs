// scripts/check-canonical-grid.mjs
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

const MARKER = "JLT_CANONICAL_POSTS_GRID_V1";
const EXPECTED = `/* ${MARKER} */`;

// Enable deep diagnostics with: DEBUG=1 npm run prebuild
const DEBUG = process.env.DEBUG === "1";
const log = (...args) => {
  if (DEBUG) console.log(...args);
};

// Primary target (the only one we validate)
const CSS_PRIMARY = path.join(process.cwd(), "public", "assets", "css", "main.css");

// Extra: detect accidental duplicates like scripts/public/assets/css/main.css
function findAllMainCss(startDir) {
  const hits = [];
  const stack = [startDir];

  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const e of entries) {
      const abs = path.join(dir, e.name);

      if (e.isDirectory()) {
        // Skip heavy/noisy folders
        if (e.name === "node_modules" || e.name === ".git") continue;
        // Skip build output folders that often contain copies
        if (e.name === ".vercel" || e.name === "dist" || e.name === "out") continue;
        stack.push(abs);
        continue;
      }

      if (e.isFile() && e.name.toLowerCase() === "main.css") {
        hits.push(abs);
      }
    }
  }

  return hits;
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function main() {
  log(`[canonical-grid] CWD=${process.cwd()}`);
  log(`[canonical-grid] PRIMARY=${CSS_PRIMARY}`);

  if (!existsSync(CSS_PRIMARY)) {
    // Always provide a helpful hint even when DEBUG is off
    console.error("✗ main.css not found at PRIMARY path.");
    if (DEBUG) {
      console.log("[canonical-grid] Searching repo for main.css...");
      const hits = findAllMainCss(process.cwd());
      for (const h of hits) console.log("[canonical-grid] FOUND:", h);
    }
    fail(`main.css missing at PRIMARY path: ${CSS_PRIMARY}`);
  }

  const css = readFileSync(CSS_PRIMARY, "utf8");

  const markerCount = (css.match(new RegExp(MARKER, "g")) || []).length;
  const trimmed = css.replace(/\s+$/g, ""); // remove trailing whitespace only

  log(`[canonical-grid] bytes=${Buffer.byteLength(css, "utf8")}`);
  log(`[canonical-grid] markerCount=${markerCount}`);
  log(`[canonical-grid] endsWithExpected=${trimmed.endsWith(EXPECTED)}`);
  log(
    `[canonical-grid] tail=${JSON.stringify(
      css.slice(Math.max(0, css.length - 220)).replace(/\r/g, "\\r")
    )}`
  );

  if (markerCount === 0) {
    fail(`Missing canonical posts grid marker in main.css (${EXPECTED}).`);
  }

  if (markerCount > 1) {
    // Help locate duplicates when debugging
    if (DEBUG) {
      const idxs = [];
      let i = css.indexOf(MARKER);
      while (i !== -1) {
        idxs.push(i);
        i = css.indexOf(MARKER, i + 1);
      }
      console.log("[canonical-grid] marker positions:", idxs.join(", "));
    }
    fail(`Multiple canonical posts grid markers detected (${markerCount}). Keep only ONE.`);
  }

  // Enforce: marker is last non-whitespace content in file
  if (!trimmed.endsWith(EXPECTED)) {
    fail(`Canonical marker must be the LAST non-whitespace content in main.css: ${EXPECTED}`);
  }

  // Sanity: ensure posts-grid exists in file somewhere
  if (!css.includes(".posts-grid")) {
    fail("Marker exists, but .posts-grid was not found anywhere in main.css.");
  }

  // Quiet success (CI-friendly)
  console.log("✓ Canonical posts grid marker OK (single + bottom-of-file).");
}

main();
