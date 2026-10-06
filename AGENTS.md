# Egg Inc. Virtue Farm Optimizer development

Use this Git checkout as the canonical source. Fetch `origin/main` before starting
work and review existing local changes before editing. Keep private farms, plans,
EIDs and API backups outside tracked source. Stage intended paths explicitly;
never use `git add .` or `git add -A` in a workspace containing account files.

Build with `npm ci` and `npm run build`. App and worker bundles are generated,
ignored files. Releases build both on Windows; do not commit those bundles.
Run checks appropriate to the change. Release workflow changes require
`node tests/release-state.cjs` and `node tests/prepare-publish.cjs`.

For an app release, increase the stable `package.json` version and the root
package-lock versions, update RELEASE-NOTES.md and the current audit, and run
`npm run build` so the title/sidebar match. Keep only the current audit in the
source/release. Review `git diff` and `git diff --cached --stat` before publishing.

Pushing a version increase to main automatically builds and checks a Windows
release, publishes both verified assets together, and validates the public feed.
Same-version package edits do not publish. Existing releases are never replaced;
downgrades and mismatched tags fail. Manual verification remains available.

If terminal Git push is authenticated, use a normal reviewed commit and push.
Otherwise use the existing GitHub connector; do not ask for passwords or tokens:

1. Fetch origin/main. Stage only the intended files and run
   `npm run prepare:publish`. This writes a private, ignored
   `tmp/publish-plan.json` from the Git index and prints the reviewed paths.
2. Use the plan's exact base tree and entries with GitHub create_tree. Binary
   asset entries first require create_blob with base64 encoding; use those blob
   SHAs in the tree. Deletions use sha:null. Do not send encoding to create_tree.
3. Create one commit with parent equal to baseCommit. Advance main with
   expected_sha=baseCommit and force=false. If the head changed, fetch and
   reconcile; never force over another person's changes.
4. Verify the corresponding automatic release workflow. Do not claim release
   success until Windows checks and the public update feed pass.
5. Fetch origin/main. After verifying its tree matches the staged published tree,
   `git reset --soft origin/main` synchronizes the local branch without changing
   working files or discarding unfinished drafts. Do not use reset --hard.

A source checkout requires building before running the app. Users download the
release ZIP and retain the app's Update App button; no Git authentication is
required on their PCs.
