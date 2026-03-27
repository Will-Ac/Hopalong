# Development Guide

## 1. How to run

This app is designed to run as a static site, so the normal usage model is simple:

- Open the site through GitHub Pages, or any static file server that serves the repository contents.
- The app initializes from ES modules plus `data/defaults.json`, so use a modern browser or static server that supports module loading.
- If you are checking a freshly deployed version and the browser seems stuck on older code, add a cache-busting query string such as `?v=XYZ`.

Example:
- `https://<your-pages-site>/Hopalong/?v=XYZ`

## 2. PR workflow

Keep changes small and easy to review.

Architecture is code-driven: the source modules in `js/` and the docs in `docs/` are the maintained sources of truth. Do not reintroduce a separate spec folder or duplicate architecture details in parallel files.

Recommended workflow:
1. Make one focused change per PR.
2. Reload the app and test the affected controls before merging.
3. Update the visible version badge when the PR intentionally changes the shipped build.
4. Use the badge/query-string pair together so reviewers can confirm they are testing the right build.

The version badge is a lightweight visual check, not a release system. It helps reviewers confirm which PR build they are looking at. The badge is shown in the top-left of the UI.

Startup parameter values for `a`–`d` are derived from formula defaults rather than fixed slider values when the app starts without URL or restored state.

Generated share URLs do not include a version parameter.

Compact share URL schema:

- `f` = formula id
- `m` = colour map name
- `a`, `b`, `c`, `d` = derived formula parameters
- `i` = iterations
- `cx` = shared world-space centre X
- `cy` = shared world-space centre Y
- `ms` = world-space span across the sender's smaller viewport dimension
- `ar` = sender viewport aspect ratio used only to rebuild the sender's full visible bounds without cropping
- `rot` = shared viewport rotation in radians (optional, defaults to `0`)
- `rm` = render color mode (omitted when using the default mode)
- `bg` = background color (simple name or hex without `#`, omitted when using the default background)

Burn is no longer included in share URLs and is fixed internally to a default value.

Shared view framing is device-independent. The sender stores `cx`, `cy`, and `ms`, where `ms` is the visible world span across the sender's smaller viewport dimension at share time. A compact `ar` value stores only the sender's aspect ratio so the receiver can rebuild the full sender-visible world bounds without sending device size, scale, or DPR. Receivers then fit those bounds into their own canvas, so they will reproduce at least the sender's full visible area and may reveal extra area.

Share parsing remains backward compatible with older URLs, including older links that still contain `burn`, `formula`, `cmap`, `iters`, `zoom`, `offsetX`, `offsetY`, or other legacy keys. Legacy burn values are ignored.


Shared URLs are consumed on load and then removed from the address bar.

After both fresh load and shared-state load, the app enters an interaction-ready mode with randomised controls enabled where applicable, `a` mapped to `ManY`, `b` mapped to `ManX`, and the interest overlay turned off. Shared URLs still reproduce the visual state first, before these interaction-mode overrides are applied.

Share dialog uses the Web Share API where supported. When file sharing is supported, it shares both the generated URL and a thumbnail of the current visible pattern. If file sharing is not supported, it falls back to URL-only sharing. If the Web Share API is unavailable, it falls back to copying the link to the clipboard. The QR code and share action both use the same generated URL.

## Debug overlay notes (PR25)

- Debug overlay visuals (axes, grid lines, tick/scale labels, and debug text) use a red palette so they are visually distinct from the interest overlay.
- Debug text now has its own setting (`Show debug text`) under **Debug overlay**; turning it off hides the left diagnostics text while keeping the debug grid/axes active.
- During active pan/zoom, debug axes/grid/scale redraw live from the current viewport state instead of waiting for gesture end.

## View rotation notes (PR26)

- The viewport now supports two-finger rotation gestures alongside existing pinch zoom and pan.
- Rotation is implemented in viewport/world mapping math (`screen ↔ world`) rather than rotating the canvas element.
- Debug axes, grid lines, and tick labels use the same rotated mapping basis, so overlay alignment stays logically consistent with the rotated view.
- Attractor formulas and attractor iteration maths are unchanged; rotation only affects view-space mapping.

## Rotation behaviour fixes (PR26.2)

