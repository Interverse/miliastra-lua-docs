import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import './generate-share-ids.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");
const locale = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
const localeContent = fs.readFileSync(path.join(root, "locale-content.js"), "utf8");
const shareIds = fs.readFileSync(path.join(root, "share-ids.js"), "utf8");
const share = fs.readFileSync(path.join(root, "share.js"), "utf8");
const toolbar = fs.readFileSync(path.join(root, "toolbar.js"), "utf8");

const standalone = html
  .replace('  <link rel="stylesheet" href="styles.css">', `  <style>\n${css}\n  </style>`)
  .replace('  <script src="i18n.js"></script>', `  <script>\n${locale}\n  </script>`)
  .replace('  <script src="locale-content.js"></script>', `  <script>\n${localeContent}\n  </script>`)
  .replace('  <script src="app.js"></script>', `  <script>\n${js}\n  </script>`)
  .replace('  <script src="share-ids.js"></script>', `  <script>\n${shareIds}\n  </script>`)
  .replace('  <script src="share.js"></script>', `  <script>\n${share}\n  </script>`)
  .replace('  <script src="toolbar.js"></script>', `  <script>\n${toolbar}\n  </script>`);

if (standalone === html) {
  throw new Error("Could not inline the root stylesheet and script.");
}

const destination = path.join(root, "Docs", "MiliLua_API_Explorer.html");
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, standalone);
console.log(`Wrote ${destination}.`);
