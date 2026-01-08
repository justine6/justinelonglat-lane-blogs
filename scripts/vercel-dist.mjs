// scripts/vercel-dist.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const outputRoot = ".vercel/output";
  const staticDir = path.join(outputRoot, "static");

  // 1. Clean old output
  await fs.rm(outputRoot, { recursive: true, force: true });

  // 2. Recreate .vercel/output/static
  await fs.mkdir(staticDir, { recursive: true });

  // 3. Copy public/ → .vercel/output/static
  await fs.cp("public", staticDir, { recursive: true });
  console.log("✓ copied public/ → .vercel/output/static");

  // 4. Minimal config.json for static site
  //    Build Output v3 – filesystem routing only
  const config = {
    version: 3
    // no routes, no overrides, nothing fancy
  };

  await fs.writeFile(
    path.join(outputRoot, "config.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
  console.log("✓ wrote .vercel/output/config.json (version 3 only)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
