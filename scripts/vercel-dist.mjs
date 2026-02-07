// scripts/vercel-dist.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const outDir = ".vercel/output";
  const staticDir = path.join(outDir, "static");

  // 1) Clean previous output
  await fs.rm(outDir, { recursive: true, force: true });

  // 2) Recreate static dir
  await fs.mkdir(staticDir, { recursive: true });

  // 3) Copy public/ -> .vercel/output/static
  await fs.cp("public", staticDir, { recursive: true });

  // 4) Ensure required root index exists
  // If public/index.html doesn't exist, make "/" land on posts grid by copying posts index.
  const rootIndex = path.join(staticDir, "index.html");
  const postsIndex = path.join(staticDir, "posts", "index.html");

  if (!(await exists(rootIndex))) {
    if (await exists(postsIndex)) {
      await fs.copyFile(postsIndex, rootIndex);
      console.log("✓ created .vercel/output/static/index.html from /posts/index.html");
    } else {
      throw new Error(
        "Missing required output: no .vercel/output/static/index.html and no /posts/index.html to fallback to."
      );
    }
  }

  // 5) Minimal config for Build Output v3 (filesystem only)
  // "/" will serve /index.html automatically because it's in the static filesystem.
  const config = {
    version: 3,
    routes: [{ handle: "filesystem" }],
  };

  await fs.writeFile(
    path.join(outDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );

  console.log("✓ Static output ready for Vercel");
  console.log('✓ wrote .vercel/output/config.json (version 3, filesystem + "/index.html")');
}
// scripts/vercel-dist.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, ".vercel", "output", "static");

// ✅ Force Vercel to serve the curated posts index from /public
const curatedPostsIndex = path.join(ROOT, "public", "posts", "index.html");
const vercelPostsIndex  = path.join(OUT, "posts", "index.html");

fs.mkdirSync(path.dirname(vercelPostsIndex), { recursive: true });
fs.copyFileSync(curatedPostsIndex, vercelPostsIndex);

console.log("✓ overwrote Vercel posts index from public/posts/index.html");

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