- Cached interaction preview now applies live rotation during active two-finger gestures, so the pattern rotates immediately (not only after gesture end).
- Rotation metadata is preserved through the final cropped frame metadata path, so debug axes/grid stay aligned after gesture release.
- Formula changes now reset viewport rotation back to `0` radians.

## Rotation activation threshold (PR27)

- Two-finger gestures now accumulate absolute rotation deltas from gesture start and only enable rotation once the cumulative total passes an activation threshold.
- The activation threshold is user-adjustable in **Settings** with **Rotation threshold (°)**.
- The threshold is stored in degrees for UI clarity and converted to radians for gesture logic.
- Setting the threshold to `0°` disables accidental-rotation protection and keeps rotation active immediately (legacy PR26 behaviour).

## Settings access and defaults (PR28)

- Settings now have two access modes:
  - **Normal tap** on the gear button opens a simplified settings view.
  - **Long press for more than 5 seconds** on the gear button opens the hidden full developer settings view.
- The simplified settings view intentionally exposes only one control: **Show X & Y axes**.
- The simplified **Show X & Y axes** control maps directly to the existing debug overlay visibility setting (same stored value).
- The hidden full settings view still contains all existing controls and advanced options unchanged.
- Default **Dialog transparency** is now `0.5` (50%).

## Desktop input update (PR29)

- On desktop, hold **Shift** and drag with the primary mouse button to rotate the view from horizontal drag movement.
- Desktop input mapping remains:
  - normal left drag = modulation
  - right drag = pan
  - scroll/wheel = zoom
- **Show debug text** now defaults to OFF for fresh/default state.

## Welcome + guided help onboarding (PR30)

- First-run startup now shows a large welcome panel with a short plain-language summary of what the app does.
- The welcome panel has **Take tour**, **Don’t show me again**, and **Continue** actions.
- **Don’t show me again** is stored locally in `localStorage` and suppresses future automatic startup display.
- **Take tour** starts a guided mode that steps through help overlay items one at a time using **Next** and **End tour** controls.
- The guided sequence reuses the existing help overlay and placement logic, instead of creating a separate positioning system.
- A new canvas help item was added with device-specific input text:
  - desktop: wheel/right-drag/shift-drag/left-drag controls
  - touch: two-finger pinch/drag/rotate and one-finger drag controls

## Onboarding fixes (PR30.2)

- Welcome title now reads **AttractorLab**.
- Guided tour steps now support grouped help activation so context can stay visible:
  - step 1 shows tap-right with the center divider context
  - step 2 shows tap-left with tap-right + center divider context
- Tour step controls now render as a help-overlay item and use the same help placement policy engine (top-middle preferred with normal fallback handling).
- Final tour step now reliably shows the new device-specific canvas help panel.

## Onboarding/tour refinements (PR30.3)

- Splash copy was updated to the new single-line attractor description while keeping the **AttractorLab** title unchanged.
- Guided tour step content was tightened so:
  - step 1 shows only tap-right plus the center divider
  - step 2 shows only tap-left plus the center divider
- Guided placement was refined so steps 3–5 (Parameters, Slider, Border) prefer low placement above the slider area using help policy overrides.
- Top button help wording now reads **save / share image**.
- Tour guide dialog is now a compact title-and-controls panel (Previous / Next / End tour) placed via the same help placement policy system on the right-middle side.

## Onboarding, tour, and rotation fixes (PR30.4)

- Updated onboarding splash copy to the latest welcome wording while keeping the existing panel style and structure.
- Refined tour placement:
  - tour dialog now prefers right-side, vertically centered policy placement
  - slider help (step 4) is policy-overridden to stay close to the quick slider
  - canvas help (step 9) now prefers centered placement
- Step 1 is explicitly forced to show tap-right plus center divider in guided mode.
- Rotation threshold defaults were adjusted to `15°` with a maximum setting of `30°`.
- Fixed rotated-view pan commit alignment so post-redraw position remains consistent with live gesture movement.
- Randomize/new-image flow now restores auto scale mode so the newly generated image re-centers predictably.

## Tour/footer and mobile help overlap fixes (PR30.5)

- Tour footer now keeps fixed button slots in a stable left-to-right order: **Previous**, **End tour**, **Next**.
- Step 1 and Step 2 guided help now explicitly show divider + one-side tap guidance:
  - step 1: center divider + tap right
  - step 2: center divider + tap left (no tap right)
