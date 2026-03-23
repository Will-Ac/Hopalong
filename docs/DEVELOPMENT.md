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
