# Release setup

The public release repository is `krmcginnis/Egg-Inc-Virtue-Farm-Optimizer`.
Published releases automatically configure the app to check this repository.

Use a dedicated **public** repository named `Egg-Inc-Virtue-Farm-Optimizer`.
The downloadable app reads public releases without GitHub credentials. A private
source repository can publish to a separate public release repository, but that
requires adapting the workflow; this initial workflow uses one public repository.
Only the curated GitHub Setup tree belongs in that repository. Personal farms,
account backups and older plan files have been excluded.

Initial repository publishing procedure:

1. Push the contents of the GitHub Setup folder to the repository root.
2. Enable GitHub Actions if the account or repository has disabled it.
3. Run **Publish App Release**, or push a tag matching `package.json`, such as
   `v0.7.2`. The workflow builds and verifies a package on Windows, creates a draft
   with both assets, then publishes it. Existing versions cannot be overwritten.
4. Install the first release ZIP once and run `Start-Virtue-Optimizer.cmd`.
   Its update source is set automatically to that repository. The previously
   supplied bootstrap ZIP can instead connect it once under Update Source.

For subsequent changes, update the version and release notes, keep only the
current audit, run checks appropriate to the change, and publish a new tag.
Select **Update App → Update & Restart** in the app to install it.

The two required assets are `Egg-Inc-Virtue-Farm-Optimizer.zip` and
`update-manifest.json`. `scripts/package.py` creates both and verifies ZIP CRCs.
They must describe the same stable version. The app checks the latest published,
non-prerelease GitHub release. A new draft is invisible until both uploads finish.

No password, access token, EID or account backup belongs in the app or repository.
The workflow uses GitHub's built-in Actions token. Publishing access is separate
from the app's unauthenticated public download access.

Current local evidence: PowerShell 7.6.6 and Chromium on Linux. The release workflow
also runs core verification/install/rollback checks with Windows PowerShell on a
Windows runner. A native Windows/browser update has not yet been run here.
