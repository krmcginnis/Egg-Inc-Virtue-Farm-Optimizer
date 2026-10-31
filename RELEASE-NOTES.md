# v1.2.5

- Compare total time, maximum laying, maximum shipping and future Soul Egg cost against the specified N plan with percentages. Faster time, higher capacity and lower cost are green; the opposite is red. Keep N as the baseline when selecting another plan and handle missing or zero baselines explicitly.
- Move Save Plan, Export Walkthrough and Check Farm Progress into the Compare Plans header. Remove Use Earliest Finish and the redundant green summary card. Keep purchase-check recovery and search diagnostics under Plan details, including for older single-plan saves.
- Export the selected proposed remaining plan from its comparison header; Save Plan continues to preserve the full session and pending proposal.

- Install through Update App → Update & Restart. Existing saved comparisons show the new layout without another search; older single-plan saves retain their actions and timeline.

# v1.2.4

- Compare exactly N+1, N, N−1 shifts in that order, with N selected by default. N is the entered comparison count; Automatic Planning searches no higher than N+1 (at most 30).
- Show total time, projected finish in 24-hour notation, peak laying and shipping capacity in eggs/hour, and future Soul Egg cost as comparison rows under the three selectable plan headers. Reconstruct rates across the plan and calculate sequential shift costs from the starting farm.
- Automatically check all three available final plans for purchase order. Preserve manual selections, saved legacy timelines, run shift tracking and remaining-plan preview/application. Missing exact counts and the N=0 boundary are explicit.
- Install through Update App → Update & Restart. Start a new search or reoptimize to generate the N+1, N, N−1 comparison; loading an old saved plan preserves its timeline and only shows alternatives already saved.

# v1.2.3

- Show two plan choices: the fastest complete plan found and the fastest complete plan using exactly one fewer shift. Select the fastest by default, remove recommendations and the five-percent preference, and show only one option when no exact one-fewer-shift plan was found.
- After search or reoptimization merges its results, automatically run the purchase-order check on each final choice. Up to two check workers share five additional minutes after the three-minute search. If checking changes the fastest shift count, check the new one-fewer-shift alternative too.
- Keep only paid, replayed improvements. Stop & Keep Best retains valid plans and completed check progress; a failed check preserves the original valid plan. Show each choice's check status and save its checkpoint with the plan.
- Completed automatic checks need no separate button click. The summary keeps a manual fallback for older or unfinished checks. Purchase checks cover declared groups of up to five purchases; they do not prove a globally optimal route or departure schedule.
- Preserve selected timelines and progress in older three-choice saves while showing the current pair. Manual choices still survive save/load and remaining-plan preview/application.
- Install through Update App → Update & Restart. Start a new search or reoptimize a checked farm to run the automatic purchase checks. Loading an existing plan preserves its saved timeline.

# v1.2.2

- Put plan choices above the timeline and show the selected finish prominently. Distinguish Selected, Recommended · fewer shifts, and Earliest Finish Found.
- Explain the recommendation in concrete terms: extra days/hours, percentage, and shifts saved. Keep the existing five-percent preference and fastest alternative.
- Add Use Earliest Finish to switch directly to the faster plan. Offer the same choice in a remaining-plan preview before applying it; Use Selected Remaining Plan applies the reviewed choice.
- Keep manual choices in the summary, walkthrough and saved plan. Show the earliest finish in the remaining-plan comparison, retain 24-hour times, and remove the conflicting finish-time-first summary text.
- Install through Update App → Update & Restart. Load an existing saved plan to see the clearer choices; no new search is needed for this interface update. Search settings and game math are unchanged.

# v1.2.1

