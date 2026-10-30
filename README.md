# Egg Inc. Virtue Farm Optimizer

Unofficial PC app for planning Egg Inc. Virtue farm research, shifts, artifacts, and ship launches.

## Download and run

Download [the latest app ZIP](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/latest/download/Egg-Inc-Virtue-Farm-Optimizer.zip), extract the entire ZIP, and run `Start-Virtue-Optimizer.cmd`. The helper runs in the background and opens the app in your browser. No installation, admin rights, Python, or Node is needed. `index.html` also works offline for manual inputs or JSON files.

Start on **Account** to load your account or saved farm. Continue to **Virtue Farm** to review upgrades, gear, fuel, and flights, then **Planning** to set your target, route, sleep hours, and missions. **Save Farm** retains settings across all three pages. **Load Plan** in the page header restores a **Save Plan** JSON, including its inputs and selected timeline, after replay validation. See **How It Works** for the model's rules and assumptions.

To follow a saved plan, use **Check With Farm File** or **Refresh From Account**
under **Plan Progress**. The app matches the current visit by lifetime shift
count, checks research and permanent purchases, and shows the next planned step.
Sale, earnings-event, and sleep waits advance when their end time is reached
in the checked backup. Confirm other waits, fuel transfers, and completed launch
batches in the checklist. The PC clock alone does not confirm farm progress.
Progress checks keep the original schedule. To update it, confirm **Already
Launched** counts for each visited Humility batch, including active and returned
missions, then choose **Reoptimize Remaining Plan**. The search preserves your
target, per-egg floors, sleep, timezone, and the original plan's unused shifts.
It starts at the current PC time using the checked farm's upgrades, gems, fuel,
and flights; no earnings or fuel are assumed since that backup.

Compare the new finish with the original route retimed from the same farm, then
choose **Use Selected Remaining Plan** or **Keep Original Plan**. Visit labels restart
from the current farm; the comparison shows total shifts used and remaining.
**Return to Previous Plan** restores the original after applying a replacement.
**Save Plan** retains progress, launch counts, the comparison, and any proposed
replacement. Compare N+1, N, N−1 remaining shifts, with the specified N
selected by default. The bounded search does not prove a globally optimal sequence.

**Use Selected Remaining Plan** immediately shows the next planned step from the checked
farm. Refreshing may return the same backup; it remains usable when it is at
least as recent as the snapshot that started this remaining plan.

In the Purchase Timeline, **Why These Purchases?** lists research effects for
each shift, including purchases grouped under Max Tiers. Quick Guide, Full
Breakdown, and research-icon tooltips also explain immediate earnings gains,
tier prerequisites, and capacity for later upgrades. Effects are reconstructed
from the planned farm and gear at purchase time; one purchase can have several
roles. These explanations do not certify an optimal purchase order.

Next Planned Step lists the entire upcoming purchase batch using the checked
farm's remaining research levels. Its planned break duration appears in large
text. Funding breaks precede their purchases in Quick Guide and the exported
walkthrough; final delivery waits appear separately. Dates and durations remain
from the original plan until you reoptimize. Remaining mission routing preserves
all outstanding launches, required fuel stops, and the remaining specified shift count.

## Updates

Earlier internal builds were renumbered from v1.7.0 to v0.8.0. If your internal
build has a higher version number than the current public release, download and
extract the current ZIP once; the updater does not install lower version numbers.
Public v0.x installations can update to v1.0 normally.

Use **Update App → Update & Restart** in the sidebar. Published ZIPs already point to this repository. Updates verify downloads, preserve your current inputs and timeline, and restore the previous app if installation or startup fails. Finish your search or import before updating.

If an older version reports that it cannot preserve the session, use **Save Farm**
and **Save Plan** first. Then choose **Start from Scratch**, update, and reload the
saved plan with **Load Plan**. Alternatively, extract the latest full app ZIP
and load your saved files there.

Saved farms and plans stay on your PC. EID import uses a read-only unofficial Egg Inc. endpoint; no game changes are made. Personal account snapshots are excluded from this repository and releases.

## Development and publishing

`npm ci` and `npm run build` rebuild the browser app. `python scripts/package.py` creates a verified ZIP and update manifest. A version increase in `package.json` pushed to **main** automatically runs **Publish App Release**. It builds on Windows, verifies installation/restart/rollback, publishes both assets together, and checks the public update feed. Same-version edits do not release, and existing releases are never overwritten. Manual verification and matching version tags remain available.

Use a local Git checkout for development. Build before launching a source checkout; generated `app.js` and `worker-source.js` are kept out of commits. If terminal push is unavailable, `npm run prepare:publish` prepares the reviewed Git index for one atomic commit through the existing GitHub connection. See `AGENTS.md` and `GitHub-Setup.md`.