- Mobile help overlay now correctly applies deeper shrink-to-fit fallback when no free placement is found, reducing overlap without global text-size reduction.

## Tour position refinements (PR30.6)

- Guided step 1 and step 2 canvas tap labels now use centered vertical placement, keeping their label centers aligned to screen center.
- Divider positioning in forced single-side tour steps now anchors to the active tap label center so step 1/2 divider alignment matches the tap guidance.
- Canvas help preferred placement is now centered using the same help placement policy system.

## Canvas help centring fix (PR30.7)

- Canvas help preferred placement now uses a true centered policy target, with nearest-to-center fallback offsets when overlap prevents exact center placement.

## Mobile guided help and rotation fixes (PR33.1)

- `?` help mode selection now uses device-type detection:
  - phones (`iPhone`, or `Android` with `Mobile` in user-agent) open the guided tour
  - tablets/desktops keep the full help overlay behaviour
- Guided help placement was refined with policy updates:
  - `tour-step` prefers right-side near vertical middle, with lower/right-side fallbacks
  - step 3 (`params`) and step 5 (`tile-border-legend`) placement overrides now prefer low positions near the quick slider, with normal policy fallback
  - placement now enforces a left boundary so help labels do not render left of the leftmost bottom tile anchor
- Settings panel placement was tightened so the main settings panel (`#rangesEditorPanel`) always opens below the top button bar instead of bottom-docked mobile placement.
- Default `touchZoomRatioMin` is now `0.01` (including bundled defaults and runtime fallback default).
- Desktop rotated modulation mapping was fixed by keeping mouse left-drag modulation screen-aligned after Shift-drag rotation, while preserving the existing touch modulation mapping path unchanged.

## Large-screen full-help placement refinements (PR33.2)

- Large-screen full-help policy placement was refined for:
  - tap group (`tap left`, `tap right`, and center dashed divider context)
  - canvas help
  - slider help
  - params help
- The centered tap group now takes priority in full-help large-screen mode so left/right guidance remains centered around the screen centreline.
- Canvas help now prefers a centered-above position so it stays above the tap group instead of competing for the same central zone.
- Slider and params help now prefer placement just above the quick slider area in full-help large-screen mode.

## Branding and lower help pair refinement (PR33.3)

- User-facing onboarding branding now reads **Attractor Lab** (with a space).
- In large-screen full-help mode, slider and params preferred placement was refined as a lower left/right pair near the quick slider:
  - slider help prefers lower-left of center
  - params help prefers lower-right of center
- Both still use the existing policy system and fallback/overlap handling.

## Rotation layer alignment fix (PR33.5)

- Rotation interaction now keeps the rendered pattern layer and XY/grid/debug overlays aligned during live interaction by using one consistent rotation-aware view transform basis for both cached-frame draw and overlay metadata.
- Committed redraw now keeps crop/view metadata consistent with the live rotation-aware path, avoiding post-gesture jump/re-alignment between pattern and overlay layers.

## Rotation pivot and Auto Scale icon update (PR33.6)

- Touch two-finger rotation now pivots around the midpoint between the two active touch points.
- Desktop Shift-drag rotation now pivots around the screen center.
- The shared rotation-aware alignment path between pattern and XY/grid/debug overlays from PR33.5 is preserved.
- Auto Scale now uses a fit-to-screen icon (four outward diagonal arrows) in the top button bar, and the matching small icon shown in help content updates automatically from that same button SVG.

## Slider live sync and panel stability (PR33.7)

- During manual screen modulation, if the currently open quick slider matches a modulated parameter, the quick slider thumb and displayed numeric value now update live.
- Quick slider `+` and `−` step buttons were enlarged by ~50% for easier interaction.
- Quick slider panel positioning now stays anchored to its CSS bottom position (no runtime bottom-offset shifting).

## Touch modulation + rotation-threshold refinement (PR33.8)

- Touch manual modulation deltas are now kept screen-aligned even after view rotation, so finger drag direction maps directly to crosshair movement direction on screen.
- Touch two-finger rotation activation now uses net angle change from gesture start (`startAngle`) instead of accumulated per-frame absolute jitter, reducing accidental rotation activation during pan/zoom.

## Factory reset and UI refinements (PR33.9)

