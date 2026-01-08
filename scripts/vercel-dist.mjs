// scripts/vercel-dist.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const outputDir = ".vercel/output";
  const staticDir = path.join(outputDir, "static");
  const configPath = path.join(outputDir, "config.json");

  // 1) Clean build output
  await fs.rm(outputDir, { recursive: true, force: true });

  // 2) Copy public/ -> .vercel/output/static
  await fs.mkdir(staticDir, { recursive: true });
  await fs.cp("public", staticDir, { recursive: true });
  console.log("✓ copied public/ → .vercel/output/static");

  // 3) Minimal Build Output API v3 config
  //    "filesystem" tells Vercel: serve files from /static matching the URL
  const config = {
    version: 3,
    routes: [
      { handle: "filesystem" }
      // Optional SPA-style fallback if you ever need it:
      // { "src": "/(.*)", "dest": "/index.html" }
    ],
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log("✓ wrote .vercel/output/config.json (version 3, filesystem routing)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
