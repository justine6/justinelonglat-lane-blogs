// scripts/vercel-dist.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const outputRoot = ".vercel/output";
  const staticDir = path.join(outputRoot, "static");

  // 1) Clean previous output
  await fs.rm(outputRoot, { recursive: true, force: true });

  // 2) Recreate static dir
  await fs.mkdir(staticDir, { recursive: true });

  // 3) Copy public → .vercel/output/static
  await fs.cp("public", staticDir, { recursive: true });
  console.log("✓ copied public/ → .vercel/output/static");

  // 4) Minimal config for Build Output v3
  const config = { version: 3 };
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
