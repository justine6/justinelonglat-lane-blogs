import fs from "node:fs/promises";

async function main() {
  await fs.rm(".vercel/output", { recursive: true, force: true });

  await fs.cp("public", ".vercel/output/static", { recursive: true });

  await fs.writeFile(
    ".vercel/output/config.json",
    JSON.stringify(
      {
        version: 3,
        routes: [
          { handle: "filesystem" },
          { src: "/.*", status: 404 }
        ]
      },
      null,
      2
    )
  );

  console.log("✓ Static output ready for Vercel");
}

main();
  