- Expand standalone current-farm search with compact gear/build routes, including six-shift options that previously appeared only when reoptimization inherited a saved route. Preserve the established route portfolio and compare additional paid visits within the shift allowance.
- Let route refinement add a visit as well as remove or reorder visits. Preserve manual sequences, mission/sleep constraints, and the five-percent preference for fewer shifts.
- In the controlled current-farm comparison, find a six-shift option in 122d 17h 28m instead of the previous fastest five-shift result at 126d 12h 42m. Improve the five-shift option itself to 124d 19h 07m; it remains recommended because it is 1.69% slower than the new fastest option.
- Remove the Automatic Planning Details section from the Planning pane.
- Clarify that loading an older plan preserves its saved timeline. Find Best Plan and Reoptimize Remaining Plan use the installed app's current four-worker, three-minute Deep search; Check Purchase Order remains a separate purchase-group check.
- Install through Update App → Update & Restart, then run a new search or reoptimize to apply the expanded route coverage. Search remains bounded and does not prove a global optimum.

# v1.2.0

- Use the benchmarked Deep search profile with four background workers and a shared three-minute budget. Compare wider route choices, purchase packages up to six actions deep, and more refinement roots and slices.
- Resume paid refinement comparisons between slices instead of repeating completed trials. Coordinate partial work across workers and keep independently replayed complete plans when stopping or when a sibling worker fails.
- Recommend the fewest shifts among plans within 5% of the fastest completion time found. Always measure against the fastest duration, retain that option, and distinguish Recommended from Fastest Found. Manual selections survive save/load.
- In the hypothetical fresh 160-to-200 TE benchmark with 12 shifts available, Deep with four workers found an 11-shift plan only 39 seconds behind the fastest 12-shift result. This was one measured case; search remains bounded and does not prove global optimality.
- Install through Update App → Update & Restart, then reoptimize the remaining plan or start a new search to use Deep search and the new recommendation rule.

# v1.1.5

- Compare every legal next productive research level at each eligible Curiosity visit through the complete paid plan before short-term purchase rankings can discard it. Compare positions before, between, and after selected research, immediate versus Friday-sale purchases, and retained versus retimed calendar waits.
- Give these comparisons dedicated time for saved/current-farm searches and completed fresh-search plans, and revisit new winners during refinement. Include laying, shipping, habitat capacity, fleet/train capacity, and earnings research; preserve tier requirements and already planned levels without charging twice.
- In the supplied eight-shift plan, find Timeline Diversion 38 before Neural Net Refinement 12 and Graviton Coupling 3 during the Friday sale. The fully paid/replayed plan finishes 8h 11m earlier with the same 200 TE and eight shifts. Search remains bounded and does not prove global optimality.
- Install through Update App → Update & Restart, then reoptimize the remaining plan to use the expanded purchase search.

# v1.1.3

- Avoid unlock-only research when no useful locked research remains. Before returning a plan, remove unused unlock research only when later paid purchases remain legal and a full replay preserves or improves the finish, shift count, silo coverage, and earning breaks. Keep required current/later prerequisites and future habitat/vehicle capacity.
- Prefer fewer purchases after completion time, shifts, silo coverage, and earning breaks tie. Apply the same comparison across search workers and purchase checks.
- Display every clock time in 24-hour notation, including the plan/sleep inputs, date picker, timeline, backup/progress dates, and exported walkthrough.
- Show Starts before the bold Resume line in Quick Guide breaks and exported walkthroughs; keep the prominent break duration.
- Install through Update App → Update & Restart, then reoptimize the remaining plan to regenerate purchase steps. Existing saved timelines remain unchanged until a new search is applied.

# v1.1.2

- Remember each account's starting lifetime shift count and total run allowance. Account refreshes update Maximum New Shifts, including after restarting or Start from Scratch. Plans with run or continuation metadata recover their anchor; otherwise enter shifts already used once for a run first imported midway through.
- Carry the small tracking record in saved farms and plans, preserve it during reoptimization, and require a new anchor when the observed run changes. Keep account records separate and reject older backups.
- Remove the instructional text beneath the sidebar's Load Account button.
- Install through Update App → Update & Restart. For an existing run, load a saved remaining plan with continuation tracking, or enter the shifts already used and total allowance once under Planning → Current Run Shift Tracking.

# v1.1.1

