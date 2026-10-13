import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const api = JSON.parse(fs.readFileSync(path.join(root, "Docs", "MiliLua_API_Data.json"), "utf8"));
const docsDir = path.join(root, "Docs");
const destination = path.join(docsDir, "MiliLua_API_Reference.md");
const out = [];
const write = (...lines) => out.push(...lines);

write(
  "# MiliLua API Reference",
  "",
  `API document ${api.version} · Game ${api.gameVersion} · Consolidated ${api.generatedAt}`,
  "",
  "This reference contains API signatures, native types, properties, and enum values. Working-demo source is intentionally excluded.",
  "",
  "## Confidence labels",
  "",
  "- **Demo verified** — exercised by a confirmed runtime example; source is not included here.",
  "- **Documented** — described by the structured API declaration.",
  "- **Incomplete** — signature recovered, but behavior or types remain uncertain.",
  "- **Deprecated** — present but believed unused.",
  "",
  "## Functions",
  "",
);

for (const owner of [...new Set(api.functions.map((entry) => entry.owner))]) {
  write(`### ${owner}`, "");
  for (const fn of api.functions.filter((entry) => entry.owner === owner)) {
    write(`#### \`${fn.signature}\``, "", `**${fn.status === "uncertain" ? "incomplete" : fn.status.replace("-", " ")}** — ${fn.description}`, "");
    if (fn.note) write(`> ${fn.note}`, "");
    if (fn.params.length) {
      write("Parameters:", "");
      for (const param of fn.params) write(`- \`${param.name}: ${param.type}\`${param.description ? ` — ${param.description}` : ""}`);
      write("");
    }
    if (fn.returns.length) {
      write("Returns:", "");
      for (const item of fn.returns) write(`- \`${item.type}${item.name ? ` ${item.name}` : ""}\`${item.description ? ` — ${item.description}` : ""}`);
      write("");
    }
  }
}

write("## Properties and native types", "");
for (const type of api.types) {
  if(type.kind==='editor-alias') continue;
  const fields = api.properties.filter((property) => property.owner === type.name);
  write(`### \`${type.name}\`${type.parent ? ` extends \`${type.parent}\`` : ""}`, "", type.description || "Native host type.", "");
  for (const field of fields) write(`- \`${field.name}: ${field.type}\`${field.description ? ` — ${field.description}` : ""}`);
  if (fields.length) write("");
}

write("## Enums", "");
for (const item of api.enums) {
  write(`### \`${item.name}\``, "");
  if (item.description) write(item.description, "");
  if (item.values.length) for (const value of item.values) write(`- \`${item.name}.${value}\``);
  else write("- Values have not been recovered.");
  write("");
}

write("## Local guides", "");
for (const guide of api.guides || []) write(`### ${guide.title}`, "", guide.description, "", guide.attribution, "");
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(destination, `${out.join("\n")}\n`);
console.log(`Wrote ${destination} (${out.length} blocks).`);
