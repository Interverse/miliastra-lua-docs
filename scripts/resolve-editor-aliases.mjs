// Extension-only aliases are import metadata, never public API types.
export function resolveEditorAliases(api) {
  const aliases = new Map(api.types.filter(type => type.kind === 'editor-alias').map(type => [type.name, type]));
  const underlying = name => {
    if (name === 'ApiType') return 'string'; // typeof returns a name, not the named object.
    const values = aliases.get(name).aliasValues;
    return values.length > 1 ? '(' + values.join('|') + ')' : values[0];
  };
  const rewrite = text => {
    let result = String(text || '').replace(/\bfun\s*\(/g, 'function(');
    // Redundant alias-only See entries are replaced by the concrete signature types.
    result = result.replace(/^[-*] \[[^\]]+\]\(lua:\/\/(\w+)\).*$/gm, (line, name) => aliases.has(name) ? '' : line);
    result = result.replace(/\*\*See:\*\*\s*(?=\n\s*\n|$)/g, '');
    for (const name of aliases.keys()) result = result.replace(new RegExp('\\b' + name + '\\b', 'g'), underlying(name));
    return result.trim();
  };
  const normalizeValue = value => {
    const original = value.type || '';
    if (original.includes('ApiType')) {
      value.allowedValues = aliases.get('ApiType').aliasValues.map(item => item.replace(/^"|"$/g, ''));
      value.description = [value.description, 'Returns the runtime type name as a string.'].filter(Boolean).join(' ');
    }
    if (original.includes('NormalizedPercentage')) value.description = [value.description, 'A number representing a normalized percentage (0–1); documented overscroll exceptions still apply.'].filter(Boolean).join(' ');
    if (original.includes('DecimalPercentage')) value.description = [value.description, 'An unbounded decimal percentage; 0.25 means 25%.'].filter(Boolean).join(' ');
    value.type = rewrite(original);
    value.description = rewrite(value.description);
  };
  for (const fn of api.functions) {
    fn.description = rewrite(fn.description);
    fn.note = rewrite(fn.note);
    for (const value of [...fn.params, ...fn.returns]) normalizeValue(value);
  }
  for (const property of api.properties) normalizeValue(property);
  api.types = api.types.filter(type => !aliases.has(type.name));
  for (const type of api.types) type.description = rewrite(type.description);
  for (const enumeration of api.enums) enumeration.description = rewrite(enumeration.description);
}
