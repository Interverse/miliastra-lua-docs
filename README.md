# MiliLua API Reference

A searchable reference for the Miliastra Wonderland 7.1 client Lua API, built with HTML, CSS, and JavaScript.

## Features

- Functions, properties, types, and grouped enum values.
- Search that prioritizes function names while retaining description matches.
- Clickable enum references that reveal their values without clearing your search.
- Light and dark themes with responsive layouts.

## View locally

Open `index.html` in your browser. No installation or build step is required.

## Project files

- `index.html` — page structure.
- `styles.css` — layout and themes.
- `app.js` — embedded API data, search, and documentation rendering.
- `i18n.js` — shared language preference and interface translations.
- `locale-content.js` — offline documentation and example translations.
- `locale-overrides.json` — reviewed translation corrections.
- `locale-terms.json` — translated documentation terminology.
- `share.js` — link creation, collection selection, and link restoration.
- `share-ids.js` — permanent numeric IDs for compact collection links.
- `toolbar.js` — animated search and sharing controls in the scrolling toolbar.
- `scripts/` — documentation generation utilities.

## Hosting

Serve `index.html`, `styles.css`, `app.js`, `i18n.js`, `locale-content.js`, `share-ids.js`, `share.js`, and `toolbar.js` together with any static website host.

## Share references

Use the share icon beside Copy in a method header to share its complete documentation section. The link icon beside the search field copies the current search, including while creating a selection. Choose **Create selection link**, select individual sections or **Select all shown methods**, then use **Copy selection link**. Selection mode has one copy action, in the same position in the page and toolbar. The selection button in a popup also adds its section while selection mode is active.

On desktop, hover or focus a section to reveal its left-edge checkbox. Choosing a section starts selection mode and accents its border. On touch devices, **Create selection link** reveals persistent 44-pixel selection controls; hover is not required. Methods, types, enums, and guides can be selected this way.

Selection links show only the complete linked sections, including descriptions, arguments, returns, and expandable notes. Click **Clear selection** to remove the selection and return to the full reference. Search within a shared selection remains scoped to that selection; its search link preserves both the selection and query. Existing example links still resolve to their corresponding method section.

Single references use `#r=game-TweenSequence&lang=en`; searches use `#q=Tween&lang=en`. Selections (including one-section selections) use `#s=1b.…` or `#s=1d.…`, choosing the shorter bitmap or delta encoding. Links work without a server and include a temporary language override that does not overwrite the reader’s saved preference. The earlier `?ref=…&lang=…` format is also accepted.

Links use separate readable fields grouped by owner or kind (for example, `Lifecycle=OnUpdate,OnStart&Tween=Play&type=Vector3`) when the complete URL is at most 500 characters. Longer selections use compressed `s` links. Both formats preserve language and search; existing compressed links remain supported.

`share-ids.js` must remain append-only: never reorder or remove IDs. `scripts/generate-share-ids.mjs` appends new API entries while preserving published links; the standalone generator runs it automatically.

## Update translations

With the local preview running on port 8765, run `node scripts/collect-localization.cjs`, then `python scripts/build-localization.py`. The build retrieves translations of the public documentation; the website uses only local catalogs. API identifiers and strings used for control lookups, signals, and resource keys remain unchanged.

Edit `locale-overrides.json` for translation corrections, then run `python scripts/build-localization.py --offline` and `node scripts/generate-standalone-docs.mjs` to rebuild without a translation service.
