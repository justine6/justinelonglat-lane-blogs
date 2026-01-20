import fs from "fs";
import path from "path";

// ...your existing code...

const ROOT = process.cwd();
const OUT_STATIC = path.join(ROOT, ".vercel", "output", "static");

// Ensure output dir exists
fs.mkdirSync(OUT_STATIC, { recursive: true });

// ✅ Ensure homepage exists in output root
const rootIndex = path.join(ROOT, "index.html");
const outIndex = path.join(OUT_STATIC, "index.html");

if (fs.existsSync(rootIndex)) {
  fs.copyFileSync(rootIndex, outIndex);
  console.log("✓ copied root index.html -> .vercel/output/static/index.html");
} else {
  console.log("⚠ root index.html not found; homepage not copied");
}

// (Optional but recommended) also copy these if they live at repo root
for (const f of ["favicon.ico", "feed.xml", "sitemap.xml", "robots.txt"]) {
  const src = path.join(ROOT, f);
  const dst = path.join(OUT_STATIC, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`✓ copied ${f} -> .vercel/output/static/${f}`);
  }
}
