# v1.7.0

- Added Update App to the sidebar. It checks a public GitHub release repository,
  verifies the complete download, installs the app and restarts at the same address.
- Current farm inputs, unfinished edits and the last timeline carry through the
  restart. Saved JSON files, browser preferences and the update source are retained.
- Failed installation or startup restores the previous app. The latest backup
  stays in the app folder for recovery.
- Release packages now contain only app runtime files. Personal farm exports,
  account backups and development fixtures are excluded.
- Solver calculations and game data are unchanged.

This is the initial updater release; install this version once from the ZIP.
Subsequent versions can be installed from Update App after a release repository
has been connected and its update assets published.