- Improve departure timing with calculated production and affordability milestones, tighten optimistic funding bounds, and coordinate refinement work across workers to avoid duplicate comparisons.
- Add resumable Purchase Order Check for selected groups of up to five purchases. Compare legal orders and subsets with actual costs, dependencies, sleep, and mission requirements. Each run uses up to five minutes; Stop & Keep Best pauses it, and Save Plan retains progress.
- Show the optimistic model minimum in Search Details. Completing the selected purchase groups does not prove a globally fastest plan; other purchases, routes, and departure times remain outside that check.
- Prioritize Save Plan, Export Walkthrough, and a shortcut to Next Planned Step. Keep progress above alternative plans, move Expand All beside Shift Activities, and place next-ascension controls at the timeline's end.
- Add a visible Load Account button, clearer target/shift guidance, purchase-check availability explanations, and accurate search status with the existing best time retained. A failed optional purchase check keeps the current plan usable and retryable.
- In paired two-worker tests against v1.1.0, preserve the original best six-shift finish and improve the follow-up six-shift plan by 6h 57m 22s and its five-shift alternative by about 3.5 days. Runtime improves in the follow-up case and increases in the original case; results vary by farm and hardware.
- Install through Update App → Update & Restart. Existing saved plans remain usable. Reoptimize from a checked farm to update the remaining schedule, or use Purchase Order Check to compare the selected plan's original purchases.

# v1.1.0

- Reduce repeated research math, calendar polling, checkpoint key work and TE allocation overhead while preserving the model's calculations.
- Revisit promising discarded branches and compare related purchase families, nearby farm orders and finer paid departure timings. Use conservative mathematical bounds to avoid unproductive branches.
- Search with two independent background workers on machines reporting at least four logical cores, otherwise one. Share only independently replayed complete candidates; preserve verified winners after cancellation or a sibling failure.
- Preserve paid visit prefixes during route edits, including completed openings. Retain up to three distinct shift-count choices and validate remaining missions, sleep, prices and interaction time.
- In two supplied saved-plan tests, the default two-worker search used about 13% and 48% less time than v1.0.10. The fastest six-shift finishes stayed intact, and the followup five-shift alternative finished about 2.9 days earlier. Results vary by farm and hardware.
- Research sources, measured efficiency and limitations are recorded in the current audit and repository search-research notes. Search remains bounded and does not prove a global optimum.
- Install through Update App → Update & Restart, then reoptimize from a checked farm to use the expanded search. Existing saved plans remain usable.

# v1.0.10

- Reuse unchanged paid simulation prefixes and independently replay competitive candidates, allowing more purchase comparisons within the existing search budget.
- Compare new paid purchase packages, including complementary laying/shipping capacity, tier prerequisites and engine/car dependencies, through the full TE goal.
- Use remaining search time for distinct additional purchase and departure passes, adapting their priority to improvements and stopping when the queue is exhausted.
- Revalidate and retime compatible saved shift-count alternatives when reoptimizing a checked farm. Preserve the original shift allowance, current upgrades, remaining missions and reviewed launch counts.
- Preserve automatic artifact snapshots when creating continuations from replayed plans, so saved alternatives remain independently replayable.

- In the supplied followup comparison, the five-shift alternative improves by about 84 days while the fastest six-shift finish remains unchanged. Results remain bounded fastest-found plans.
- Install through Update App → Update & Restart, then reoptimize from a checked farm to use the expanded search.

# v1.0.8

- Compare research, habitats, vehicles, train cars and silos by complete paid TE completion time. Test skipping purchase chains, buying productive upgrades first, waiting for a research sale, and using a later eligible Virtue visit.
- Account for complementary laying/shipping capacity, tier unlocks, fleet slots, engines and train length. Pay actual prices, recompute funding and preserve delivery goals before deferred purchases; compare retained and rescheduled calendar waits.
- Keep the original candidate and accept only verified improvements within the existing search budget. The comparisons are bounded and do not prove a global optimum.
- The supplied missed-sale case defers Atomic Purification 27 → 28 to October 23 at 09:00 Pacific, reduces its cost from 10.278 Td to 3.084 Td, and finishes 6h 6m 28s earlier with the same 200 TE, six shifts, and 351 launches.

- Install through Update App → Update & Restart, then reoptimize the remaining plan to compare purchase choices from the checked farm. Existing saved plans remain usable.

# v1.0.7

