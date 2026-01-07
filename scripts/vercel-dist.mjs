import fs from "node:fs/promises";
import path from "node:path";

async function cleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function main() {
  // 1) Clean old outputs
  await cleanDir("dist");
  await cleanDir(".vercel/output");

  // 2) Your existing behaviour: public -> dist
  await fs.cp("public", "dist", { recursive: true });
  console.log("✓ copied public/ → dist/");

  // 3) Prepare Vercel Build Output v3
  const outRoot = ".vercel/output";
  const outStatic = path.join(outRoot, "static");

  await fs.mkdir(outStatic, { recursive: true });

  // copy the built site into the static output
  await fs.cp("dist", outStatic, { recursive: true });
  console.log("✓ copied dist/ → .vercel/output/static");

  // Minimal config for a pure static site
  const config = {
    // Build Output API v3
    version: 3
    // No custom routes or overrides:
    // Vercel will just serve files directly from /static
    // so / maps to static/index.html, /posts/... to static/posts/...
  };

  await fs.writeFile(
    path.join(outRoot, "config.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
  console.log("✓ wrote .vercel/output/config.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
