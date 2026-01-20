import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "public");
const outDir = path.join(root, ".vercel", "output", "static");

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(srcDir)) {
  console.error("Missing public/ directory");
  process.exit(1);
}

copyRecursive(srcDir, outDir);
console.log("✓ copied public/ -> .vercel/output/static/");
