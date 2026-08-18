import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const api = JSON.parse(fs.readFileSync(path.join(root, "Docs", "MiliLua_API_Data.json"), "utf8"));
const destination = path.join(root, "app.js");
const source = fs.readFileSync(destination, "utf8");
const apiDeclaration = /^const API=.*;\r?\n/;
if (!apiDeclaration.test(source)) {
  throw new Error("Could not locate the embedded API declaration in app.js.");
}

const updated = source.replace(apiDeclaration, `const API=${JSON.stringify(api)};\n`);
if (updated !== source) {
  fs.writeFileSync(destination, updated);
  console.log(`Refreshed ${destination}.`);
} else {
  console.log(`${destination} is already current.`);
}
