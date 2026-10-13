import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const api = JSON.parse(fs.readFileSync(path.join(root, "Docs", "MiliLua_API_Data.json"), "utf8"));
const confirmedDemoDir = path.join(root, "References", "Confirmed Demos");
const demoFiles = fs.existsSync(confirmedDemoDir)
  ? fs.readdirSync(confirmedDemoDir).filter((name) => name.toLowerCase().endsWith(".lua")).sort()
  : [];
const demos = demoFiles.map((name) => ({ name, source: fs.readFileSync(path.join(confirmedDemoDir, name), "utf8").replace(/\r/g, "").trim() }));
const out = [];
const write = (...lines) => out.push(...lines);

write(
  "# MiliLua Consolidated API Reference",
  "",
  `API document ${api.version} · Game ${api.gameVersion} · Consolidated ${api.generatedAt}`,
  "",
  "This is the canonical single-file reference for generating and reviewing MiliLua scripts. It combines the official Chinese Client Control API (translated using its official English terminology), the 7.1 declarations in References/miliastra-lua-api/library, signature inventory, runtime findings, and confirmed demos. Prefer demo-verified behavior when sources disagree. New library descriptions are documented claims, not newly verified runtime tests, even on methods already exercised by demos.",
  "",
  "## Contents",
  "",
  "- Functions by API category",
  "- Properties and native types",
  "- Enums and discovered values",
  "- Runtime-tested patterns",
  "- Known unknowns and constraints",
  "- Confirmed working demos",
  "",
  "## Confidence labels",
  "",
  "- **Demo verified**: directly exercised by the working demo.",
  "- **Documented**: described by the official API or another structured reference.",
  "- **Incomplete**: signature exists, but behavior or some types remain unknown.",
  "- **Deprecated**: present but believed unused.",
  "",
);

