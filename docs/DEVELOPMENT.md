# Development Guide

## 1. How to run

This app is designed to run as a static site, so the normal usage model is simple:

- Open the site through GitHub Pages, or any static file server that serves the repository contents.
- Because the app loads JSON files with `fetch()`, use an HTTP server rather than opening `index.html` directly from the file system.
- If you are checking a freshly deployed version and the browser seems stuck on older code, add a cache-busting query string such as `?v=PR11.2`.

Example:
- `https://<your-pages-site>/Hopalong/?v=PR11.2`

## 2. PR workflow

Keep changes small and easy to review.

Recommended workflow:
1. Make one focused change per PR.
2. Reload the app and test the affected controls before merging.
3. Update the visible version badge when the PR intentionally changes the shipped build.
4. Use the badge/query-string pair together so reviewers can confirm they are testing the right build.

The version badge is a lightweight visual check, not a release system. It helps reviewers confirm which PR build they are looking at.

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
- add `?v=<new-version>` to the URL
- confirm the on-screen version badge matches the build you expect

## 4. Debugging guide

### Use the console first
Open browser DevTools and watch the Console during startup and after each interaction.

Useful things to look for:
- fetch failures for JSON files
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
3. Reload with a fresh query string, for example `?v=112`.
4. Hard refresh the page.
5. Compare the changed files against the intended PR scope.
6. Fix forward on the open PR when that is practical.
7. Revert only if a safe forward fix is not realistic.

## Linting (optional but recommended)

- Run:
  npm install
  npm run lint

- Purpose:
  catch syntax errors early (like invalid destructuring or missing variables)

- Note:
  linting is advisory and does not affect runtime