The game model uses pinned Wasmegg data and reference code. Third-party notices and artwork credits are included. This project is not affiliated with or endorsed by Auxbrain. See `README.txt`, the current audit, and `THIRD-PARTY-LICENSE.txt` for details.

## Route-aware solver

Automatic Planning compares farm orders, numbers of upgrade visits, purchases,
and departure timing around Specified New Shifts (default 12), a comparison target. Purchase Timeline compares exactly **N+1, N, N−1**, in that order,
where N is Specified New Shifts. N is selected by default when available; a manual
selection survives saving and loading. Automatic search stops at N+1 (at most 30)
and reserves route proposals for all three counts. A missing count is shown as
not found within the search budget, and N=0 has no minus-one option. If N is
unavailable, the fastest available comparison is selected. If none of the requested
counts completes, the best other completion remains available as a fallback timeline.

The three plan options are selectable column headers; comparison metrics are rows.
The table shows shift count, total time, projected end date/time in
24-hour notation, maximum modeled laying and shipping capacity in eggs/hour, and
future Soul Egg cost. Capacities are reconstructed across the entire timeline and
may peak at different times. They are before fuel diversion and empty-silo pauses.
Soul Egg costs apply the sequential shift formula to the starting balance and
lifetime shift count; research and physical upgrades spend gems instead.
Choose a plan header to change the timeline and exports, or review a remaining-plan
selection before applying it. Saved legacy timelines and checked progress are
preserved. New searches/reoptimization produce the new three-count comparison.

After finding the fastest plans, the solver compares extra paid silo purchases
on existing Resilience visits. It prefers up to eight silos (two with a standard
permit) when they add no completion time or shifts. Fewer silos are kept when
additional purchases would delay the plan. Costs, interaction time, sleep hours,
sale timing, and delivery are simulated again before accepting the purchases.

User Selected Sequence preserves the entered order and can stop early once the
TE goal and required missions are complete. Every final Curiosity visit is
for delivery only. Owned inventory and configured launches are included;
future mission rewards are not assumed. The search compares sale timing
internally, with no sale-window selector. The bounded route proposal and purchase
search does not exhaust every possible route or prove global optimality.

On research-capable Curiosity visits, the solver also compares earnings-first
purchase orders. Research that raises income with the current farm goes ahead of
inactive capacity, including unused vehicle slots and train-car limits. Lower-tier
prerequisites and complementary production upgrades can be bought earlier when
needed to unlock earnings. Deferred levels are paid before departure. The solver
compares each visit and opening combinations using actual prices, offline batches,
sleep, sale deadlines, and the complete continuation to the TE target.

The purchase-economics pass also compares research, habitats, vehicles, train
cars and silos against omitting their dependent purchase chains, buying income
first, waiting for a research sale, or buying on a later eligible Virtue visit.
It checks tier counts, fleet slots, engines and train length, pays actual costs,
and completes and replays each alternative. Complementary capacity can still
be bought early when it improves the complete plan. These comparisons retain
the baseline and share the existing bounded search budget.

Further refinement compares new paid purchase packages, including complementary
laying/shipping upgrades, tier prerequisites and engine/car chains. It also tests
additional departure timings. Distinct passes share the remaining search time;
successful kinds receive more attention, and an exhausted queue stops early.
Identical schedule prefixes reuse isolated paid states, while candidates that
can improve the result receive independent full replay before acceptance.

The search also revisits a bounded reserve of discarded purchase branches,
compares purchase families and nearby route edits, and refines departure times
inside long funding waits. Conservative mathematical bounds skip branches that
cannot improve retained plans. Research multipliers and exact TE allocation are
computed with less repeated work. See [search research and limits](SEARCH-RESEARCH.md).

Current-farm searches supplement the established route portfolio with compact
gear/build cycles, including repeated visits up to one more than the specified count.
Local route refinement can add a visit as well as remove or rearrange visits.
Every candidate pays for its purchases, shifts, gear, fuel and required launches.

The app uses Deep search with four independent background workers and a shared
three-minute budget. If a worker cannot start, the remaining workers continue.
Workers share independently replayed complete plans and resume unfinished
refinement comparisons without repeating completed trials. Deep search retains
up to 32 paths, compares purchase packages at depths 2, 4, and 6, and reserves
time for refinement across eight candidate roots, with up to 120 slices per
worker. Stop & Keep Best retains verified candidates. More workers and deeper
search do not guarantee a faster plan or a globally optimal result.

Loading an older plan preserves its saved timeline and search diagnostics; it
does not start a search. Find Best Plan and Reoptimize Remaining Plan use the
installed application's current Deep profile. Check Purchase Order checks only
its declared purchase groups and does not run a full route search.