for (const owner of [...new Set(api.functions.map((entry) => entry.owner))]) {
  write(`## ${owner}`, "");
  for (const fn of api.functions.filter((entry) => entry.owner === owner)) {
    write(`### \`${fn.signature}\``, "", `**${fn.status === "uncertain" ? "incomplete" : fn.status.replace("-", " ")}** — ${fn.description}`, "");
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

write(
  "## Runtime-tested patterns",
  "",
  "### Delayed callback",
  "",
  "Use an empty Tween as a scheduler. Timing is frame/scheduler dependent, so use it for sequencing rather than precise deadlines.",
  "",
  "```lua",
  "local function after(target, seconds, callback)",
  "    return game.Tween(target, {}, seconds)",
  "        :SetOnComplete(callback)",
  "        :Play()",
  "end",
  "```",
  "",
  "### Repeating work",
  "",
  "Prefer `OnUpdate(deltaTime)` and an elapsed-seconds accumulator for new timers, repeated work, and periodic signals. Enable updates with `script:EnableUpdate(true)` in `OnStart` and disable them during cleanup. A requested 0.1-second check is an accumulator threshold, not the frame callback frequency. Batch independent expired timers into one signal and choose catch-up behavior explicitly. The confirmed `tween_ontick_counter.lua` demo instead chains empty Tweens; retain and kill those Tweens when maintaining that demo. Hidden controls continue running attached scripts and Tween callbacks.",
  "",
  "### Module loading and host-aware types",
  "",
  "An external runtime report confirms that `require(moduleName)` loads a Lua script mapped in the Client Script Resource Explorer. Every imported script must be mapped there, although the mapping name does not need to match the imported file name. The custom `typeof(value)` function can return a more specific host-aware type name than Lua's built-in `type(value)`. Broader introspection remains restricted by the sandbox.",
  "",
  "### Custom Variable access and change handling",
  "",
  "External runtime usage confirms the three available contexts are `Enum.CustomVariableEntityType.Level`, `PlayerSelf`, and `AvatarSelf`.",
  "",
  "```lua",
  "local value = game.GetGlobalCustomVariableValue(",
  "    Enum.CustomVariableEntityType.Level,",
  "    \"VariableName\"",
  ")",
  "",
  "local function onChanged(entityType, variableName)",
  "    local newValue = game.GetGlobalCustomVariableValue(entityType, variableName)",
  "end",
  "",
  "function OnInit()",
  "    script:RegisterCustomVariableChangedHandler(",
  "        Enum.CustomVariableEntityType.Level,",
  "        \"VariableName\",",
  "        onChanged",
  "    )",
  "end",
  "",
  "script:UnregisterCustomVariableChangedHandler(",
  "    Enum.CustomVariableEntityType.Level,",
  "    \"VariableName\"",
  ")",
  "```",
  "",
  "### Text field appending",
  "",
  "The confirmed `append_text_over_time.lua` demo attaches to a `ClientUITextBoxControl`, reads its current `text`, appends `1234567890`, and schedules the next append with an empty Tween. Its interval is configurable; the current confirmed demo uses 0.1 seconds. Retain the Tween and stop it in `OnDestroy`.",
  "",
  "### Batched layered pixel rendering",
  "",
  "Visual stacking follows the displayed child hierarchy from top to bottom: Child 1 renders above Child 2, and Child 2 above Child 3. The confirmed pixel demo observes earlier-created siblings above later-created siblings. Do not equate a larger numeric sibling index with a higher visual layer; its mapping to displayed order is not confirmed here.",
  "",
  "The confirmed `1629-sucrose-ill-be-good_normalized_pixels.lua` demo streams a large ordered square set, instantiates only a bounded batch per scheduler callback, normalizes source coordinates before scaling, and reverses creation order to compensate for sibling draw order. Its parent can be animated independently with a perpetual position/rotation Tween.",
  "",
  "### Cursor coordinates",
  "",
  "A confirmed cursor handler can read `GetPressUIPos()`, `GetUIPos()`, and `GetUIPosDelta()` from the event payload. On `CursorDrag`, the press position remains fixed, the current position follows the cursor, and the delta is the current position minus the initial press position.",
  "",
  "### Dynamic UI instantiation",
  "",
  "The confirmed `instantiate_image_ontick.lua` demo shows that `game.InstantiateClientUIControl(index, parent)` returns the instantiated control when successful. The returned Image can be positioned directly with `SetAnchoredPosition`. With `game.GetUICanvasSize()`, centered anchored coordinates can be randomized as `(math.random() - 0.5) * width` and `(math.random() - 0.5) * height`. A failed instantiation returns `nil` in the confirmed demo.",
  "",
  "### Smooth held-key movement",
  "",
  "The confirmed `wasd_move_instantiated_image.lua` demo stores WASD key-down/up state, retargets a Linear Tween on direction changes, and kills the previous Tween before starting the next one. It normalizes simultaneous horizontal and vertical input for diagonal movement, clamps the Image to centered canvas bounds using its measured size when available, and falls back to editable width/height constants when size measurement is unavailable.",
  "",
  "### Tween-driven Pong loop",
  "",
  "The confirmed `pong.lua` demo instantiates two paddles and a ball, retrieves their dimensions with `GetSizeDelta()`, and uses `GetLocalRotation()` to swap width and height for a control rotated near 90 degrees. It advances the ball with one Linear Tween per predicted wall, paddle, or scoring-edge event instead of recursively completing zero-duration callbacks. Paddle overlap is checked when the ball reaches the paddle plane so moving controls use their current positions. Held W/S state drives the player paddle, the opposing paddle is Tween-driven, and a missed ball is destroyed and recreated after an empty-Tween delay. Active Tweens and key listeners are cleaned up in `OnDestroy()`.",
  "",
  "### Cursor-launched ball-pit simulation",
  "",
  "The confirmed `thousand_bouncing_balls.lua` demo incrementally instantiates 300 Images, simulates gravity and mass-aware circular collisions with a spatial grid, and uses supported/resting contact state to stabilize stacked balls. Cursor screen coordinates from `GetUIPos()` are converted to centered anchored coordinates by subtracting half the UI canvas width and height. CursorDown, CursorDrag, CursorUp, and CursorEndDrag drive a capped launcher; red instances of the same ball template visualize its origin and predicted gravity arc. Released balls join the same physics list. Adaptive substeps and segment-sweep tests preserve unusually high-speed impacts without applying the expensive swept test to every resting ball. The scheduler Tween, cursor listeners, previews, and instantiated controls are retained and cleaned up in `OnDestroy()`.",
  "",
  "### Input composition",
  "",
  "Key-down/up callbacks plus Lua local state can implement held combinations, double taps, combo windows, long holds, and client-side cooldown gates. Tested examples include Sprint + Jump, a roughly 0.165-second forward double tap, Attack → Skill 1 around 0.3 seconds, and a roughly 1.54-second Skill 1 hold.",
  "",
  "### Modal input capture",
  "",
  "Set `container.disableKeyEventPassthrough = true` and `container.showCursor = true`. Script listeners inside the container continue receiving input while normal gameplay input is suppressed in the tested setup.",
  "",
  "### Client/server signaling",
  "",
  "Create a signal with `game.ServerSignal(name)`, append typed values with `AddInt`, `AddEntity`, `AddFloat`, `AddBool`, `AddString`, `AddVector3`, or `AddGuid`, then call `SendSignal()`. A Tween callback can send without new player input. Receive server replies with `script:RegisterServerSignalHandler`; the server return path must target the correct Player.",
  "",
  "### TweenSequence confidence",
  "",
  "The four previously flagged `TweenSequence` methods now have concrete lifecycle descriptions. Their earlier demo-verified labels were false positives caused by matching similarly named methods in ordinary `Tween` demos; no dedicated TweenSequence demo is currently present.",
  "",
  "### Per-frame updates",
  "",
  "The 7.1 API uses `script:EnableUpdate(true)` to enable `OnUpdate(deltaTime)` and `OnLevelUpdate(deltaTime)`. The earlier `script:EnableTick(true)` spelling is retained only as a legacy runtime finding for older builds; use `EnableUpdate` with the current 7.1 API. `deltaTime` is the elapsed time supplied for that update. Disable the feature with `script:EnableUpdate(false)` when per-update work is no longer needed.",
  "The official Client Control API documents `OnLevelUpdate(deltaTime)`, level-time controls, 2D audio instance IDs, stage/test queries, complete UI properties, callback contracts, controller navigation, and enum groups. These entries are official/documented; treat behavior not exercised by a confirmed demo as runtime-unverified.",
  "",
  "### 7.1 controller menu key events",
  "",
  "`Enum.KeyEventType` now includes `ControllerMenuConfirmKeyDown`, `ControllerMenuBackKeyDown`, `ControllerMenuConfirmKeyUp`, and `ControllerMenuBackKeyUp`. Their key-event callbacks receive zero arguments. Do not hardcode `Enum.KeyEventType` numeric values because these additions shifted several controller `KeyUp` values.",
  "",
  "### 7.1 Grid Scroller update",
  "",
  "`itemPrefabIndex` replaces `itemPrefabId`. `scrollProgress` is read/write and Tweenable; the new library documents values outside 0-1 during overscroll, so do not assume reads always stay normalized. `GetItemSize()` returns width and height, while `GetItemSpacing()` returns horizontal and vertical spacing. `GetItemIndex()` returns -1 for unmanaged controls. `RefreshItems()` destroys existing items, instantiates replacements, and triggers their lifecycle callbacks. The new package conflicts on `GetPadding()` ordering: the update notes say left/right/top/bottom, but the bundled declaration says top/bottom/left/right. Treat the padding component order as incomplete until runtime verification resolves it.",
  "",
  "### New miliastra-lua-api declaration details",
  "",
  "These are documented library claims, not new local runtime confirmations. Custom Variable handlers fire even with Trigger Event disabled, including list/dictionary mutations, clearing already-empty collections, and nested structure changes. Variables must exist in the entity's Custom Variable component; reread the value because callbacks contain no before/after values.",
  "",
  "For split anchors, the anchor point is interpolated between anchorMin and anchorMax using the control's pivot percentage on that axis. Anchored position is the pivot offset from that point; sizeDelta is the size offset from anchor bounds. Cursor coordinates use the canvas bottom-left origin; controller canvas dimensions deduct safe-area padding. Controller stick axes range from -1 to 1. touchId is documented as -1 for cursor clicks and 0-4 for mobile gestures.",
  "",
  "Sibling reordering throws before OnStart or during OnDestroy. The library says higher indices draw on top, while the confirmed pixel demo reports earlier-created siblings above later-created siblings; retain the conflict pending a focused runtime test. The library also retains ambiguous return annotations on sibling setters. Duplicate child names/paths resolve by descending sibling index in the library. Client Controls are recreated during loading screens, so reacquire native references after reload.",
  "",
  "Numeric signal-list adders reject non-sequence fields and nonnumeric values. Typed LuaLS signal annotations affect editor tooling, not runtime payload conversion. Global-script OnDestroy may not execute before client disconnect; avoid relying on it for guaranteed final server messages. TweenSequence loop counts can only be set in Initial state, play at least once, and loop indefinitely for negative values.",
  "",
  "### Script lifecycle",
  "",
  "Initialize listeners and UI state in `OnStart`. Remove registered signal and event handlers and kill retained Tweens in `OnDestroy`. Immediately before `OnInit`, top-level Lua functions are exposed as Script methods. The wrapper and original function do not have the same identity. Call a wrapped function by name with `script:Invoke(\"functionName\", ...)`; calling `Invoke` before `OnInit` reports that it is unavailable.",
  "",
  "An external runtime report observed startup in this broad order: global `OnInit`; each object script's global context, `OnInit`, `OnEnable`, and `OnStart`; then global `OnEnable` and `OnStart`. It reported shutdown beginning with global `OnDestroy`, followed by object disable and destroy processing. Treat this exact cross-script ordering as reported behavior rather than a locally confirmed guarantee.",
  "",
  "Callbacks can execute immediately. A reported active-state toggle cycle recursively retriggered `OnEnable` until the runtime raised its callback nesting error after 32 calls. Lifecycle and completion callbacks should therefore schedule or guard work that could retrigger the same callback.",
  "",
  "## Known unknowns and constraints",
  "",
  "- Host tables and userdata do not enumerate usefully with `pairs` or `next`.",
  "- Tested native userdata returned no useful metatable through `getmetatable`.",
  "- `typeof` exposes useful host-aware type names, but broader debug reflection functions were unavailable.",
  "- No confirmed direct API for local player/character access, world or scene lookup, non-UI transforms, camera, physics, or raycasts.",
  "- `script:GetParam` documents mapped Script Variable reads; broader Script Variable Manager access, full signal payload serialization, and controller/mobile runtime verification remain incomplete.",
  "- The official Grid Scroller callback shape, content-length direction, and scroll enum members are documented; `GetPadding()` component order is incomplete because the 2026-08-25 official sources conflict.",
  "- The 7.1 declaration library reports no new direct world, entity, or physics API and no expansion of `game` or `ServerSignal`.",
  "- Use only enum members present in the official/structured inventory; do not infer aliases from display labels or physical-key descriptions.",
  "- Native values are commonly `userdata` even where editor annotations use Lua-shaped stand-ins.",
  "",
  "## Confirmed working demos",
  "",
);

for (const demo of demos) {
  write(`### \`${demo.name}\``, "", "```lua", demo.source, "```", "");
}

const destination = path.join(root, "References", "MiliLua_API_Consolidated.md");
write("## Local guides", "");
for (const guide of api.guides || []) write(`### ${guide.title}`, "", guide.description, "", guide.attribution, "");
fs.writeFileSync(destination, `${out.join("\n")}\n`);
console.log(`Wrote ${destination} (${out.length} blocks).`);

