# v0.7.2

- Fixed Windows updates failing to restart on the same local port. Closed connections can be reused; a per-port lock keeps app instances separate.
- Update and rollback errors remain in the Update App dialog across refreshes and reopening. Copy Error copies the full message; Check Again clears it for a retry.
- Restarted helper errors are retained in the update job logs instead of disappearing with a closing console window.
- Every release now checks the actual Windows helper and updater subprocess through successful restart and startup-failure rollback, as well as file verification.
- Farm files, planning inputs, update source and solver calculations are retained.

If updating from v0.7.0 or v0.7.1 fails, save your farm, close the app's launcher, and extract this release's Egg-Inc-Virtue-Farm-Optimizer.zip into the existing app folder, replacing app files. Launch Start-Virtue-Optimizer.cmd again. Future updates use Update App.
