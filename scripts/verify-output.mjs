import fs from "fs";
import path from "path";

const mustExist = [
  ".vercel/output/config.json",
  ".vercel/output/static/index.html",
  ".vercel/output/static/posts/index.html",
  ".vercel/output/static/projects/index.html",
  ".vercel/output/static/_data/posts.json",
  ".vercel/output/static/_data/projects.json",
];

let ok = true;

for (const p of mustExist) {
  const abs = path.resolve(process.cwd(), p);
  if (!fs.existsSync(abs)) {
    console.error(`✗ Missing required output: ${p}`);
    ok = false;
  } else {
    console.log(`✓ ${p}`);
  }
}

if (!ok) {
  console.error("\nBuild output contract FAILED. Aborting.");
  process.exit(1);
}

console.log("\nBuild output contract OK.");
