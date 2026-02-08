// scripts/vercel-dist.mjs
import { promises as fsp } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const OUT_DIR = path.join(ROOT, ".vercel", "output");
const STATIC_DIR = path.join(OUT_DIR, "static");

// Preferred: pinned curated file your generator will never overwrite
const CURATED_PINNED = path.join(ROOT, "public", "posts", "index.curated.html");

// Fallback: normal index (may be generated / overwritten)
const CURATED_DEFAULT = path.join(ROOT, "public", "posts", "index.html");

// Where Vercel serves posts index from
const OUT_POSTS_INDEX = path.join(STATIC_DIR, "posts", "index.html");

async function pathExists(p) {
  try {
    await fsp.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // 1) Clean previous output
  await fsp.rm(OUT_DIR, { recursive: true, force: true });

  // 2) Create output/static dir
  await fsp.mkdir(STATIC_DIR, { recursive: true });

  // 3) Copy public/ -> .vercel/output/static (Build Output API v3)
  await fsp.cp(path.join(ROOT, "public"), STATIC_DIR, { recursive: true });

  // 4) Force-deploy curated posts index
  // Prefer pinned: public/posts/index.curated.html
  // Else fallback: public/posts/index.html
  let curatedSource = null;

  if (await pathExists(CURATED_PINNED)) {
    curatedSource = CURATED_PINNED;
    console.log("✓ using pinned curated posts index: public/posts/index.curated.html");
  } else if (await pathExists(CURATED_DEFAULT)) {
    curatedSource = CURATED_DEFAULT;
    console.log("✓ using curated posts index: public/posts/index.html");
  }

  if (curatedSource) {
    await fsp.mkdir(path.dirname(OUT_POSTS_INDEX), { recursive: true });
    await fsp.copyFile(curatedSource, OUT_POSTS_INDEX);
    console.log("✓ forced overwrite: posts index -> .vercel/output/static/posts/index.html");
  } else {
    console.warn("! curated posts index not found (checked):");
    console.warn("  -", CURATED_PINNED);
    console.warn("  -", CURATED_DEFAULT);
  }

  // 5) Ensure root index exists (fallback to /posts/)
  const ROOT_INDEX = path.join(STATIC_DIR, "index.html");
  if (!(await pathExists(ROOT_INDEX))) {
    const POSTS_INDEX = path.join(STATIC_DIR, "posts", "index.html");
    if (await pathExists(POSTS_INDEX)) {
      await fsp.copyFile(POSTS_INDEX, ROOT_INDEX);
      console.log("✓ created .vercel/output/static/index.html from /posts/index.html");
    } else {
      throw new Error("Missing required output: no /index.html and no /posts/index.html fallback.");
    }
  }

  // 6) Minimal Build Output v3 config
  const config = { version: 3, routes: [{ handle: "filesystem" }] };
  await fsp.writeFile(path.join(OUT_DIR, "config.json"), JSON.stringify(config, null, 2), "utf8");

  console.log("✓ Static output ready for Vercel");
  console.log('✓ wrote .vercel/output/config.json (version 3, filesystem + "/index.html")');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
