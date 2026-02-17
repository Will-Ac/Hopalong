# Hopalong

This repo contains the **Hopalong fractal web app** (currently Slice 1) and its specs.

## Where your files are (plain-English)
- App page: `index.html`
- JavaScript modules: `js/`
- Runtime data loaded by the app: `data/`
- Product/spec docs: `spec/`

If these files are committed and pushed to GitHub, they are stored in your GitHub repository as normal files.

## Current app status
Slice 1 is implemented:
- Full-screen canvas render
- Formula dropdown
- Re-render on formula change and resize/orientation

## Easiest way to publish from GitHub (great for iPad users)
If you are working mainly on iPad, **GitHub Pages** is the easiest path.

1. Push this branch to GitHub.
2. Merge into your Pages source branch (usually `main`).
3. In GitHub repo settings, enable **Pages** from that branch (root folder).
4. Open the Pages URL on any device (iPad/iPhone/Android/desktop).

Because Pages is HTTPS-hosted, ES modules and JSON `fetch()` work correctly.

## If push fails in Codex
If Codex reports a `403` tunnel/proxy error while pushing, it means this runtime could not reach/authenticate to GitHub. In that case:
1. Open a terminal where your GitHub auth works (local machine, Codespaces, etc.).
2. Run:

```bash
git push -u origin slice-2.1-abcd-actual-values-hold-step
```

Then create/merge a PR on GitHub.


## How to create a PR (beginner checklist)
If you are new to GitHub, follow this exact sequence:

1. Make sure your branch is pushed (for example `slice-2.1-abcd-actual-values-hold-step`).
2. Open your repo on GitHub in Safari.
3. Tap **Compare & pull request** (or **Contribute** -> **Open pull request**).
4. Set:
   - **base** = `main` (or your deploy branch)
   - **compare** = your current slice branch (for example `slice-2.1-abcd-actual-values-hold-step`)
5. Add a title + description.
6. Tap **Create pull request**.
7. After review, tap **Merge pull request**.

After merge, GitHub Pages will deploy from your configured Pages branch.


## Branch naming convention
Use short, descriptive branch names with slice + key features so GitHub history is easy to read.

Example pattern:
- `slice-2.1-abcd-actual-values-hold-step`

Also, every behavior change must be mirrored in the spec files under `spec/` before merge.
