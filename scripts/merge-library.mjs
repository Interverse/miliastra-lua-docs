import fs from "node:fs";
import path from "node:path";

// Current declarations override older declarations, never confirmed runtime evidence.
export function mergeLibrary(root, data) {
  const directory = path.join(root, "References/miliastra-lua-api/library");
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith(".lua") ? [path.join(dir, entry.name)] : []);
  const upsert = (items, value, key) => {
    const index = items.findIndex(item => key(item) === key(value));
    if (index < 0) items.push(value); else items[index] = { ...items[index], ...value };
  };
  const doc = lines => lines.filter(line => /^---(?!@|\|)/.test(line)).map(line => line.replace(/^---\s?/, "")).join("\n").trim();
  const named = text => {
    const [, name, rest] = text.match(/^(\S+)\s+(.+)$/) || [null, text, "any"];
    const [type, ...description] = rest.split(/\s+#\s*/);
    return { name, type: type.trim(), description: description.join(" # ") };
  };
  for (const file of walk(directory)) {
    const source = path.relative(root, file).replaceAll("\\", "/");
    const lines = fs.readFileSync(file, "utf8").replace(/\r/g, "").split("\n");
    let comments = [];
    let currentClass = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const cls = line.match(/^---@class\s+(\S+)(?:\s*:\s*(.+))?/);
      if (cls) {
        const name = cls[1];
        currentClass = name;
        const fields = [];
        while (/^---@field\s/.test(lines[i + 1]?.trim() || "")) fields.push(named(lines[++i].trim().replace(/^---@field\s+/, "")));
        upsert(data.types, { name, parent: cls[2] || null, description: doc(comments), source }, item => item.name);
        if (name.startsWith("Enum.")) {
          const previous = data.enums.find(item => item.name === name);
          upsert(data.enums, { name, values: [...new Set([...fields.map(field => field.name), ...(previous?.values || [])])], description: doc(comments) || previous?.description || "", source }, item => item.name);
        } else for (const field of fields) upsert(data.properties, { owner: name === "Script" ? "script" : name, ...field, source }, item => `${item.owner}.${item.name}`);
        comments = [];
        continue;
      }
      // LuaCATS allows documentation blocks between fields of the same class.
      // TweenTarget uses this layout instead of contiguous field annotations.
      const field = line.match(/^---@field\s+(.+)/);
      if (field && currentClass) {
        const value = named(field[1]);
        const description = (value.description || doc(comments)).replace(/^#\s+(Only tweenable\b)/, '$1');
        upsert(data.properties, { owner: currentClass === "Script" ? "script" : currentClass, ...value, description, source }, item => `${item.owner}.${item.name}`);
        comments = [];
        continue;
      }
      const alias = line.match(/^---@alias\s+(\S+)(?:\s+(.+))?/);
      if (alias) {
        const values = [];
        while (/^---\|/.test(lines[i + 1]?.trim() || "")) values.push(lines[++i].trim().slice(4));
        const description = doc(comments).replace(/\*Aliases are not a feature[^*]*\*/g, '').trim();
        const aliasValues = (alias[2] ? alias[2].split(/\s*\|\s*/) : values).map(value => value.trim());
        upsert(data.types, { name: alias[1], parent: null, description, kind: 'editor-alias', aliasValues, source }, item => item.name);
        comments = [];
        continue;
      }
      if (line.startsWith("---")) { comments.push(line); continue; }
      const fn = line.match(/^function\s+(?:(\w+)([.:]))?(\w+)\(([^)]*)\)/);
      if (fn) {
        let owner = fn[1] || (/^On/.test(fn[3]) ? "Lifecycle" : fn[3] === "Color" ? "Color" : "Lua");
        if (owner === "Script") owner = "script";
        const old = data.functions.find(item => item.owner === owner && item.name === fn[3]);
        const params = comments.filter(item => item.startsWith("---@param ")).map(item => named(item.slice(10)));
        const returns = comments.filter(item => item.startsWith("---@return ")).map(item => {
          const [declaration, ...description] = item.slice(11).split(/\s+#\s*/);
          const match = declaration.match(/^(\S+)(?:\s+(.*))?$/);
          return { type: match[1], name: match[2] || "", description: description.join(" # ") };
        });
        const description = doc(comments);
        const status = comments.includes("---@deprecated") ? "deprecated" : /unknown|unconfirmed|not observed|not known/i.test(description) ? "uncertain" : old?.status === "demo-verified" ? "demo-verified" : "documented";
        upsert(data.functions, { owner, name: fn[3], separator: fn[2] || "", signature: `${fn[1] ? owner + fn[2] : ""}${fn[3]}(${fn[4]})`, description, params, returns, status, source, note: old?.status === "demo-verified" ? old.note : "" }, item => `${item.owner}.${item.name}`);
      }
      comments = [];
    }
  }
}