- Advance past ended research-sale, earnings-event, and sleep waits using the checked backup timestamp. Show the actual unfinished step and purchase batch instead of an already-ended calendar break.
- Label these waits as ended by the snapshot time in Current Visit Checklist. Preserve the saved schedule and manual confirmations; the PC clock alone does not confirm purchases, resource waits, fuel transfers, or launches.
- Keep funding-wait inference from observed purchases working across an ended sleep wait. Add timestamp-boundary, account-refresh, save/load, and update-recovery regressions.
- Install through Update App → Update & Restart, then refresh Plan Progress or check a current farm file. Existing saved plans remain usable.

# v1.0.6

- Match remaining-plan progress against the backup used to create the plan, even when the new schedule starts later. Keep older-backup, future-time, ascension, visit, and upgrade checks.
- Show Next Planned Step immediately after Use Remaining Plan using the checked farm. Retain that snapshot through account refresh, save/load, reset/undo, and update recovery, with remaining-plan labels.
- Add regressions for the same account backup, newer backups that still precede the schedule, older rejected backups, and repeated reoptimization through the compiled worker.

- Install through Update App → Update & Restart. The checked farm and next planned step are retained.

# v1.0.5

- Restore recorded automatic artifact sets when replaying the original remaining route. Check the current inventory's artifacts and pooled socketed/loose stones, or equivalent configured manual loadouts, before reusing a saved set name.
- Retain that replayed route as the remaining search's baseline so a fresh search cannot replace it with a slower result. Add model, standalone-worker, and browser save/load regressions for this case.

- Install through Update App → Update & Restart, then check the current farm and reoptimize the remaining plan.

# v1.0.4

- Preserve large update sessions in IndexedDB instead of depending on the small localStorage quota. Retain legacy session recovery and a localStorage fallback; wait for the session transaction to commit before installation.
- Remember each sidebar tab's scroll position, including expanded purchase timelines, for mouse and keyboard navigation. Newly loaded plans still open at the top.
- Document the save/reset/update/reload workaround for older installations that cannot preserve a large session.

- Install through Update App → Update & Restart. If an older updater cannot preserve a large session, save the farm and plan, choose Start from Scratch, update, then reload the saved plan.

# v1.0.3

- Fix remaining-plan mission routing: retain the saved route's remaining visits as the first automatic candidate; complete outstanding launches on one remaining Humility visit when their tank requirements fit, preserving mission counts and the shift allowance.
- Keep required fuel-refill stops when H1 is finished but H2 still needs fuel. Give remaining-search guidance when no complete candidate is found, rather than reporting a rejected candidate's fixed-route error.
- Show the full upcoming purchase batch in Next Planned Step, adjusted for upgrades already in the checked farm. Display the planned offline-break duration in large text above the purchases to make on return.
- Place funding breaks at the beginning of the purchase groups they fund in Quick Guide and the PDF walkthrough. Keep final delivery waits separate and fuel collection after tank setup. Preserve all waits, their durations, and the underlying replay actions.
- Add regressions for batch progress, wait ordering, leftover launches, later fuel collection, saved-route retention, and desktop layouts. Make the bedtime test independent of the current date.
- The saved 12-shift plan still replays to 200 TE in 137d 23h 0m 51s with 18 launches.
- Install through Update App → Update & Restart.

# v1.0.2

- Add Plan Progress: check a farm file or refresh from your account, identify repeated visits by lifetime shift count, show purchased upgrades and the next planned step, and retain the original timeline. Save Plan preserves confirmations for waits, fuel transfers, and launch batches.
- Add Reoptimize Remaining Plan from a checked farm snapshot. Confirm already-launched missions, then search using current upgrades, gems, fuel, flights, target, sleep, timezone, and the unused shift budget. Compare with the original route retimed from the same farm, keep or apply the proposal, and return to the previous plan later.
- Support final research purchases on remaining plans with no shifts left, using bounded paid comparisons and retaining the replayed original route as a candidate. Fresh full-farm routes retain their existing research and final-delivery rules.
- Explain research purchases in Summary, Quick Guide, Full Breakdown, and icon tooltips. Show immediate earnings gains, tier unlocks or prerequisite contributions, and capacity prepared for later upgrades. Expand Why These Purchases? to see research grouped under Max Tiers.
- Preserve progress and remaining-plan comparisons through save/load, reset/undo, and app updates. Add model, browser, and standalone worker regression checks.
- The supplied 12-shift plan still reaches 200 TE in 137d 23h 0m 51s with 18 launches. Plans remain the fastest complete results found within the search budget.
- Install through Update App → Update & Restart.

