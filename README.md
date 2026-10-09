# Egg Inc. Virtue Farm Optimizer

Unofficial PC app for planning Egg Inc. Virtue farm research, shifts, artifacts, and ship launches.

## Download and run

Download [the latest app ZIP](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/latest/download/Egg-Inc-Virtue-Farm-Optimizer.zip), extract the entire ZIP, and run `Start-Virtue-Optimizer.cmd`. The helper runs in the background and opens the app in your browser. No installation, admin rights, Python, or Node is needed. `index.html` also works offline for manual inputs or JSON files.

Start on **Account** to load your account or saved farm. Continue to **Virtue Farm** to review upgrades, gear, fuel, and flights, then **Planning** to set your target, route, sleep hours, and missions. **Save Farm** retains settings across all three pages. **Load Plan** in the page header restores a **Save Plan** JSON, including its inputs and selected timeline, after replay validation. See **How It Works** for the model's rules and assumptions.

## Updates

Earlier internal builds were renumbered from v1.7.0 to v0.8.0. If your internal
build has a higher version number than the current public release, download and
extract the current ZIP once; the updater does not install lower version numbers.
Public v0.x installations can update to v1.0 normally.

Use **Update App → Update & Restart** in the sidebar. Published ZIPs already point to this repository. Updates verify downloads, preserve your current inputs and timeline, and restore the previous app if installation or startup fails. Finish your search or import before updating.

Saved farms and plans stay on your PC. EID import uses a read-only unofficial Egg Inc. endpoint; no game changes are made. Personal account snapshots are excluded from this repository and releases.

## Development and publishing

`npm ci` and `npm run build` rebuild the browser app. `python scripts/package.py` creates a verified ZIP and update manifest. A version increase in `package.json` pushed to **main** automatically runs **Publish App Release**. It builds on Windows, verifies installation/restart/rollback, publishes both assets together, and checks the public update feed. Same-version edits do not release, and existing releases are never overwritten. Manual verification and matching version tags remain available.

Use a local Git checkout for development. Build before launching a source checkout; generated `app.js` and `worker-source.js` are kept out of commits. If terminal push is unavailable, `npm run prepare:publish` prepares the reviewed Git index for one atomic commit through the existing GitHub connection. See `AGENTS.md` and `GitHub-Setup.md`.

The game model uses pinned Wasmegg data and reference code. Third-party notices and artwork credits are included. This project is not affiliated with or endorsed by Auxbrain. See `README.txt`, the current audit, and `THIRD-PARTY-LICENSE.txt` for details.

## Route-aware solver

Automatic Planning compares farm orders, numbers of upgrade visits, purchases,
and departure timing within Maximum New Shifts (default 12). The maximum is a
ceiling. Purchase Timeline shows up to three fastest complete plans found with
distinct shift counts, sorted by finish time, with fewer shifts preferred when times tie.
Each choice has its own summary, Quick Guide, and JSON/PDF exports. Saved plans
retain every choice; older single plans and sale comparisons can also be loaded
and replayed.

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
90-second budget; they are not mandatory visits or extra shifts.

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
For private baseline comparisons, use:

```sh
node scripts/benchmark-search.cjs --farm ../private-farm.json --baseline ../prior-checkout --budgets 90000 --sleep 23:00,07:00
```

`--incumbent ../saved-plan.json` optionally supplies a previous result. Keep
private inputs and diagnostic outputs outside the source checkout.
