# v0.9.0

- Use one route-aware purchase and departure solver for optimized and user-entered sequences, with automatic visit timing and no C1/K1 time-limit controls.
- Add Maximum New Shifts for Automatic Planning as a ceiling, defaulting to 12. Compare farm orders, upgrade revisits, shorter routes, and delivery endings.
- Show up to three fastest complete plans with distinct shift counts. Select each plan for its summary, Quick Guide, timeline, and exports. Research and sale timing are compared internally; separate sale-window choices are removed.
- Rank completion time first, then fewer shifts, then fewer earning breaks when times tie.
- Make every final Curiosity visit delivery-only. With three C visits, the first two permit research and the third is for delivery.
- Compare physical upgrades with finishing delivery sooner; use currently owned gear and include configured missions without predicting mission rewards.
- Place Integrity after the final Humility visit in the preset, while also comparing an alternate ending and allowing early completion on any farm.
- Preserve the v0.8.23 solver for developer rollback and historical-plan replay. Keep saved-plan, PDF, and update recovery support.
- Install through Update App → Update & Restart.
