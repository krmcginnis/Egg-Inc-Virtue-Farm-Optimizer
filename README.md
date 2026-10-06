# Egg Inc. Virtue Farm Optimizer

Unofficial PC app for planning Egg Inc. virtue farm research, switches, artifacts and ship launches.

## Download and run

Download [the latest app ZIP](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/latest/download/Egg-Inc-Virtue-Farm-Optimizer.zip), extract it, and run `Start-Virtue-Optimizer.cmd`. No installation, admin rights, domain, Python or Node is needed to run the app. Keep the launcher window open. `index.html` also works offline for manual/JSON farm entry.

## Updates

The current version is **v0.7.10**, renumbered from v1.7.0 with the same features. If you already installed a 1.x version, download and extract the current ZIP once; the updater does not install lower version numbers. Future 0.7.x releases update normally.

Use **Update App → Update & Restart** in the sidebar. Published ZIPs already point to this repository. Updates verify downloads, preserve your current inputs and timeline, and restore the previous app if installation or startup fails. Finish your search or import before updating.

Saved farms and plans stay on your PC. EID import uses a read-only unofficial Egg Inc. endpoint; no game changes are made. Personal account snapshots are excluded from this repository and releases.

## Development and publishing

`npm ci` and `npm run build` rebuild the browser app. `python scripts/package.py` creates a verified ZIP and update manifest. A version increase in `package.json` pushed to **main** automatically runs **Publish App Release**. It builds on Windows, verifies installation/restart/rollback, publishes both assets together, and checks the public update feed. Same-version edits do not release, and existing releases are never overwritten. Manual verification and matching version tags remain available.

Use a local Git checkout for development. Build before launching a source checkout; generated `app.js` and `worker-source.js` are kept out of commits. If terminal push is unavailable, `npm run prepare:publish` prepares the reviewed Git index for one atomic commit through the existing GitHub connection. See `AGENTS.md` and `GitHub-Setup.md`.

The game model uses pinned Wasmegg data and reference code. Third-party notices and artwork credits are included. This project is not affiliated with or endorsed by Auxbrain. See `README.txt`, the current audit and `THIRD-PARTY-LICENSE.txt` for details.
