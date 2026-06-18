import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "single-dist");
const entry = resolve(root, "scripts/single-entry.jsx");
const outfile = resolve(outDir, "bundle.js");

await mkdir(outDir, { recursive: true });
await writeFile(entry, `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "../src/App.jsx";\ncreateRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);\n`);

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  logLevel: "info",
});

const js = await readFile(outfile, "utf8");
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Datascape: Cambridge — workplace simulator for Level 6 Data Scientist apprentices." />
  <title>Datascape: Cambridge</title>
</head>
<body>
  <div id="root"></div>
  <script>${js.replaceAll("</script>", "<\\/script>")}</script>
</body>
</html>`;

await writeFile(resolve(outDir, "datascape-cambridge.html"), html);
console.log(`Wrote ${resolve(outDir, "datascape-cambridge.html")}`);
