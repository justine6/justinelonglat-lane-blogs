import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  // 1) Clean any previous Build Output
  await fs.rm(".vercel/output", { recursive: true, force: true });

  // 2) Build static assets: copy public → dist
  await fs.rm("dist", { recursive: true, force: true });
  await fs.cp("public", "dist", { recursive: true });
  console.log("✓ copied public/ → dist/");

  // 3) Copy dist → .vercel/output/static (Build Output API)
  const outDir = ".vercel/output";
  const staticDir = path.join(outDir, "static");
  await fs.mkdir(staticDir, { recursive: true });
  await fs.cp("dist", staticDir, { recursive: true });
  console.log("✓ copied dist/ → .vercel/output/static");

  // 4) Minimal config: let filesystem handle routes first
  const config = {
    version: 3,
    routes: [
      { handle: "filesystem" },
      // Optional: custom 404, assuming you have /404.html or /404/index.html
      { src: "/.*", dest: "/404", status: 404 },
    ],
  };

  await fs.writeFile(
    path.join(outDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
  console.log("✓ wrote .vercel/output/config.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
