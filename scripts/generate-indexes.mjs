// scripts/generate-indexes.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import { globby } from "globby";
import { parseDocument } from "htmlparser2";
import slugify from "slugify";

const ROOT = process.cwd();

// where your source posts live
const SRC_POSTS_DIR = path.join(ROOT, "posts");

// where the built site lives
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_DATA_DIR = path.join(PUBLIC_DIR, "_data");
const PUBLIC_POSTS_DIR = path.join(PUBLIC_DIR, "posts");

function norm(p) {
  return p.replace(/\\/g, "/");
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function textOfFirst(el, name) {
  if (!el) return null;
  const stack = [el];
  while (stack.length) {
    const n = stack.shift();
    if (n.name === name) {
      const inner = [];
      const q = [...(n.children || [])];
      while (q.length) {
        const c = q.shift();
        if (c.type === "text" && c.data) inner.push(c.data.trim());
        if (c.children) q.push(...c.children);
      }
      if (inner.length) return inner.join(" ").trim();
    }
    if (n.children) stack.push(...n.children);
  }
  return null;
}

function findMeta(doc, metaName) {
  const stack = [doc];
  while (stack.length) {
    const n = stack.shift();
    if (n.name === "meta" && n.attribs && n.attribs.name === metaName) {
      return (n.attribs.content || "").trim();
    }
    if (n.children) stack.push(...n.children);
  }
  return null;
}

// Copy posts into public so the static server can serve them
async function copyTree(srcRoot, dstRoot) {
  if (!(await exists(srcRoot))) return;

  const files = await globby("**/*.*", { cwd: srcRoot, dot: false });
  for (const rel of files) {
    const absSrc = path.join(srcRoot, rel);
    const absDst = path.join(dstRoot, rel);
    await fs.mkdir(path.dirname(absDst), { recursive: true });
    await fs.copyFile(absSrc, absDst);
  }
}

async function collectFrom(srcDir, kind, urlBase) {
  if (!(await exists(srcDir))) return [];

  const files = await globby("**/index.html", { cwd: srcDir, dot: false });
  const items = [];

  for (const rel of files) {
    const abs = path.join(srcDir, rel);
    const html = await fs.readFile(abs, "utf8");
    const doc = parseDocument(html);

    let title = textOfFirst(doc, "h1");
    if (!title) title = path.basename(path.dirname(abs));

    const description = findMeta(doc, "description") || "";
    const tags = (findMeta(doc, "tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const relDir = path.dirname(rel);
    const urlPath = "/" + norm(path.join(urlBase, relDir)) + "/";

    items.push({
      title,
      description,
      tags,
      url: urlPath,
      slug: slugify(title, { lower: true, strict: true }),
      kind,
    });
  }

  // newest-ish first (paths usually contain year/month)
  items.sort((a, b) => (a.url < b.url ? 1 : -1));
  return items;
}

// Generate a simple listing page ONLY if it does not already exist.
// This prevents your curated pages from being overwritten.
async function ensureIndexPage(browserJsonPath, pagePath, heading) {
  if (await exists(pagePath)) {
    console.log(`✓ preserved curated ${norm(pagePath.replace(ROOT + path.sep, ""))} (not overwritten)`);
    return;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${heading}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
<!-- inject:header -->
  <main class="container">
    <h1>${heading}</h1>
    <ul id="list"></ul>
  </main>
<!-- inject:footer -->
  <script type="module">
    async function main() {
      const res = await fetch("${browserJsonPath}");
      if (!res.ok) {
        console.error("Failed to load index data", res.status);
        document.getElementById("list").innerHTML =
          '<li class="empty">Unable to load entries.</li>';
        return;
      }

      const data = await res.json();
      const list = document.getElementById("list");

      if (!Array.isArray(data) || !data.length) {
        list.innerHTML = '<li class="empty">No entries yet.</li>';
        return;
      }

      data.forEach(x => {
        const li = document.createElement("li");
        li.innerHTML =
          \`<a href="\${x.url}">\${x.title}</a>\` +
          (x.description ? \`<div class="desc">\${x.description}</div>\` : "") +
          (x.tags?.length ? \`<div class="tags"># \${x.tags.join(", ")}</div>\` : "");
        list.appendChild(li);
      });
    }

    main().catch(console.error);
  </script>
</body>
</html>`;

  await fs.mkdir(path.dirname(pagePath), { recursive: true });
  await fs.writeFile(pagePath, html, "utf8");
  console.log(`✓ generated ${norm(pagePath.replace(ROOT + path.sep, ""))}`);
}

async function main() {
  await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_POSTS_DIR, { recursive: true });

  // copy raw HTML into public
  await copyTree(SRC_POSTS_DIR, PUBLIC_POSTS_DIR);

  // collect metadata
  const posts = await collectFrom(SRC_POSTS_DIR, "post", "posts");

  await fs.writeFile(
    path.join(PUBLIC_DATA_DIR, "posts.json"),
    JSON.stringify(posts || [], null, 2),
    "utf8"
  );

  // listing pages
  await ensureIndexPage(
    "/_data/posts.json",
    path.join(PUBLIC_DIR, "posts", "index.html"),
    "All Blog Posts"
  );

  // optional alias
  await ensureIndexPage(
    "/_data/posts.json",
    path.join(PUBLIC_DIR, "blog", "index.html"),
    "All Blog Posts"
  );

  console.log(`\n✓ generated ${(posts || []).length} posts`);
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});