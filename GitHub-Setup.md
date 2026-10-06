# GitHub development and automatic releases

The public app repository is `krmcginnis/Egg-Inc-Virtue-Farm-Optimizer`.
Release ZIPs automatically configure the app to check this repository.

## Development

Clone the repository and use that checkout as the canonical source. Run
`npm ci` and `npm run build` before launching a source checkout. The generated
app and worker bundles are ignored; GitHub builds them for each release.
Review diffs and explicitly stage only intended public source files. Private
farms, plans, EIDs and account backups must remain outside tracked source.

Terminal Git pushes need their own authentication; the connected GitHub app
is not a terminal credential. If terminal push is unavailable, use
`npm run prepare:publish` to prepare only staged changes in the ignored
`tmp/publish-plan.json`, then create one commit through the existing GitHub
connection with the expected branch head. This needs no additional password
or token. Follow the exact procedure in AGENTS.md.

## Automatic releases

1. Increase the stable version in package.json and the root package-lock entries.
2. Update release notes and the current audit; keep only that audit.
3. Build and run checks appropriate to the change, review and commit the changes.
4. Push the commit to main. No browser dispatch or separate tag is needed.
5. Wait for Publish App Release to pass its Windows installation, restart and
   rollback checks, publish both assets, and validate the public update feed.

Same-version package edits do not publish. Existing versions are never
replaced; downgrades and mismatched tags are rejected. Publication is serialized,
and each release tag points to the exact tested commit. Manual Run workflow
with Verify Only remains available, and matching version tags also work.

The two runtime assets are Egg-Inc-Virtue-Farm-Optimizer.zip and
update-manifest.json. Downloadable ZIPs include the generated bundles and need
no Node or Git installation. Users select Update App → Update & Restart.
No game credentials or GitHub credentials are included in the app.

The workflow uses GitHub's built-in repository-scoped Actions token with the
existing contents:write permission. No new stored credential is required.
