# v0.8.6

- Run the Windows helper in the background instead of leaving a command window open. The CMD launcher may flash briefly.
- Keep app update and rollback restarts hidden, including updates initiated by older launcher versions.
- Reopen the same healthy installation on repeated launches, preserving its browser address and EID preferences.
- Show startup failures in a Windows dialog. Start-Virtue-Optimizer.cmd --console remains available for troubleshooting.
- EID import and updates continue to work. Closing the browser leaves the helper running until Windows sign-out or shutdown.
- Preserve the compact UI, Artifacts review flow, research tiers and solver behavior.
- Install through Update App → Update & Restart.
