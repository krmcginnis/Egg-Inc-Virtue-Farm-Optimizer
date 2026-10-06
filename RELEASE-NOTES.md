# v0.7.4

- App version increases on main now automatically build, validate and publish a release.
- Windows installation, restart, rollback and live public update checks remain required. Same-version changes and duplicate pushes do not replace releases; downgrades are rejected.
- Releases point to the exact tested commit. Generated app bundles are built by GitHub rather than included in source commits.
- Added a local Git workflow and reviewed staged-change publishing through the existing GitHub connection.
- The app layout, saved farms and solver calculations are retained. Install with Update App → Update & Restart.
