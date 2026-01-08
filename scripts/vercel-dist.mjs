// scripts/vercel-dist.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const outputRoot = ".vercel/output";
  const staticDir = path.join(outputRoot, "static");
  const configPath = path.join(outputRoot, "config.json");

  // 1. Clean previous output
  await fs.rm(outputRoot, { recursive: true, force: true });

  // 2. Copy public -> .vercel/output/static
  await fs.mkdir(staticDir, { recursive: true });
  await fs.cp("public", staticDir, { recursive: true });
  console.log("✓ copied public/ → .vercel/output/static");

  // 3. Minimal v3 routing config: filesystem first, then 404
  const config = {
    version: 3,
    routes: [
      // 👇 THIS is the critical piece that was missing
      { handle: "filesystem" },

      // Optional: you can add clean-url redirects later if you want
      // but for now keep it simple to prove it works.

      { handle: "error" },
      {
        src: "^(?!/api).*$",
        dest: "/404",
        status: 404,
      },
    ],
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log("✓ wrote .vercel/output/config.json (v3, filesystem-first)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