- Added a **Factory reset** button at the bottom of the full/developer settings panel.
- Factory reset clears app-owned persisted local state (namespaced `hopalong.*` keys, including defaults, parameter modes, and onboarding/help suppression flags) and then reloads the app to start clean.
- Rotation threshold default is now `15°`.
- Quick slider `+ / −` buttons were reduced to 80% of their previous PR33.7 size, and top spacing in the slider box above controls was tightened.
- On mobile-sized layouts, formula and colour-map tile text now truncates with ellipsis to avoid edge overlap.

## 3. Common pitfalls

### State grouping errors
A major maintenance risk in this codebase is putting data in the wrong state group.

Examples:
- render-related values belong in `renderState`
- UI-only values belong in `uiState`
- live gesture/pointer values belong in `overlayState`

If state is stored in the wrong group, follow-on code may read from the expected object and silently use stale or missing values. This is the kind of issue that can happen after refactors like the PR9 grouping work.

### Destructuring mistakes
Several modules are initialized by passing a large options object. That is convenient, but it also means a missing property name or wrong callback name can break features without changing the module itself.

When debugging:
- check the argument name in the caller
- check the destructured name in the module
- make sure both sides still match exactly

### Browser caching problems
This project is easy to cache aggressively because it is a static web app.

If a fix does not appear:
- hard refresh first
- open DevTools and disable cache while testing
- add `?v=XYZ` to the URL
- confirm the on-screen version badge matches the build you expect

## 4. Debugging guide

### Use the console first
Open browser DevTools and watch the Console during startup and after each interaction.

Useful things to look for:
- module or JSON import failures during startup
- syntax errors that stop module loading
- undefined function or property access errors
- warnings from shared-state parsing

### Identify syntax errors quickly
A syntax error usually stops the affected module from loading at all.

Good checks:
- note the file name and line number reported by the browser
- reload after every fix rather than stacking multiple edits
- if the app fails very early, start with `main.js` imports and recent edits

### Isolate module issues
Because the app is split by responsibility, debugging is easier if you narrow the problem to one subsystem.

A simple approach:
- if rendering is wrong, inspect `renderer.js` inputs and returned metadata
- if panels are wrong, inspect `uiPanels.js` open/close and layout behaviour
- if help labels are wrong, inspect `helpOverlay.js` target selectors and layout timing
- if export is wrong, inspect `exportManager.js` getters and export-size calculations
- if back/forward or shared URLs are wrong, inspect `historyState.js`
- if overlay highlights are wrong, inspect `interestOverlay.js` plan inputs and cache keys

When in doubt, log the smallest possible state snapshot near the handoff between modules. That usually shows whether the bug is in the producer or the consumer.

### Interest Overlay (Worker-based)

- Overlay computation runs in `js/interestOverlayWorker.js`.
- Main-thread coordination lives in `js/interestOverlay.js`.
- `interestOverlay.js` owns scheduling, scan-key validation, cache application, redraw, and worker lifecycle.
- The worker receives a job payload, runs the heavy scan, and posts progress/result messages back.
- The interest overlay worker now combines step 1 (Lyapunov gate) and step 2 (high-interest refinement) in a single row-wise pass instead of doing a separate global refinement phase.
- Step 1 now supports conservative early exit: it can stop early when the running Lyapunov evidence is already clearly below or above the threshold, and only uncertain cells run the full step-1 iteration budget.
- Progressive worker updates are now posted row-by-row with the row's medium-interest cells and high-interest upgrades together, so the overlay draws progressively by completed rows rather than by individual cells.
- The advanced `High interest threshold` setting is passed from the detailed settings UI into the worker job payload and only affects the step 2 refinement score cutoff.

If the overlay fails:
- check the browser console first
- check for worker load errors
- check message passing between `interestOverlay.js` and `interestOverlayWorker.js`
- check for `jobId` / `scanKey` mismatches that cause stale results to be ignored

Notes:
- Worker errors appear in the DevTools console.
- The worker must be served from the same origin, so do not test it with `file://`.


## Smoke test checklist

Use this short checklist after a small PR:

