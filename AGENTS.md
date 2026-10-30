# Egg Inc. Virtue Farm Optimizer development

Use this Git checkout as the canonical source. Fetch `origin/main` before starting
work and review existing local changes before editing. Keep private farms, plans,
EIDs and API backups outside tracked source. Stage intended paths explicitly;
never use `git add .` or `git add -A` in a workspace containing account files.

Use `npm run check:release` during development when broad validation is needed. It refreshes
changed dependencies, rebuilds/packages the current version, verifies the archive,
and reuses successful local groups only when implementation, tests, dependencies,
Node/platform and browser configuration match. A failed check invalidates reuse.
Version labels and release prose are checked by fresh build/package verification;
they do not force another full local model run. Use `CHROME_EXECUTABLE` for a
nonstandard Chrome installation. Windows also runs the native group. For publishing, run `npm run release:preflight` for fresh version/build/package
verification and reuse completed development validation. Do not repeat the full
local suite solely because publication was requested. CI always runs all 42
required checks on the exact commit and never accepts local cached results.

App and worker bundles are generated and ignored; never commit them. Release
workflow changes require `node tests/release-state.cjs`,
`node tests/prepare-publish.cjs`, and `node tests/release-pipeline.cjs`.

For an app release, increase the stable `package.json` version and the root
package-lock versions, update RELEASE-NOTES.md and the current audit, and run
`npm run build` so the title/sidebar match. Keep only the current audit in the
source/release. Review `git diff` and `git diff --cached --stat` before publishing.

Pushing a version increase to main builds/packages once, runs the model, UI/worker
and native updater checks in three parallel Windows jobs, and gates publication
on all groups checking that exact candidate. Both assets are published together.
The workflow then verifies the native updater feed, anonymously downloads and
checks every public runtime digest, and runs real Chrome against the public ZIP.
It records complete evidence in the `release-validation` run artifact and updates
VALIDATION.json/current audit automatically when main has not advanced. Do not
repeat completed public/browser checks or add a manual acceptance commit when
the workflow has already provided valid evidence for the exact source commit.
Same-version package edits do not publish. Existing releases are never replaced;
downgrades and mismatched tags fail. Release-infrastructure edits automatically
run this full flow in verification-only mode without publishing or changing live
assets. Manual verification-only dispatch remains available.

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
4. Verify the corresponding automatic release workflow and its final validation
   summary/artifact. All groups and public/browser acceptance must pass before
   claiming success. A verification-only run must remain unpublished.
5. Fetch origin/main. After verifying its tree matches the staged published tree,
   `git reset --soft origin/main` synchronizes the local branch without changing
   working files or discarding unfinished drafts. After automated acceptance,
   fetch and fast-forward its metadata commit when the worktree is clean. Keep
   unrelated unfinished edits. Do not use reset --hard.

A source checkout requires building before running the app. Users download the
release ZIP and retain the app's Update App button; no Git authentication is
required on their PCs.