# v1.0.1

- Show research names and effects when hovering over their icons in Summary, Quick Guide, and Full Breakdown. The shared artwork also provides these tooltips on research input pages.
- Keep the existing plan calculations, saved-plan format, and purchase grouping.
- Install through Update App → Update & Restart.

# v1.0.0

- Compare earnings-first research orders on Curiosity visits. Defer inactive capacity until departure where feasible, retain tier prerequisites and complementary production upgrades, and compare actual paid plans through the TE target.
- Keep the 90-second search budget, owned-gear rules, sleep schedule, fixed 09:00 Pacific events, required missions, and strict saved-plan replay.
- Tighten research-proposal range validation and include the new ordering checks in Windows release verification.
- Refresh the Wasmegg comparison and migration guidance. Keep current audit links synchronized during builds and include the workflow's required regression suites in the developer source ZIP.
- The supplied 12-shift plan still reaches 200 TE in 137d 23h 0m 51s with 18 launches. Earnings-first trials shorten the early research visits by about 10–12 minutes; later sale timing absorbs that gain. The search returns the fastest complete plans found, without a proof of global optimality.
- Install through Update App → Update & Restart. Public v0.x installations can update normally; saved farms and plans remain compatible.

# v0.9.14

- Add Load Plan to the page header. Restore saved inputs, the selected alternative, and the Purchase Timeline after replay-validating every saved alternative. Invalid files retain the current inputs and timeline.
- Keep Load Farm compatible with saved plans and game backups. Disable loading during an active search or account import, and allow reopening the same saved file.
- Align the final delivered egg rate with its text and egg artwork.
- Update How It Works and the user guides with the saved-plan loading flow. The solver, search budget, and replayed plan times are unchanged.
- Install through Update App → Update & Restart.

# v0.9.13

- Align shift durations, Truth Egg gains, and Soul Egg costs with their icons and summary dates.
- Distinguish shipping capacity from delivered eggs in shift summaries, completion strips, and PDFs. Show the peak delivered-egg rate and final laying/shipping bottleneck; replayed plan times are unchanged.
- Replace misleading ship tank maximum estimates with required non-Humility tank space and a notice when surplus fuel needs to be discarded.
- Include years in displayed plan dates and show extra time and shift differences on alternative-plan cards.
- Add topic links and narrower paragraphs to How It Works. Describe PDF assumptions as planned artifact sets.
- Remove the paragraph below Sleep Start and Wake Time in Planning. Keep sleep behavior explained on How It Works.
- Check No Game Interactions During Sleep for new farms and Start from Scratch, with a 23:00–07:00 default. Retain saved preferences and older timelines without sleep.
- Rewrite How It Works and the current user guides around the Account → Virtue Farm → Planning flow. Correct stale sleep, timezone, route, and saved-plan descriptions, and clarify target TE, silo coverage, and what replay validation checks.
- Replace references to removed controls and describe results as the fastest complete plans found. The solver's search rules and time budget are unchanged.
- Install through Update App → Update & Restart. Existing saved sleep preferences are retained; new farms start with sleep enabled.

# v0.9.12

- Fix Monday double earnings and Friday research sales to 09:00 America/Los_Angeles, following PST/PDT. The selected Sleep & Display Timezone continues to control sleep and displayed dates.
- Recalculate non-Pacific plans with the corrected calendar; their event timing and resulting purchase waits can change.
- Retain optional Sleep Hours, paid silo coverage, and the existing 90-second search budget. Enable Sleep Hours before creating new benchmark plans.
- Install through Update App → Update & Restart, then rerun the planner. The release includes the game-model audit and Pacific event regression checks.

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
