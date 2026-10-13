import fs from "node:fs";
import path from "node:path";
import { mergeLibrary } from "./merge-library.mjs";
import { localizeDocs } from "./localize-docs.mjs";
import { resolveEditorAliases } from "./resolve-editor-aliases.mjs";

const root = process.cwd();
const declaration = fs.readFileSync(path.join(root, "References", "mw_api.d.lua"), "utf8").replace(/\r/g, "");
const signatures = fs.readFileSync(path.join(root, "References", "miliastra_wonderland_ui_lua_functions.md"), "utf8").replace(/\r/g, "");
const confirmedDemoDir = path.join(root, "References", "Confirmed Demos");
const demoFiles = fs.existsSync(confirmedDemoDir)
  ? fs.readdirSync(confirmedDemoDir).filter((name) => name.toLowerCase().endsWith(".lua")).sort()
  : [];
const demoSources = demoFiles.map((name) => ({ name, source: fs.readFileSync(path.join(confirmedDemoDir, name), "utf8").replace(/\r/g, "") }));
const demo = demoSources.map(({ source }) => source).join("\n\n");
const functions = [], properties = [], types = [], enums = [];
const lines = declaration.split("\n");
let comments = [];
const lifecycleNames = new Set(["OnInit", "OnEnable", "OnStart", "OnDisable", "OnDestroy", "OnUpdate", "OnLevelUpdate"]);