After the search merges its results, the final choices automatically run the
purchase-order check. Up to two check workers share five additional minutes;
a single-worker fallback shares that time between the plans. The checks compare
subsets and legal orders within groups of up to five purchases, keep only paid,
replayed improvements, and retain progress if stopped. All three available final
plans are checked, with up to two check workers at a time.
Each choice shows whether its purchase check finished. Save Plan retains the
status and checkpoint for each plan. The summary's manual check is a fallback
for older plans or unfinished checks; completed checks need no separate action.
This scoped check does not prove global optimality across routes and departures.

Reoptimizing a checked farm also retimes compatible saved shift-count alternatives
as starting candidates. The current farm, specified shift comparison and remaining
launches stay authoritative. An alternative with a different visited prefix or
incompatible launch review is skipped. Automatic artifact snapshots remain in
new continuations so a saved alternative can replay independently.

The v0.8.23 solver remains in `src/optimizer-legacy.cjs`, with historical replay
routed through it. Developers can use `legacySolver: true` when calling solve
for rollback testing.

## Sleep hours

No Game Interactions During Sleep is checked for new farms and after Start from
Scratch, with a daily window from 23:00 to 07:00. Adjust Sleep Start and Wake Time
or uncheck it. Loaded files retain their saved settings; older files without a
sleep schedule keep sleep disabled for compatibility.
Sleep uses the Sleep & Display Timezone beside Plan Start; Automatic uses your
PC timezone. Plan Start itself is entered in your PC's local time.
Weekly events always run from 09:00 to 09:00 Pacific (America/Los_Angeles),
following PST/PDT: Monday–Tuesday double earnings and Friday–Saturday research
cost ×0.30. The selected timezone controls sleep and displayed dates.
The timezone menu contains common regional choices with UTC offsets, plus
your PC timezone. Uncommon saved selections are retained when files are loaded.

Purchases, shifts, fuel setup, ship collection, and launches must fit while
awake. Passive delivery, earnings, ship travel, and fuel transfers continue.
Sleeping uses offline earnings even with Online Only selected. Voluntary
offline breaks still obey Minimum Offline Break. Refill silos before bed;
production pauses during sleep once current silo coverage expires, then resumes
at wake time. Awake waits retain the routine-refill assumption, and the selected
Video Doubler is still assumed maintained. The target can be passively reached
during covered sleep; claim pending TE when awake. Daily boundaries follow local
daylight saving changes.

The solver simulates these constraints while comparing paid plans. Timeline,
Quick Guide, saved plans, and PDF exports include the sleep timing. Changing
sleep settings requires a new search.
Sleep-enabled R seeds buy coverage for the longest remaining night within the
planning horizon, including daylight saving changes, rather than automatically
buying 24 hours. Purchases still require Resilience, available cash, and the
permit's silo limit. Before enough coverage is bought, empty-silo hours reduce
cash, delivered eggs, and farm-produced fuel in funding and completion estimates.

## Local solver development

With sleep enabled, the route search reserves early Resilience alternatives when
owned silos cannot cover the remaining nights. Paid funding waits also expose
awake departures before bedtime, at wake time, and at a change in research-sale
pricing. These proposals are compared through complete plans within the existing
three-minute budget; they are not mandatory visits or extra shifts.

An existing replay-verified result can be retained when rerunning identical
inputs. When only the starting earnings gear improves, that result may propose
its purchase order for a new solve. Both the old source and the new paid timeline
must strictly replay. Production, research discounts, inventory, sleep, targets,
and all other inputs must match. The actual new gear is used; no completion delay
or extra shifts are accepted. Wait compression is compared after preserving the
verified shift-count alternatives. Other input changes continue to invalidate
previous winners. This safeguard requires an earlier result; a cold bounded
search can still find different-quality paths with different gear.

Run `node tests/sleep-search-quality.cjs` for finite exhaustive sleep, research,
silo, and shift decisions, and `node tests/earnings-incumbents.cjs` for upgrade
reexecution and rejection checks. `node tests/earnings-first-research.cjs` checks
paid research deferral, tier prerequisites, bottlenecks, and complete replay.
`node tests/search-refinements.cjs` checks prefix equivalence, new paid packages,
adaptive work, saved alternatives and partial launch-review mapping. The compiled
worker tests exercise these paths independently of the source modules.
For private baseline comparisons, use:

```sh
node scripts/benchmark-search.cjs --farm ../private-farm.json --baseline ../prior-checkout --budgets 90000 --sleep 23:00,07:00
```

`--incumbent ../saved-plan.json` optionally supplies a previous result. Keep
private inputs and diagnostic outputs outside the source checkout.