- app loads without a blank screen
- formulas populate in the formula picker
- colour maps populate in the colour picker
- parameter tiles are visible
- rendering works after changing formula or params
- panels open and close correctly
- help overlay opens and points at controls correctly
- interest overlay can be enabled and updates as expected
- export actions produce an image
- history navigation and share URL restore work
- no unexpected console errors appear

## Recovering from a bad PR

If a PR seems to have broken the app:

1. Check the browser console first.
2. Verify the version badge matches the build you think you are testing.
3. Reload with a fresh query string, for example `?v=XYZ`.
4. Hard refresh the page.
5. Compare the changed files against the intended PR scope.
6. Fix forward on the open PR when that is practical.
7. Revert only if a safe forward fix is not realistic.

## Linting (optional but recommended)

- Run:
  npm install
  npm run lint

- What it covers:
  the main application JavaScript files, including `js/main.js` and `js/interestOverlay.js`

- Purpose:
  catch syntax errors early (like invalid destructuring, missing variables, or other parser issues)

- Note:
  linting is advisory and does not affect runtime

## Pre-merge safety checks

Before opening or merging a PR:

1. Run `npm install` (first time only, or after dependency changes).
2. Run `npm run check`.
3. Test the app in the browser.
4. Open DevTools and confirm the console stays clear during startup and your quick smoke test.
5. Verify the on-screen version badge matches the PR build you expect.
6. If the browser appears to serve old files, reload with a cache-busting query string such as `?v=XYZ`.


## PR34 notes

- Updated user-facing `iter` wording to `iterations` in the quick slider label path and bottom parameter tile.
- Moved **Factory reset** from full/developer settings visibility into the user settings view.
- Hidden developer settings access remains a tap-and-hold on the gear button, with a 5-second hold delay.
- Confirmed **Classic (sqrt)** uses parameter **b** (not **c**) in formula definition and displayed equation detail.
- Added grouped, non-selectable bold headers in the formula picker: **Hopalong attractors** (above Classic (sqrt)) and **Other attractors** (above Pickover Clifford).
- Refined top-right controls so the eye icon sits left of Auto Scale, with Help and Settings shifted left, and moved the PR badge to sit just left of the leftmost top-right control.


## PR34.2 notes

- Classic (sqrt) now uses parameter `c` instead of `d` in both computation and displayed equation text.
- Formula picker group headers were made visually heavier to improve heading clarity versus formula rows.


## PR34.3 notes

- Added developer-settings touch pan/zoom tuning controls for **Touch pan deadband (px)** and **Pan/zoom settle delay (ms)**.
- Grouped these with existing touch zoom tuning controls (**Touch zoom deadband (px)** and **Touch zoom ratio min**).
- Touch pan/zoom gesture thresholds and settle redraw delay now read from persisted defaults/settings instead of hardcoded-only values.


## PR34.4 notes

- Hidden developer settings now open after a 3-second hold on the settings button.
- When developer/full settings are open, tapping outside no longer closes the panel; it closes when pressing the settings button again.
- Developer pan/zoom tuning ranges were tightened: pan deadband max `10`, zoom deadband max `10`, zoom ratio min max `0.01`, settle delay max `1000`.


## PR34.5 notes

- Updated default **Touch pan deadband** to `0.5 px`.
- Updated **Touch zoom ratio min** maximum range to `0.03`.


## PR34.6 notes

- The default first-open experience now starts from a curated **Classic (sqrt)** state (formula, colour map, parameters, iterations, and shared-view/rotation).
- Classic (sqrt) built-in defaults were updated to the curated values so startup defaults and formula defaults stay aligned.


## PR35.1 notes

- Tightened **Gingerbreadman** parameter `c` range to a very narrow band around `1` (`0.999999999` to `1.000000001`) while keeping its default at `1`.


## PR35.2 notes

- In random mode, the quick slider now stays live-synced to the currently displayed parameter or iterations value whenever randomization updates that same active slider item.


## PR35.3 notes

- High-resolution (4K/8K) clean exports now derive export framing from the current live render framing/scale so zoomed exports match the on-screen view more closely.
- Removed an unnecessary redraw call after high-resolution export completes, so closing save/share no longer triggers an extra render when nothing changed.


## PR35.4 notes

- 4K/8K clean export now preserves the exact live world framing (`minX/maxX/minY/maxY`) instead of scaling world-per-pixel to larger export dimensions, so high-res images match the on-screen/device-full composition.
