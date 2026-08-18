import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

const standalone = html
  .replace('  <link rel="stylesheet" href="styles.css">', `  <style>\n${css}\n  </style>`)
  .replace('  <script src="app.js"></script>', `  <script>\n${js}\n  </script>`);

if (standalone === html) {
  throw new Error("Could not inline the root stylesheet and script.");
}

const destination = path.join(root, "Docs", "MiliLua_API_Explorer.html");
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, standalone);
console.log(`Wrote ${destination}.`);
