# Egg Inc. Virtue Farm Optimizer

Unofficial PC app for planning Egg Inc. virtue farm research, switches, artifacts and ship launches.

## Download and run

Download [the latest app ZIP](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/latest/download/Egg-Inc-Virtue-Farm-Optimizer.zip), extract it, and run `Start-Virtue-Optimizer.cmd`. No installation, admin rights, domain, Python or Node is needed to run the app. Keep the launcher window open. `index.html` also works offline for manual/JSON farm entry.

## Updates

Use **Update App → Update & Restart** in the sidebar. Published ZIPs already point to this repository. If using the initial unconfigured v1.7.0 ZIP, enter `krmcginnis/Egg-Inc-Virtue-Farm-Optimizer` once under Update Source. Updates verify downloads, preserve your current inputs and timeline, and restore the previous app if installation or startup fails. Finish your search or import before updating.

Saved farms and plans stay on your PC. EID import uses a read-only unofficial Egg Inc. endpoint; no game changes are made. Personal account snapshots are excluded from this repository and releases.

## Development and publishing

`npm ci` and `npm run build` rebuild the browser app. `python scripts/package.py` creates a verified ZIP and update manifest. The **Publish App Release** workflow builds and runs updater checks on Windows, then publishes both release assets together. Run it manually or push a version tag matching `package.json`. Increment the version for each release; existing versions are not overwritten.

The game model uses pinned Wasmegg data and reference code. Third-party notices and artwork credits are included. This project is not affiliated with or endorsed by Auxbrain. See `README.txt`, the current audit and `THIRD-PARTY-LICENSE.txt` for details.
