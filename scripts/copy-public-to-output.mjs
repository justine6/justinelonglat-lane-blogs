// scripts/copy-public-to-output.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public");
const OUT_STATIC = path.join(ROOT, ".vercel", "output", "static");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyEntry(srcPath, destPath) {
  // Node 18+ supports fs.cpSync
  fs.cpSync(srcPath, destPath, { recursive: true });
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`✗ public/ not found at: ${SRC}`);
    process.exit(1);
  }

  ensureDir(OUT_STATIC);

  // If a previous buggy copy created .vercel/output/static/public, remove it
  const nestedPublic = path.join(OUT_STATIC, "public");
  if (fs.existsSync(nestedPublic)) {
    fs.rmSync(nestedPublic, { recursive: true, force: true });
  }

  // Copy CONTENTS of public/ into .vercel/output/static/
  for (const name of fs.readdirSync(SRC)) {
    const from = path.join(SRC, name);
    const to = path.join(OUT_STATIC, name);
    // remove existing destination to avoid stale leftovers
    fs.rmSync(to, { recursive: true, force: true });
    copyEntry(from, to);
  }

  console.log("✓ copied contents of public/ -> .vercel/output/static/");
}

main();
