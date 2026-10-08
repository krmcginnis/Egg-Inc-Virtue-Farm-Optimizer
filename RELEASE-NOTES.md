# v0.9.11

- Compare early Resilience trips when owned silos cannot cover sleep, including a two-shift coverage-and-return route when no missions are required.
- Compare departures before bedtime, at wake time, and at research-sale boundaries within passive funding waits. Recompute paid cash and delivery, and evaluate complete continuations.
- When only starting earnings gear improves, reexecute verified prior purchase plans with the actual new gear. Preserve shift-count alternatives before compressing waits; accept no extra time or shifts. Other input changes still invalidate prior winners.
- Keep the 90-second search budget. Nine finite exhaustive sleep/research/silo cases matched their optima, and repeated baseline runs retained all three established plans. Bounded cold searches can still vary.
- Install through Update App → Update & Restart, then rerun the planner. Retain a verified previous result when testing an earnings-only gear upgrade.

# v0.9.8

- Add optional daily Sleep Hours using the Event Schedule Timezone beside Plan Start. Purchases, shifts, fuel setup, and ship handling are scheduled while awake, including daylight saving changes.
- Use offline earnings during sleep. When silo coverage expires, earnings, Truth Egg delivery, and farm-produced fuel pause until wake; stored fuel transfers and ship travel continue. Refill silos before bed.
- Compare paid silo coverage for remaining nights and extra purchases up to eight silos on existing Resilience visits. Accept comfort upgrades only when they add no completion time or shifts, respecting permit limits and preserving existing greater coverage.
- Include sleep timing in saved plans, the timeline, Quick Guide, and PDF. Retain historical behavior with sleep disabled.
- Shorten the timezone menu to common regional choices with UTC offsets, while retaining the PC timezone and uncommon saved selections.
- Keep the normal 90-second search budget. Local baseline comparisons retained the previous verified completion times for 12-, 11-, and 10-shift plans.
- Install through Update App → Update & Restart, then configure Sleep Hours and rerun the planner.

# v0.9.7

- Compare paid research departures before long cash waits alongside tier, fleet-slot, train-length, and production-bottleneck changes. Judge each through a complete plan with independently funded vehicle investment.
- Preserve replay-validated winners for each shift count when rerunning unchanged farm and planning inputs, including saved/restored results. Changed inputs or invalid timelines cannot seed the next search.
- Increase the normal planner search budget from 45 to 90 seconds, allowing more route, purchase, and departure comparisons before returning the best plans found.
- Match the app's displayed budget, solver fallback default, and developer benchmark default to 90 seconds. Keep explicit developer/test overrides and Stop support.
- Install through Update App → Update & Restart, then rerun the planner.

# v0.9.6

- Compare a shared portfolio of early research and vehicle budgets before route beams, including hab-first and vehicle-first orders. Reuse paid openings across those trials.
- Refine hab and fleet investment and departure timing using complete paid continuations, then compare final production research and delivery gear against finishing sooner.
- When the declared earnings setup has lower income but identical production and research prices, use it to propose additional purchase orders. Execute and verify those schedules with the actual starting gear; recompute earning waits, sale timing, missions, and final Truth Egg allocation.
- Retain completed candidates and give missing neighboring shift counts a fresh route build when a longer mission route cannot provide a shorter ending.
- Add controlled investment and stronger-earnings regression checks to Windows release verification. Preserve the legacy solver, owned-gear rules, final-C delivery, and historical replay.
- The search remains bounded; these comparisons improve the fastest plans found and do not prove a global optimum or guarantee monotonic results for every input change.
- Install through Update App → Update & Restart.

# v0.9.5

- Reuse exact, paid farm checkpoints within each search so shared openings and repeated continuations need less simulation. Bound cache memory and keep different cash, timing, gear, fuel, missions, and route constraints separate.
- Compare prerequisite research chains that unlock useful upgrades, then evaluate continuing research or leaving Curiosity through a complete paid plan.
- Reserve computation time for these research comparisons and retain completed route alternatives that can produce shorter shift-count plans.
- Add exhaustive small-case quality checks and a developer benchmark command. Run the new checks in Windows release verification.
- Preserve the previous solver, owned-gear rules, final-C delivery, mission requirements, and saved-plan replay. Results remain the fastest plans found by a bounded search.
- Install through Update App → Update & Restart.

# v0.9.4

- Remove the highlighted Planning helper text for offline breaks, launch ordering, FTL, and repeated user-sequence descriptions.
- Show a live shift count in the Switch Sequence label. Count actual transitions from the starting farm and ignore consecutive duplicate visits.
- Retain the Virtue-code legend, mission controls, fuel estimates, validation messages, and saved routes.
- No solver or game-model changes in this release.
- Install through Update App → Update & Restart.

# v0.9.3

- Recover missing neighboring shift-count comparisons from complete, paid purchase paths by recalculating delivery across shorter endings.
- Reserve a small part of the existing search budget for this final comparison, keeping faster completed plans intact.
- Include a shorter plan only when it reaches the TE target, respects per-Virtue minimums, completes configured missions, and passes full replay.
- Preserve the previous solver and historical saved plans. The search still returns up to three fastest plans found; it does not guarantee that every shift count is feasible or globally optimal.
- Install through Update App → Update & Restart.

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
