import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PARTIALS = path.join(ROOT, "partials");

const HEADER = fs.readFileSync(path.join(PARTIALS, "header.html"), "utf8").trim();
const FOOTER = fs.readFileSync(path.join(PARTIALS, "footer.html"), "utf8").trim();

const TARGET_DIRS = [
  path.join(ROOT, "public", "posts"),
  path.join(ROOT, "public", "docs"),
  path.join(ROOT, "public"),
];

function walkHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(p));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function injectIntoFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");

  if (!original.includes("<!-- inject:header -->") || !original.includes("<!-- inject:footer -->")) {
    // Skip files without markers (safe default)
    return false;
  }

  const next = original
    .replace("<!-- inject:header -->", `<!-- inject:header -->\n${HEADER}`)
    .replace("<!-- inject:footer -->", `<!-- inject:footer -->\n${FOOTER}`);

  if (next !== original) fs.writeFileSync(filePath, next, "utf8");
  return true;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  for (const file of walkHtml(dir)) {
    if (injectIntoFile(file)) changed++;
  }
}

console.log(`✓ injected partials into ${changed} file(s)`);
