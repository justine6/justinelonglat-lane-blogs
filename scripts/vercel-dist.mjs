import fs from "node:fs/promises";

await fs.rm(".vercel/output", { recursive: true, force: true });
await fs.cp("dist", ".vercel/output/static", { recursive: true });

await fs.writeFile(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
    routes: [
      { src: "^/(?:(.+)/)?index(?:\\.html)?/?$", status: 308, headers:{Location:"/$1"} },
      { src: "^/(.*)\\.html/?$", status: 308, headers:{Location:"/$1"} }
    ]
  })
);