const cleanDoc = (buffer) => buffer.filter((line) => line.startsWith("---") && !line.startsWith("---@")).map((line) => line.replace(/^---\s?/, "").trim()).filter(Boolean).join(" ").replace(/`/g, "").replace(/\s+/g, " ").trim();
const annotations = (buffer, tag) => buffer.filter((line) => line.startsWith(`---@${tag}`)).map((line) => line.replace(`---@${tag}`, "").trim());

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i].trim();
  if (line.startsWith("---")) { comments.push(line); continue; }
  if (!line || line.startsWith("--")) { comments = []; continue; }
  const classLine = comments.find((entry) => entry.startsWith("---@class"));
  if (classLine && /^[A-Za-z][\w.]*\s*=\s*\{/.test(line)) {
    const [name, parent] = classLine.replace("---@class", "").trim().split(/\s*:\s*/);
    types.push({ name, parent: parent || null, description: cleanDoc(comments) });
    for (const field of annotations(comments, "field")) {
      const match = field.match(/^(\S+)\s+(\S+)(?:\s+(.*))?$/);
      if (match) properties.push({ owner: name, name: match[1], type: match[2], description: match[3] || "" });
    }
  }
  const functionMatch = line.match(/^function\s+([\w.]+)(:|\.)([\w]+)\(([^)]*)\)/) || line.match(/^function\s+()()([\w]+)\(([^)]*)\)/);
  if (functionMatch) {
    const name = functionMatch[3];
    const owner = functionMatch[1] || (lifecycleNames.has(name) ? "Lifecycle" : "Lua"), separator = functionMatch[2] || "";
    const params = annotations(comments, "param").map((entry) => { const match = entry.match(/^(\S+)\s+(\S+)(?:\s+(.*))?$/); return match ? { name: match[1], type: match[2], description: match[3] || "" } : { name: entry, type: "any", description: "" }; });
    const returns = annotations(comments, "return").map((entry) => { const match = entry.match(/^(\S+)\s+(\S+)(?:\s+(.*))?$/); return match ? { type: match[1], name: match[2], description: match[3] || "" } : { type: entry, name: "", description: "" }; });
    const description = cleanDoc(comments);
    const uncertain = /unknown|unconfirmed|presumably|possibly|beats me|seemingly/i.test(description);
    const deprecated = comments.some((entry) => entry.includes("@deprecated"));
    const demoPattern = new RegExp(`${name}\\s*\\(`);
    functions.push({ owner, name, separator, signature: `${owner === "Lifecycle" || owner === "Lua" ? "" : owner + separator}${name}(${functionMatch[4]})`, description: description || "Signature discovered; behavior is not yet documented.", params, returns, status: deprecated ? "deprecated" : uncertain ? "uncertain" : demoPattern.test(demo) ? "demo-verified" : "documented", source: "declaration", note: "" });
  }
  const enumMatch = line.match(/^(Enum\.[\w]+)\s*=\s*\{/);
  if (enumMatch) {
    const values = [];
    let depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (depth === 0) {
      const inline = line.match(/\{(.*)\}/)?.[1] || "";
      for (const part of inline.split(",")) { const value = part.trim().match(/^([A-Za-z][\w]*)\s*=/); if (value) values.push(value[1]); }
    }    while (depth > 0 && i + 1 < lines.length) {
      i += 1;
      const enumLine = lines[i].trim();
      if (depth === 1) { const value = enumLine.match(/^([A-Za-z][\w]*)\s*=/); if (value) values.push(value[1]); }
      depth += (enumLine.match(/\{/g) || []).length - (enumLine.match(/\}/g) || []).length;
    }
    enums.push({ name: enumMatch[1], values, description: cleanDoc(comments) });
  }
  if (line && !line.startsWith("--")) comments = [];
}

let currentOwner = "", inLua = false;
for (const rawLine of signatures.split("\n")) {
  const heading = rawLine.match(/^## `([^`]+)`/); if (heading) currentOwner = heading[1];
  if (rawLine.trim() === "```lua") { inLua = true; continue; }
  if (rawLine.trim() === "```") { inLua = false; continue; }
  if (!inLua || !rawLine.trim() || !currentOwner) continue;
  const sig = rawLine.trim();
  const match = sig.match(/^([\w.]+)(:|\.)([\w]+)\((.*)\)(?:\s*->\s*(.*))?$/);
  if (!match) continue;
  const [, owner, separator, name, paramText, returnText] = match;
  if (functions.some((fn) => fn.owner === owner && fn.name === name)) continue;
  if (owner.startsWith("ClientUI") && functions.some((fn) => fn.owner === "ClientUIBaseControl" && fn.name === name)) continue;
  if (owner.startsWith("ClientUI") && name === "GetScriptByPath") {
    if (!functions.some((fn) => fn.owner === "ClientUIBaseControl" && fn.name === name)) functions.push({ owner: "ClientUIBaseControl", name, separator: ":", signature: "ClientUIBaseControl:GetScriptByPath(path)", description: "Gets an attached script by path.", params: [{ name: "path", type: "string", description: "Script path" }], returns: [{ type: "Script|nil", name: "script", description: "The matching script, if present." }], status: "uncertain", source: "signature inventory", note: "" });
    continue;
  }
  const params = paramText ? paramText.split(/,\s*/).map((type, index) => ({ name: `arg${index + 1}`, type, description: "" })) : [];
  const returns = returnText ? returnText.split(/,\s*/).map((type) => ({ type, name: "", description: "" })) : [];
  functions.push({ owner, name, separator, signature: sig.replace(/\s*->.*/, ""), description: "Discovered signature; behavior is not yet documented.", params, returns, status: "uncertain", source: "signature inventory", note: "" });
}

for (const fn of functions.filter((item) => item.owner === "TweenSequence" && ["Complete", "Kill", "Play", "SetOnComplete"].includes(item.name))) {
  if (fn.status === "demo-verified") {
    fn.status = "documented";
    fn.note = "No dedicated TweenSequence demo was found; confidence corrected from a method-name match against ordinary Tween demos.";
  }
}
for (const fn of functions.filter((item) => item.owner === "Color")) {
  const usedLegacyLowercase = /^from/.test(fn.name);
  fn.name = fn.name.replace(/^from/, "From"); fn.signature = fn.signature.replace("Color.from", "Color.From");
  fn.status = demo.includes(`Color.${fn.name}(`) ? "demo-verified" : fn.status;
  fn.note = usedLegacyLowercase ? "The official API and working demo use this uppercase form; a legacy declaration used lowercase." : "";
}
for (let index = functions.length - 1; index >= 0; index -= 1) {
  if (functions.findIndex((item) => item.owner === functions[index].owner && item.name === functions[index].name) !== index) functions.splice(index, 1);
}
if (!functions.some((item) => item.owner === "Color" && item.name === "Color")) {
  functions.push({
    owner: "Color", name: "Color", separator: "", signature: "Color(r, g, b, a)",
    description: "Creates a ColorValue from 0-255 RGBA channels. Alpha may be omitted or nil; either means 255 (opaque).",
    params: [
      { name: "r", type: "number", description: "Red channel, 0-255" },
      { name: "g", type: "number", description: "Green channel, 0-255" },
      { name: "b", type: "number", description: "Blue channel, 0-255" },
      { name: "a", type: "number|nil", description: "Optional alpha channel, 0-255" },
    ],
    returns: [{ type: "ColorValue", name: "color", description: "Constructed color" }],
    status: "documented", source: "official API.pdf", note: "",
  });
}
if (!types.some((item) => item.name === "ColorValue")) types.push({ name: "ColorValue", parent: null, description: "Native color value created from 0-255 RGBA channels." });
const officialOwners = new Set(["Lifecycle", "script", "game", "Color", "ServerSignal", "ClientUIBaseControl", "ClientUICursorEventAreaControl", "ClientUIPresetButtonControl", "ClientUIAnimationControl", "ClientUIGridScrollerControl", "ClientUIImageControl", "CursorEventData", "Tween", "TweenSequence"]);
for (const fn of functions) {
  if (officialOwners.has(fn.owner) || (fn.owner === "Lua" && ["typeof", "print", "printerr"].includes(fn.name))) {
    fn.source = "official API.pdf";
    if (fn.status !== "demo-verified" && fn.status !== "deprecated" && !/unknown|unconfirmed|conflict|not specify/i.test(fn.description)) fn.status = "documented";
  }
}
for (const property of [["ClientUIImageControl", "imageSource", "Enum.ImageSource"], ["ClientUIImageControl", "imageId", "number"], ["ClientUIImageControl", "imageColor", "number"], ["ClientUIImageControl", "fillAmount", "number"], ["ClientUICursorEventAreaControl", "raycastTarget", "boolean"], ["ClientUITextBoxControl", "text", "string"]]) {
  if (!properties.some((item) => item.owner === property[0] && item.name === property[1])) properties.push({ owner: property[0], name: property[1], type: property[2], description: property[0] === "ClientUITextBoxControl" && property[1] === "text" ? "Readable and writable text value; confirmed demos append text through a repeating empty-Tween scheduler." : "Observed in runtime testing." });
}
mergeLibrary(root, { functions, properties, types, enums });
const colorValue = types.find(type => type.name === "ColorValue");
if (colorValue) colorValue.description += "\n\nRetrieve the red, green, blue, and alpha components with [Color.ToRGBA()](lua://Color.ToRGBA).";
// Keep conflicting source claims explicit rather than silently upgrading them.
const padding = functions.find(fn => fn.owner === "ClientUIGridScrollerControl" && fn.name === "GetPadding");
padding.status = "uncertain";
padding.note = "The new library declares top/bottom/left/right; official 2026-08-25 update notes declare left/right/top/bottom. Component order remains unconfirmed.";
for (const name of ["GetSiblingIndex", "SetSiblingIndex"]) {
  const fn = functions.find(fn => fn.owner === "ClientUIBaseControl" && fn.name === name);
  fn.status = "uncertain";
  fn.note = "The new library says higher numeric indices render on top and the editor lists children in descending index order. The confirmed pixel demo reports earlier-created siblings above later-created siblings. Keep this conflict unresolved pending a targeted runtime test; do not infer stacking solely from numeric index.";
}
for (const name of ["SetSiblingIndex", "SetAsFirstSibling", "SetAsLastSibling"]) {
  const fn = functions.find(fn => fn.owner === "ClientUIBaseControl" && fn.name === name);
  fn.status = "uncertain";
  fn.note = [fn.note, "The library describes false for root containers but retains an 'Always true?' return annotation. Return behavior remains incomplete; the documented lifecycle restriction is before OnStart and during OnDestroy."].filter(Boolean).join(" ");
}
const order = ["Lua", "Lifecycle", "script", "game", "Color", "ServerSignal", "ClientUIBaseControl", "ClientUICursorEventAreaControl", "ClientUIPresetButtonControl", "ClientUIAnimationControl", "ClientUIGridScrollerControl", "ClientUIImageControl", "CursorEventData", "Tween", "TweenSequence"];
functions.sort((a, b) => (order.indexOf(a.owner) === -1 ? 999 : order.indexOf(a.owner)) - (order.indexOf(b.owner) === -1 ? 999 : order.indexOf(b.owner)) || a.name.localeCompare(b.name));
const data = { version: "7.1", gameVersion: "7.1", generatedAt: "2026-10-12", sourceDocument: "References/miliastra-lua-api/library (7.1), supplemented by prior declarations and confirmed runtime demos; unresolved source conflicts are retained in notes", functions, properties, types, enums };
const docsDir = path.join(root, "Docs");
localizeDocs(data);
resolveEditorAliases(data);
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, "MiliLua_API_Data.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log(`Generated ${data.functions.length} functions, ${data.properties.length} properties, ${data.types.length} types, and ${data.enums.length} enum groups.`);
