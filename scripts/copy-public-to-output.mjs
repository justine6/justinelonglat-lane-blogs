import fs from "fs";
import path from "path";

// ...your existing code...

const ROOT = process.cwd();
const OUT_STATIC = path.join(ROOT, ".vercel", "output", "static");

// Ensure output dir exists
fs.mkdirSync(OUT_STATIC, { recursive: true });

// ✅ Ensure homepage exists in output root
// Prefer the rich homepage from /public if present; fallback to repo-root index.html.
const rootIndex = path.join(ROOT, "index.html");
const publicIndex = path.join(ROOT, "public", "index.html");
const outIndex = path.join(OUT_STATIC, "index.html");

const srcIndex = fs.existsSync(publicIndex) ? publicIndex : rootIndex;

if (fs.existsSync(srcIndex)) {
  fs.copyFileSync(srcIndex, outIndex);
  const label = srcIndex === publicIndex ? "public/index.html" : "root index.html";
  console.log(`✓ copied ${label} -> .vercel/output/static/index.html`);
} else {
  console.log("⚠ No index.html found (neither /public nor repo root); homepage not copied");
}
