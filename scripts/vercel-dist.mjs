// scripts/vercel-dist.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const outDir = ".vercel/output";
  const staticDir = path.join(outDir, "static");

  // 1) Clean previous output
  await fs.rm(outDir, { recursive: true, force: true });

  // 2) Recreate static dir
  await fs.mkdir(staticDir, { recursive: true });

  // 3) Copy public/ -> .vercel/output/static
  await fs.cp("public", staticDir, { recursive: true });

  // 4) Build Output v3 config
  // Make "/" explicitly serve the posts grid (so homepage drift can't happen).
  const config = {
    version: 3,
    routes: [
      { src: "^/$", dest: "/posts/index.html" },
      { handle: "filesystem" }
    ]
  };

  await fs.writeFile(
    path.join(outDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );

  console.log("✓ Static output ready for Vercel");
  console.log("✓ wrote .vercel/output/config.json (version 3)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
