// All referenced API declarations are already imported from the local library.
// Convert upstream links to local symbols, and embed the two supplemental guides.
export function localizeDocs(api) {
  const rewrite = text => String(text).replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, address) => {
    const url = new URL(address);
    if (url.hostname === 'haminpants.github.io' && url.pathname.startsWith('/miliastra-lua-api/')) {
      const target = decodeURIComponent(url.hash.slice(1) || url.pathname.split('/').pop().replace(/\.html$/, ''));
      return `[${label}](lua://${target})`;
    }
    if (url.hostname === 'luals.github.io') return `[${label}](lua://guide-signal-types)`;
    if (url.hostname === 'interverse.github.io') return `[${label}](lua://guide-easing)`;
    throw new Error(`Unimported documentation reference: ${address}`);
  });
  for (const group of ['functions', 'properties', 'types', 'enums']) {
    for (const item of api[group]) {
      for (const key of ['description', 'note']) if (item[key]) item[key] = rewrite(item[key]);
      for (const value of [...(item.params || []), ...(item.returns || [])]) value.description = rewrite(value.description || '');
    }
  }
  api.guides = [
    { id: 'guide-signal-types', title: 'Typed signal parameters', description: 'LuaLS annotations describe table shapes for editor completion and type checking. A class name can be used in parameter and return annotations; fields describe its members. These comments do not create runtime classes or convert signal values. For MiliLua, name the annotation class after your signal and declare its positional fields in the server contract’s order. Read received values by numeric index. Arrays use `Type[]`; `Type?` means the value may be nil.\n\n```lua\n---@class MySignal\n---@field [1] string\n---@field [2] integer\n---@field [3] Vector3[]\n\nscript:RegisterServerSignalHandler("MySignal", function(signalName, signalParams)\n    local positions = signalParams[3]\nend)\n```', attribution: 'Adapted from Lua Language Server annotation documentation and the bundled MiliLua signal declaration.' },
    { id: 'guide-easing', title: 'Easing preview', description: 'An easing curve maps elapsed time to progress. Linear advances at a constant rate. In accelerates from a slow start; Out slows toward the end; InOut combines both. Back, Bounce, and Elastic can reverse or overshoot. Pick a curve below to compare its shape. This local preview uses standard easing formulas and is illustrative; it does not measure the game runtime.', attribution: 'Local implementation using standard easing formulas; no external service is required.' }
  ];
}
