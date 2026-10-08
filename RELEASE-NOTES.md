# v0.9.2

- Compare earlier research-visit departures using complete, paid continuations through later upgrades, sale windows, fuel collection, missions, and TE delivery.
- Keep prefixes that finish sooner even when their current farm earns less. Reserve part of the search budget to refine the displayed shift-count alternatives.
- Continue comparing later gear and physical upgrades after finding a feasible delivery plan; keep the faster completion.
- Share computation time among feasible routes and bound the initial recipe comparisons so they cannot consume the whole search.
- Apply route-aware fuel collection to new arbitrary-route candidates instead of skipping fuel based on legacy C1/K1/C2 labels.
- Preserve historical replay, the previous solver, and the existing 45-second search budget.
- Install through Update App → Update & Restart.

# v0.9.1

- Match Automatic Planning Details text to the other compact panel text.
- Remove the highlighted helper text and redundant bonus, gear-effect, and fuel summaries from Account, Virtue Farm, and Planning.
- Remove duplicate Starting Artifacts controls beneath Starting Farm; use the existing Artifacts panel.
- Remove Concurrent Mission Slots from Planning. New plans use three slots; historical saved plans retain their original scheduling for replay.
- Install through Update App → Update & Restart.

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
