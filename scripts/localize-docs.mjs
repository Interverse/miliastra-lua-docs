// All referenced API declarations are already imported from the local library.
// Convert upstream links to local symbols, and embed the two supplemental guides.
export function localizeDocs(api) {
  const rewrite = text => String(text).replace(/To get typed signal parameters,[\s\S]*?```lua[\s\S]*?```/g, '').replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, address) => {
    const url = new URL(address);
    if (url.hostname === 'haminpants.github.io' && url.pathname.startsWith('/miliastra-lua-api/')) {
      const target = decodeURIComponent(url.hash.slice(1) || url.pathname.split('/').pop().replace(/\.html$/, ''));
      return `[${label}](lua://${target})`;
    }
    if (url.hostname === 'luals.github.io') return '';
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
    { id: 'guide-easing', title: 'Easing preview', description: 'An easing curve maps elapsed time to progress. Linear advances at a constant rate. In accelerates from a slow start; Out slows toward the end; InOut combines both. Back, Bounce, and Elastic can reverse or overshoot. Pick a curve below to compare its shape. This local preview uses standard easing formulas and is illustrative; it does not measure the game runtime.', attribution: 'Local implementation using standard easing formulas; no external service is required.' }
  ];
}
