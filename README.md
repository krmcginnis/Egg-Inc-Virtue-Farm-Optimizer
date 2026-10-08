# Egg Inc. Virtue Farm Optimizer

Unofficial PC app for planning Egg Inc. virtue farm research, switches, artifacts and ship launches.

## Download and run

Download [the latest app ZIP](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/latest/download/Egg-Inc-Virtue-Farm-Optimizer.zip), extract it, and run `Start-Virtue-Optimizer.cmd`. No installation, admin rights, domain, Python or Node is needed to run the app. Keep the launcher window open. `index.html` also works offline for manual/JSON farm entry.

Start on **Farm & Account** to import and review your account and current farm. Choose **Continue to Planning** or the Planning sidebar entry to configure goals, routes, timing, and ships. **Save Farm** retains settings across both pages.

## Updates

The current version is **v0.9.3**. Earlier releases were renumbered from v1.7.0 to v0.8.0. If you already installed a 1.x version, download and extract the current ZIP once; the updater does not install lower version numbers. Future 0.x releases update normally.

Use **Update App → Update & Restart** in the sidebar. Published ZIPs already point to this repository. Updates verify downloads, preserve your current inputs and timeline, and restore the previous app if installation or startup fails. Finish your search or import before updating.

Saved farms and plans stay on your PC. EID import uses a read-only unofficial Egg Inc. endpoint; no game changes are made. Personal account snapshots are excluded from this repository and releases.

## Development and publishing

`npm ci` and `npm run build` rebuild the browser app. `python scripts/package.py` creates a verified ZIP and update manifest. A version increase in `package.json` pushed to **main** automatically runs **Publish App Release**. It builds on Windows, verifies installation/restart/rollback, publishes both assets together, and checks the public update feed. Same-version edits do not release, and existing releases are never overwritten. Manual verification and matching version tags remain available.

Use a local Git checkout for development. Build before launching a source checkout; generated `app.js` and `worker-source.js` are kept out of commits. If terminal push is unavailable, `npm run prepare:publish` prepares the reviewed Git index for one atomic commit through the existing GitHub connection. See `AGENTS.md` and `GitHub-Setup.md`.

The game model uses pinned Wasmegg data and reference code. Third-party notices and artwork credits are included. This project is not affiliated with or endorsed by Auxbrain. See `README.txt`, the current audit and `THIRD-PARTY-LICENSE.txt` for details.

## Route-aware solver

Automatic Planning compares farm orders, numbers of upgrade visits, purchases,
and departure timing within Maximum New Shifts (default 12). The maximum is a
ceiling. Purchase Timeline shows up to three fastest complete plans with distinct
shift counts, sorted by finish time, with fewer shifts preferred when times tie.
Each choice has its own summary, Quick Guide, and JSON/PDF exports. Saved plans
retain every choice; historical single plans and sale comparisons still replay.

User Selected Sequence preserves the entered order and can stop early once the
TE goal and required missions are complete. Every final Curiosity visit is
for delivery only. Owned inventory and configured launches are included;
future mission rewards are not assumed. The search compares sale timing
internally, with no sale-window selector. The bounded route proposal and purchase
search does not exhaust every possible route or prove global optimality.

The v0.8.23 solver remains in `src/optimizer-legacy.cjs`, with historical replay
routed through it. Developers can use `legacySolver: true` when calling solve
for rollback testing.
