import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const OUTPUT_ROOT = ".vercel/output";
  const STATIC_ROOT = path.join(OUTPUT_ROOT, "static");

  // 1) Clean previous output
  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });

  // 2) Recreate .vercel/output/static
  await fs.mkdir(STATIC_ROOT, { recursive: true });

  // 3) Copy your generated site (public) into the static output
  await fs.cp("public", STATIC_ROOT, { recursive: true });
  console.log("✓ copied public/ → .vercel/output/static");

  // 4) Minimal config for clean URLs
  const config = {
    version: 3,
    routes: [
      {
        src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
        status: 308,
        headers: { Location: "/$1" },
      },
      {
        src: "^/(.*)\\.html/?$",
        status: 308,
        headers: { Location: "/$1" },
      },
    ],
  };

  await fs.writeFile(
    path.join(OUTPUT_ROOT, "config.json"),
    JSON.stringify(config, null, 2)
  );
  console.log("✓ wrote .vercel/output/config.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
