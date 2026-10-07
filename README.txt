EGG INC. VIRTUE FARM OPTIMIZER 0.8.20 — PC EDITION

GET STARTED
1. Extract the entire ZIP; open the Egg-Inc-Virtue-Farm-Optimizer folder.
2. Double-click Start-Virtue-Optimizer.cmd. It opens the app in your browser.
3. The local helper runs in the background for EID import and updates. No
   command window needs to stay open. The CMD launcher may flash briefly.
   Closing the browser leaves the helper running until Windows signs out or
   shuts down. Launching again reopens the same running installation.

For startup troubleshooting, run Start-Virtue-Optimizer.cmd --console from a
command prompt. This starts a visible helper; Ctrl+C stops that diagnostic run.
Background startup errors appear in a Windows dialog.

You can also double-click index.html for fully offline use. In that mode, enter
farm values or load a JSON farm/backup. No installation, domain, Python or Node
is required to use the app. Use a current version of Edge or Chrome.

UPDATES
Select Update App in the sidebar, then Update & Restart when a release is
available. It verifies the download, preserves current inputs and your timeline,
installs app files and reopens at the same local address. Saved farm/plan files
and browser settings are retained. Failed installation or startup restores the
previous app. Finish or stop a search or account import before updating.

Published releases already point to the public GitHub update repository.
If you still run a 1.x version, extract the latest ZIP once; updates never
downgrade. Future 0.x releases install through Update App. Use Update Source
to connect a source checkout if needed. No GitHub credentials are stored.
Direct index.html use remains offline; launch the CMD file for updating.

YOUR FARM
Click Start from scratch to clear all farm values, upgrades, artifacts, and the
current plan. Any running search stops. Exported files remain available to load.

The app opens on Account with an empty farm. Load your account or saved farm,
continue to Virtue Farm to review current upgrades, gear, fuel, and flights, then
continue to Planning. Save Farm and Save Plan remain portable backups. Reset
offers Undo for the current session; browser recovery is not used.

Enter your Egg Inc. ID and press Enter to load account information
and the current Virtue farm from one backup request. If no Virtue farm is active,
account information still loads, with a notice at the top. Existing starting
farm values, equipped gear, and start time are kept in that case. A found farm
refreshes those values and sets the start to now. Planning goals are retained. Owned Virtue inventory refreshes the automatic
earnings and delivery sets. Existing flight fuel is not spent again.
Account and Virtue Farm are separate pages with independent Edit Manually
settings. Account holds Soul Eggs, permit, switch history, TE progress,
Colleggtibles, and Epic Research. Virtue Farm holds current farm upgrades,
tabbed artifact sets, Common Research, fuel, and flights. Account imports lock account fields; a found farm also
locks farm fields. Goals remain editable. Artifact sets unlock with Edit Farm Manually.

Use Load farm for your saved farm or JSON
backup, use the EID field, or enable manual editing to enter values.
Load farm also accepts saved plans and validates them by replaying purchases.
The standard Switch Sequence is C K I C K R C H K C I R H. Older farms using
the previous standard sequence are upgraded automatically. New searches use
the full route; other custom sequences and saved plan walkthroughs are preserved.

Start from scratch enables automatic Virtue routing and begins with the free
Coop, Trike and one silo. Additional purchases require the matching Virtue.
Enter your actual Soul Eggs before planning switches; clearing sets them to zero.
Fresh farms use automatic online/offline waiting. Keep the starting silo refilled.

Use Continue to Virtue Farm, then Continue to Planning. Review artifacts and
review Common Research on Virtue Farm before planning. Research opens by default;
fully maxed tiers start collapsed and show (Maxed). Common Research shows
each item's next cost and total remaining cost at current discounts/sale prices.
Tier prerequisites are not included in that item's remaining cost. The target
defaults to claimed TE + 40 (up to 490), updating after import or manual progress
edits until you enter your own target. Next Ascension starts with this default.
Planning has goals,
ship schedules and timing, with a compact starting-farm summary. Assumptions
are on How It Works. Save Farm includes settings from all three pages.

Set your total TE goal and opening time limits. Optimized Sequence compares
1, 2, and 3 research-sale plans and derives the switches needed for its route.
Select User Selected Sequence to enter your own full order (up to 30 switches).
Click Find Fastest Plan. Purchase Timeline shows clickable research-sale choices,
with the fastest plan found selected initially. Each choice shows its own plan
summary, Quick Guide, purchases, and walkthrough export. Save Plan retains all
alternatives and your selected choice for replay when loaded later.

C = Curiosity (research), I = Integrity (habs), K = Kindness (vehicles),
R = Resilience (silos), H = Humility (artifacts and ships).

Choose each individual colleggtible bonus in its dropdown. The app multiplies
bonuses for the same stat automatically and shows the combined totals. EID/JSON
backup imports retain exact tiers. Older farm files store totals only, so their
individual selections are reconstructed to match; review those selections.

All rates are recalculated from research and configured loadouts. Game numbers
accept scientific notation and case-sensitive suffixes: 1q = 1e15, 1Q = 1e18.

WHAT "TARGET TE" MEANS
The plan ends when claimed + pending TE reach your target. Pending TE can be
claimed at ascension; they do not increase earnings during this run. Ascension
and the next run are outside this plan. Optional per-Virtue minimums are supported.

ASSUMPTIONS
Habitats fill immediately, as requested. Maintain silo coverage and the selected
video doubler. No boosts, running chicken bonus, drones, gifts or mission rewards
are simulated. Ship fuel diversion is modeled only during listed filling steps;
pause other fueling for the predicted delivery rate.
Manual loadouts must be ones you can actually equip. Their ownership/socketing
costs are not enforced. Set changes are allowed only while visiting Humility.

Habs can be purchased only on Integrity; vehicles and train cars only on
Kindness. These rules apply from the start, including to older farm files.
Start from scratch includes the free Coop, Trike and one silo.

Monday 09:00 to Tuesday 09:00: 2x earnings.
Friday 09:00 to Saturday 09:00: research cost x0.30.
New farms default to the timezone detected by your browser for both weekly
event times and displayed dates. Override Event Schedule Timezone in Planning
as needed; saved farms and plans retain their selected zone.
The start date/time uses your PC's local time.

SEARCH QUALITY
Before searching, a conservative feasibility check can prove that a target
cannot fit the entered time limit. It grants instant equipment, continuous
2x earnings and best research discounts, so its displayed TE ceiling is an
optimistic upper bound, not a promise of an achievable plan. Epic Research
persists across ascensions; enter your owned levels after clearing farm data.

Optimized Sequence retains the best complete plan for each of the three sale
counts across opening budgets and waiting policies. User Selected Sequence uses
the full entered route and an additional Balanced heuristic purchase search.
This is not a proof of global optimality. Every completed alternative is replayed
to check affordability, research prerequisites, permissions, Soul Egg costs, and
the target. Sale counts set the C3 research window through the corresponding
upcoming weekly sale; research may finish earlier and finish times may tie.
Stopped searches retain only complete alternatives from the current run.

VALIDATION
- Simulator matches the saved v1.5 workbook rates and Friday research pricing.
- All 98 TE thresholds, Monday/Friday boundaries, gems resets and shift costs tested.
- Small research-order problem checked against exhaustive enumeration.
- Workbook 160 to 200 TE plan replayed.
- Browser worker, JSON save/load, exports, socket editing, stopping and layout tested.
- Local helper HTTP/session/access behavior tested using PowerShell 7.5.3 on Linux.

LIMITS OF TESTING
A read-only live Egg Inc. backup request succeeded for v1.5.5. That saved backup
reported no active Virtue flights; occupied slots and return times were validated
with synthetic protobuf backups. Native Windows PowerShell 5.1 execution could not
be tested here; the helper uses APIs available in that version.
Use JSON backup import/manual inputs if EID loading is unavailable or the API changes.

FILES
index.html, app.js, worker-source.js, style.css: finished offline app.
Start-Virtue-Optimizer.cmd, Local-Helper.ps1: local Windows launcher/API proxy.
workbook-farm.json: editable starting profile.
VALIDATION.json: validation results and material limitations.
src/, scripts/, tests/, package.json: source and reproducible developer checks.
THIRD-PARTY-LICENSE.txt: Wasmegg, protobuf.js and long.js licenses.

For developers only: npm install, npm run build, npm test. npm run package
uses Python 3 to build the release ZIP with the standard folder name. Node is not required
for normal use. Game data is pinned to Wasmegg commit
 a089580df4cc6cce8a2f5a9a7dcf86583a2c216d
https://github.com/wasmegg-carpet/egg

LONGER PLANNING WINDOWS
If no route is found within your entered limit, the app checks rebuild routes in a separate 366-day window. It offers a replay-validated alternative with its actual duration when available. Click "Use 366-day limit and view this plan" to apply it. Your limit is not changed automatically. Failure to find a short route is not proof that none exists.

Max-Epic-Validated-Plan.json contains the latest supplied fresh farm with max Epic Research and a validated 200 TE route taking about 143.31 days (twelve switches). Load this file to inspect the full walkthrough. It satisfies the original 160-day limit. Lifetime delivered eggs persist across ascensions; claimed TE imply a minimum previously delivered total. Older files with zero totals and nonzero claimed TE now use that minimum, without adding any pending TE.

WASMEGG COMPARISON
The automatic result now values Graviton Coupling for separately purchased car capacity and keeps a sale-aware research route. With strict Virtue purchase rules, the earlier automatic route reached 200 TE in about 148.97 days with 12 new switches. The earlier 141.16-day automatic route used an invalid starting-stage purchase exception and has been replaced.
Matched-Wasmegg-Plan.json replays a three-sale route generated from Wasmegg source using this farm and the artifacts evidenced in its saved sets, taking about 141.20 days with 12 new switches. Load either plan to review the walkthrough. Wasmegg-Comparison.md records the comparison assumptions, measurements and limitations. The exact reported 140-day plan was not supplied.

LIFETIME DELIVERY INPUTS
Lifetime delivery fields accept and display case-sensitive game notation, such as 1.564Q. Q means 10^18 eggs; lowercase q means 10^15. Full numbers and scientific notation also work. Loaded values retain their full precision rather than being rounded to three decimal places for editing.

WALKTHROUGH
Levels of the same research within a batch purchased at the same instant are shown as one level range, with their combined cost. Waits and switches remain separate; saved plans retain every individual purchase for replay validation.

ONLINE AND OFFLINE WAITS
Automatic online + offline compares the fastest online purchase time against an offline break of at least 60 seconds. Away bonuses apply to the whole eligible offline break. Purchases and switch interaction time earn online income. gems collected on return can fund multiple research levels immediately. The detailed timeline identifies online/offline waits; online waits under 10 seconds are omitted from that display. The PDF summary includes total online and offline waiting for each shift. Online-only mode remains available. Offline breaks assume maintained silo coverage.

COMPACT WAIT DISPLAY
Online waits shorter than 10 seconds are hidden from the detailed timeline. Exactly 10 seconds, longer waits, and all offline breaks remain visible there. Hidden waits still count toward elapsed time, gems and egg delivery, PDF waiting totals, and saved plans for replay.

WASMEGG STAGED STRATEGY
Planning strategy offers Optimized Sequence or User Selected Sequence. Compatible sequences share the stage purchase rules; entered visit order is preserved. The full optimized route uses 12 new switches from Curiosity. Research-sale counts and all C1/K1 budget pairs are compared. Stage proposals are independently replayed with actual costs, permissions, interaction times and minimum offline breaks.

C1 (configured limit; default 60 minutes): fleet size and Graviton Coupling priorities.
K1 (configured limit; default 60 minutes): best affordable vehicles.
I1: all four Chicken Universes; moves ahead of K1 if it completes in <1 hour.
C2: finish fleet research; attempt Graviton Coupling within the four-hour budget.
K2: max vehicles and train cars.
R1 (<=1 hour): affordable silos.
C3: remaining delivery research over the compared research sales.
H1: best delivery rate among configured, fixed artifact loadouts.
K3: new train cars, then Kindness's TE share.
C4/I2/R2/H2: wait for each remaining Virtue's TE share.

PLANNING ASSUMPTIONS
Habitats stay full; estimates are most reliable at approximately 100 TE or more. Artifacts do not improve during a plan. There are no sleep periods. Silo/video coverage must be maintained. Each plan covers one ascension. Start next ascension immediately begins at the prior plan's finish, preserving claimed TE, lifetime deliveries, Epic Research, artifacts, remaining Soul Eggs and total shifts, while resetting gems and common farm upgrades. Review these inputs before running the next plan. Actual results may vary.

Wasmegg-Staged-Plan.json is a newly generated, replay-validated fixed-stage plan for the supplied max-Epic farm.

VERSION 1.1
C1 and K1 maximum time are individually editable in Planning Goal, in whole minutes from 30 to 300. Defaults are 60 minutes each. Limits are saved with farms/plans and retained when starting the next ascension. They constrain the first visits on staged, fixed and free routes, including breaks, fuel collection and interaction time.

WAIT BATCHING AND SHIFT SUMMARIES (VERSION 1.1 UPDATE)
The solver compares runs of short online purchase waits with one uninterrupted offline break of at least 60 seconds. It evaluates a one-minute break and a longer break that funds the purchase batch, using the earnings rate before those purchases. Staged routing retains individual-purchase and batch alternatives and picks the fastest complete TE plan found. Free routing also explores batches of successive research levels or train cars. The comparison is bounded lookahead, not a guarantee of the global optimum. Online-only mode disables offline batches.

Each shift card now summarizes completed tiers, combined research ranges, habitat/vehicle upgrades, train cars, silos and artifact changes, plus exact duration, TE gained and online/offline waiting totals. Click a card for the quick guide, then open Full breakdown for the detailed purchase timeline. Short online gaps hidden from that timeline still count toward every total. Switch/purchase interactions are listed separately from gems waits. The PDF walkthrough and saved plan include the summaries.

Shift summary research items follow the in-game research order. Every card and PDF summary includes its end date/time in the selected event timezone.

PDF WALKTHROUGH EXPORT
Export walkthrough opens the PDF in a new browser tab without an automatic download. It includes the compact shift summary timeline and the quick guide, with research in game order, shift durations, TE gained, end date/time, waiting totals, C1/K1 limits, research levels before each break, break times and resume dates. Fonts are embedded and long timelines are paginated. Saved plans can be loaded and exported without running the solver again. Save plan remains the JSON file for replay and future editing.

VERSION 1.2 — QUICK GUIDE
The purchase timeline has three layers: shift summary, quick guide, and full breakdown. Opening a shift shows grouped purchase targets before each offline break or online wait of at least 10 seconds. Each research item shows its starting and ending level for that group, in game order; fully completed tiers remain expanded into individual items here. Habitat/vehicle purchases, train-car ranges, silos and artifact changes are also included. Each break shows its mode, duration, start and resume date/time. Short online waits and interaction time stay within the purchase group and count toward all timings. Full breakdown is collapsed until opened; Expand all opens both layers. Existing saved plans work without solving again. PDF export includes the compact shift summary and quick guide.

VERSION 1.2.1 — SAVED GOALS AND OFFLINE BREAK PREFERENCES
Save farm now stores and restores every planning control, including Search effort. It also preserves the new Minimum offline break (minutes) setting, which accepts whole minutes from 1 to 1440. Older files default to Balanced effort and a 1-minute break. Both preferences are carried into saved plans and the next ascension.

A longer minimum, such as 5 or 10 minutes, can reduce the number of offline earning breaks. Every generated offline wait must meet the selected minimum. The solver may stay online when that reaches the purchase or TE target sooner, so short final collection waits do not unnecessarily extend the run. Weekly events remain integrated across each uninterrupted break.

The solver compares individual waits, its original short-online-wait batching schedule, and a schedule that also combines multiple offline earning waits. It tests bounded purchase groups with one upfront break at the pre-purchase earnings rate, preserves the original schedules as alternatives, and compares complete TE finish times. Run time is the primary objective; equal finish times favor fewer offline breaks, then fewer switches. Raising the minimum changes the allowed schedules and can increase or decrease total run time; fewer breaks are not guaranteed on every farm. Every selected plan is fully replayed against real affordability, permissions and the configured minimum.

VERSION 1.2.2 — APP NAME AND SAVE FILENAMES
The app is named Egg Inc. Virtue Farm Optimizer. Save farm defaults to virtue-farm-160TE.json for a farm with 160 claimed TE. Save plan defaults to virtue-farm-160TE-136d-22h-54m.json for a plan starting with 160 claimed TE and lasting 136 days, 22 hours and 54 minutes. All three duration components are included, including zeros, using the same second rounding as the timeline and omitting seconds from the filename. Starting TE uses claimed TE; pending TE are not included. Plans use the original saved starting inputs and run duration even when the current form has changed. JSON contents and loading remain compatible with older files.

VERSION 1.2.3 — PDF PREVIEW AND QUICK GUIDE
Export walkthrough opens a browser tab containing the PDF. It does not automatically download; Save PDF is available in that tab, along with the browser PDF controls. Allow pop-ups for the local app if your browser blocks the new tab. The PDF starts with compact shift summaries, followed by every quick-guide purchase group, individual research level ranges, online/offline break durations and resume dates. Purchase groups are paginated with their upcoming break. Existing saved plans can be loaded and exported without running the solver again.

VERSION 1.2.4 — TIER-GROUPED QUICK GUIDE AND PDF FILENAME
Quick-guide research appears one item per line, grouped under tier headings and sorted in game order, in both the app and the PDF. Each row retains its starting and ending level. Other purchases are listed separately. PDF pages repeat tier headings when a purchase group continues onto another page. Save PDF defaults to the same starting-TE/duration convention as saved plans, e.g. virtue-farm-160TE-136d-22h-54m.pdf, using the original plan inputs.

VERSION 1.2.5 — RESEARCH LEVELS BESIDE NAMES
Quick-guide research level ranges sit directly beside the research name, like the summary, in the app and PDF. Each research retains its own row, with tier headings and in-game order.

VERSION 1.3.3 — FIXED OPENING INTERVALS
Every search starts fresh. Shared purchase comparisons use C1 and K1 opening budgets at fixed 30-minute intervals (30, 60, 90, ...). Set each maximum independently from 30 to 300 minutes; both default to 60. Automatic routing and compatible fixed sequences search interval multiples at or below each maximum. Other fixed routes enforce the entered ceilings through the general purchase search. Visits can finish sooner when their purchases are complete. There is no extra one-minute opening candidate or editable interval field.

At 60-minute maximums, each farm compares 30 and 60 minutes: four pairs. At 300-minute maximums, each farm has ten choices: 100 pairs. Higher maximums take longer to compare. Each pair evaluates the complete TE target, research-sale alternatives and online/offline waiting policies. All pairs are checked unless Stop & keep best is used, which retains only a complete plan from the current search and marks the comparison incomplete. Search effort controls the additional free-routing search in Best found mode. This compares opening budgets, not all possible purchase orders or departure seconds, and does not prove the global optimum.

Previous plans still load and replay. Older custom intervals are ignored during new searches and removed from new saves. Older maximums outside 30–300 minutes are brought into range for new searches and when displayed in the farm controls; original saved-plan inputs remain attached to their timeline and exports. Offline earning breaks retain the game-required one-minute minimum.

PERFORMANCE
Research proposals reuse event schedules, tier totals, artifact inventory parsing and delivery loadout calculations within each stage invocation. Caches are cleared before and after each invocation; no earlier plan seeds a new run. Simulator research categories are parsed once and refreshed if data changes. This preserves exact purchase/wait schedules while reducing solver processing time.

VERSION 1.3.4
Planning goal now has shorter labels and hints, a compact opening-budget count,
and expandable planning notes. All goal, routing and calibration controls remain
available. The solver and saved farm/plan formats are unchanged.

VERSION 1.3.5
Load file is now Load farm. Removed the Workbook snapshot button and automatic
workbook prefill; fresh sessions open with an empty farm. Existing farm and plan
files still load. Tier unlocks count common-research levels in lower tiers, and
every purchase is checked against those prerequisites.
A suggested longer-window plan remains selectable after a failed rerun when
inputs were unchanged during the search; input changes still require a rerun.

VERSION 1.3.6
Timing and calibration fields are always visible at the bottom of Planning Goal.
All model assumptions are consolidated in an Assumptions panel at the bottom
of Farm & Goal. The form labels the currency as Current Gems; existing JSON
keys and saved farms remain compatible. Interface labels use Title Case.

VERSION 1.3.8
New farms use the Wasmegg CKI switch sequence (C K I C K R C H K C I R H)
and a 12-switch budget. Automatic staged routing still considers CIK starts.
Existing custom routes are retained on import. The search timer shows seconds
and ticks every second, including during stage calculations and longer-window
checks. All quick-guide purchase quantities sit beside their labels in the app
and PDF, matching research rows.

VERSION 1.4.10 — HIDE THE FIXED SEQUENCE
Choose Virtue Visits Automatically hides the Switch Sequence entry and its
related notes. Unchecking it restores your previous sequence. Loaded farms,
saved plans and draft inputs restore the same visibility setting.

VERSION 1.4.9 — OPENING LIMITS ON EVERY ROUTE
C1 and K1 maximum times now constrain their first visits on fixed and free
routes as well as staged routes. Online/offline breaks, fueling and interaction
time are included. Later Curiosity/Kindness visits have their normal budgets.
New plans replay these limits before export and when loaded. Older walkthroughs
remain readable; those exceeding the selected opening limits show a rerun note.
The first farm label uses its own visit, so a later H1 ship launch cannot label
an earlier Curiosity visit as Humility. Summary, quick guide and PDF use the
same corrected labels. New-switch limits continue to remain unchanged.

VERSION 1.4.8 — KEEP YOUR SWITCH LIMIT
Maximum New Switches is preserved when loading an older farm, choosing the
Wasmegg strategy, or starting the next ascension. Those flows previously raised
lower limits to 12 or 13. Both fixed and automatic solvers use the entered limit
as a ceiling on new switches; lifetime switches do not count against it.
The full staged Wasmegg route still requires 12 new switches from Curiosity
(13 from another truth egg). If your limit is lower, the search explains
the conflict without changing it. For fewer switches, enter a shorter User Selected Sequence.
Use Full Sequence remains an explicit way to raise the limit for a fixed route.

VERSION 1.4.7 — SWITCH LIMIT FEEDBACK
Fixed sequences show the number of new switches needed from the current farm.
If Maximum New Switches cuts off later visits, the app explains that below the
sequence and offers Use Full Sequence to raise the limit explicitly. Your limit
is never changed automatically. Existing prefix-only routes and plans still
work and replay.

If the limit excludes H2, the error identifies the limit, H2's switch number
and the limit required for the complete sequence. It no longer claims H2 is
missing from an otherwise valid entered sequence. A genuinely missing second
Humility visit still requires another H in the sequence.

C K I C K R C H K C R H I needs 12 new switches from Curiosity; H2 is switch 11.
Starting on another Virtue prepends the current farm and requires 13 switches
for the complete route. The launcher reads version 1.4.7 automatically and the
release folder remains Egg-Inc-Virtue-Farm-Optimizer.

VERSION 1.4.6 — FRESH FARM FIXED ROUTES
Release folder: Egg-Inc-Virtue-Farm-Optimizer. The launcher banner and console
window title read the current app version instead of retaining an old version.
Fixed sequences now run the same research/physical-upgrade planning pass used
by automatic routes, while preserving the exact entered visit order. The beam
search can improve those complete routes rather than finding every purchase
from scratch. Existing C1/K1 opening grids still apply to automatic staged
routes; fixed routes use the free purchase search.

Ship fuel is collected on the last visit to its source egg before the next
Humility launch when using a fixed sequence. A fresh C1/K1 farm no longer tries
to produce the entire tank while later upgrade/source visits are available.
Starting stock, H1 consumption, H2 reserves, tank capacity and fuel diversion
still apply. Saved plans replay as before.

Validated C K I C K R C H K C R H I from a fresh 160-TE farm to 200 TE within
160 days, with both stocked and empty fuel tanks (5T starting Integrity).
Each Humility visit launches seven Extended Henerprises and two Extended
Cornish-Hens. Every purchase, fuel collection and launch passed strict replay.

VERSION 1.4.5 — PASTED SWITCH SEQUENCES
Switch Sequence accepts ordinary C/K/I/R/H codes, full Virtue names, compact
code strings and numbered labels such as C1 or H2. Spaces, commas, arrows,
dashes and line breaks separate steps. Copied quotes, backticks and invisible
formatting characters are removed before parsing; full-width letters are
normalized. Fixed routes show the recognized order beneath the entry field.
An unrecognized item is identified by name rather than a generic error.

C K I C K R C H K C R H I is accepted, including when copied with surrounding
backticks or invisible formatting. Farm saves retain the entered text and
restore it; solver validation and replay use its normalized route. Existing
stage rules, fuel requirements and switch limits still apply.

VERSION 1.4.4 — SAVE FARMS WITH PLANNING ERRORS
Save Farm no longer requires a feasible plan. Routes, ship counts, fuel stock,
goals and other farm values can be saved and loaded while the solver reports
an error. Invalid or incomplete entry text is preserved in an editable draft;
loading it restores the entry fields, with planning disabled until corrected.
EID and file-picker values are not included in these drafts. A corrected save
uses the usual farm format and filename.

The tank-capacity message now explains launch consumption. H1 launches release
space, but any H2 fuel without a refill stop must already be reserved before
H1. With seven Extended Henerprises and two Extended Cornish-Hens at each visit,
a 500T tank cannot reserve both 140T Resilience allocations alongside H1's
other fuel: the minimum is 630.04T. Move R2 before H2, for example
C K I C K R C H K C R H I, to refill after the first fleet launches. Starting
with 5T Integrity covers both pairs of Cornish-Hens without an I2 fuel refill.

VERSION 1.4.3 — FUEL CARRYOVER IN CUSTOM SWITCH SEQUENCES
Fixed switch sequences can collect H2 fuel before H1 when there is no refill
stop for that egg between the Humility visits. The plan reserves enough for
both visits, accounts for H1 consumption, and includes any collection step.
Tank capacity must hold the first fleet's fuel and all fuel reserved for H2;
otherwise the error names the fuel source that needs another stop.

Stored fuel carries forward without forcing a new visit just for fueling.
For example, two Short Cornish-Hens use 10B Integrity per visit: starting with
5T leaves 4.98T after both visits, so no I2 refill is needed. An Integrity visit
may still be needed for its TE goal or habitat purchases.

Automatic completion routes also skip fuel-only visits when the remaining
stock already covers the next fleet. The planning estimate shows fuel reserved
for H2, and old saved plans still replay with their original purchase timeline.

VERSION 1.4.2 — USER-PLANNED SHIPS FOR H1 AND H2
Planned Ships now has two independent mission lists: First Humility Visit (H1)
and Second Humility Visit (H2). Enter ship types, mission lengths and launch
counts for each visit. Add up to eight mission groups per visit, leave one
count per visit blank for Tank Maximum, or leave either visit empty. Copy H1
to H2 duplicates the first list; subsequent edits remain independent. The
previous automatic efficient-fleet preset is no longer a planning control.

The solver collects missing H1 fuel before the first visit, then refills for
H2 after H1 on K3, C4, I2 and R2 as needed. Both visits share the configured
mission slots and use FTL Drive Upgrades from the existing Epic Research field.
Unused tank fuel carries forward. If surplus stock blocks the required fuels,
the walkthrough lists only the excess that must be discarded to make room.
Tank Maximum is a fuel-capacity limit based on known inventory; later-visit
estimates conservatively retain stored Humility fuel because farm production
and tank transfer happen together. A planning window can limit launch counts.

Each run pays its own gem costs and includes funding, fueling/transfer,
interaction time and earlier ship-return waits. Ships still in flight retain
their occupied slots across visits and Next Ascension. The final ships do not
need to return before proceeding to the next step. Fuel eggs produce no TE or
gem earnings while fully diverted. The ship planner compares two launch orders
for mixed fleets of up to 5,000 missions, keeping long flights in the final
slots to reduce waiting; larger runs use the original scheduling rule.

Both mission lists and the tank inputs save and restore with the farm and
plan. Historic custom missions load into H1 with H2 empty. A saved automatic
preset becomes editable mission lists, using its actual saved counts when
available. Historic saved walkthroughs still replay with their original rules.
The app and PDF show separate H1/H2 schedules, launch dates and refueling.
Two-Ship-Visits-Validated-Plan.json is a complete example from a fresh
common-research farm with different ship plans for its two Humility visits.

VERSION 1.4.1 — EFFICIENT FLEET ON BOTH HUMILITY VISITS
FTL Drive Upgrades remains on Epic Research. The duplicate planner field is
removed; new plans use the existing research value (0–60 levels).

Efficient Fleet is the default ship setup. It requires a 500T tank, unlocked
Henerprise and Cornish-Hen Corvette ships, and three available mission slots.
The tank recipe for EACH trip is 175T Curiosity, 175T Kindness, 140T Resilience,
and 9T Integrity (499T total). Actual stock is entered on the Farm page; missing
fuel is collected in the walkthrough. Any surplus above these limits is listed
as a discard step before filling the tank. Fuel never counts toward TE or gems.

H1 and H2 each launch seven Extended Henerprises. Short Cornish-Hen Corvettes
fill spare slots during the middle Henerprise return wait. Their number is
calculated from fuel, costs, transfer/interaction time, and available return
slots. An optional Corvette is accepted only if it does not extend the same
Henerprise schedule without Corvettes. This is the explicit Corvette-duration
assumption for the recommended setup; the Integrity reserve is not a command
to launch every Corvette the tank could support. A fully upgraded tested farm
fits 46 Short Corvettes per trip alongside the seven Henerprises.

After H1, replenish Kindness on K3, Curiosity on C4, Integrity on I2, and
Resilience on R2. Only consumed/missing fuel needs replacing. The plan then
launches the same fleet at H2. Both schedules include launch gems, fueling,
earlier return waits, and interaction time. Final returns are not awaited:
continue the listed TE collection or next switch after the final launches.
H2 delivery during mandatory ship waiting is included when choosing TE shares.
Next Ascension retains active ship return times so a later trip cannot reuse
occupied slots early.

Choose Custom Missions for the previous first-Humility-only controls, or No
Ship Missions to plan without launches. Imports with smaller tanks select No
Ship Missions and show the reason. Historic saved plans replay with their
original FTL/scheduling rules. Newly saved farm/plan files use Epic Research
FTL and preserve the selected setup. Both ship visits, exact launch timestamps,
and post-H1 refueling appear in summaries, quick guides, and the PDF.
Efficient-Fleet-Validated-Plan.json is a replay-validated 160-to-200 TE example
from a fresh common-research farm; load it to inspect the full walkthrough.

VERSION 1.4.0 — SHIPS AT FIRST HUMILITY
Farm inputs now include the fuel tank capacity, editable output rate, and stored
fuel for all five Virtue eggs. Selecting capacity fills the standard output rate.
Tank values accept exact game suffixes and are saved with every planning goal.
Egg Inc. backup imports read the Virtue tank contents/capacity and FTL level.

Planning Goals lets you choose ship types, Short/Standard/Extended missions,
launch counts, FTL Drive Upgrades, and 1–3 mission slots, with existing flights accounted for. Add up
to eight mission groups. Leave one launch count blank for Tank Maximum: the
largest run the shared tank can support, accounting for other planned missions
and existing fuel. Humility-only ships require an explicit count. The maximum
is a fuel limit; a shorter planning window may require fewer launches.

The solver collects missing non-Humility fuel before the first Humility visit.
The staged route fills after I1, K2, R1 and C3 as needed, using the current full
laying rate. Full egg diversion gives no gems or delivered TE during filling.
There is no automatic dumping; stored fuel not used by missions is retained.
Humility fuel comes from the farm and available stored Humility eggs. Farm and
tank fueling run in parallel, with tank fuel types flowing one at a time.

All planned launches happen during the first Humility visit (or immediately
when starting on Humility with enough stored non-Humility fuel). The plan pays
launch gem costs, includes fueling/transfer and configured interaction time,
and waits for earlier returns when all slots are occupied. It continues with
the remaining switches immediately after the final launches and artifact
change. It does NOT wait for the final ships to return. With three available
slots, three ships need no return wait; four need one earlier return. Mixed
mission groups now follow their entered rows from top to bottom (v1.4.12),
completing every launch in a row before starting the next row. The solver
includes the return waits required by that order.

The shift summary, quick guide, full breakdown and PDF include ship activities,
fuel collection, first/final launch dates, and departure after the last launch.
Expand Launch Schedule to see each launch time/slot and return/funding waits.
The PDF includes that schedule after the quick guide.
Ship runs are independently replayed during validation and saved-plan loading.
Selecting no missions preserves the previous solver behavior. Ship selection
assumes already unlocked ships; imported flight return times occupy slots.
Rewards, improved
artifacts, sleep schedules and special duration/fuel events are not predicted.
Return promptly for the next launch and maintain silo/video coverage.

Mission fuel, duration, launch prices and FTL rules verified against Wasmegg:
https://github.com/wasmegg-carpet/egg
Standard tank output rates verified against the Egg Inc. Wiki:
https://egg-inc.fandom.com/wiki/Fuel_Tank

Developer ship checks: node tests/ships.cjs and tests/ships-browser.cjs.

VERSION 1.4.11 — SHARED PURCHASE PLANNING
- Free Routing Only includes the same stage purchase candidates as Wasmegg.
- Copying the same upgrade route into Free Routing Only uses the shared buying rules, including offline batches, sales and every 30-minute C1/K1 budget pair.
- Fixed CKI/CIK openings and reordered final TE visits stay in the entered order.
- Automatic free routing can retain a staged plan within the selected horizon while searching for faster routes.
- C1/K1 limits, switch ceilings, ship fuel consumption and final-return exclusion remain enforced.

VERSION 1.4.12 — SHIP LAUNCH ORDER
- New ship plans launch each H1/H2 mission row in the order entered, completing the row before moving to the next.
- Repeated ship/mission rows stay separate in the purchase timeline.
- The solver estimates H2 delivery and calculates return waits, fuel and gems using that same order. It still departs after the final launch without waiting for final returns.
- Existing saved plans retain their original schedule and still replay. Rerun a farm or plan to apply entered order.

VERSION 1.5.0 — AUDIT AND RELEASE CLEANUP
- Independent comparison against Wasmegg source: 358 farm states, 13,980
  research prices, hab/vehicle/car prices, tier unlocks, colleggtibles and ships.
  See the current release audit and Wasmegg-Comparison.md for scope, evidence and limits.
- Fresh farms and new ascensions start with one free silo. Older zero-silo farm
  files use one silo for new searches; old saved timelines retain original counts.
- Reuse event boundaries and immutable calendars; price checks avoid recalculating
  the entire farm. No saved plan or farm state is retained to seed a new search.
- Compact result summary; expandable Search Details keeps diagnostics available.
  Context guidance explains low-TE fill-time estimates, long-break silo coverage
  and event schedule overrides. Earning breaks do not count routine silo refills.
- Search-effort times apply to the added free-routing search after complete staged
  comparisons. Larger staged grids preserve smaller candidates; the extra timed
  heuristic search can vary. No global-optimum guarantee is made.
- Version branding is shared by the app build, PDF exporter and local launcher.
  Existing farm/plan files, mission row order and all three timeline layers remain.


VERSION 1.5.1 — INTERACTION AND PERFORMANCE REVIEW
- Planning settings grouped into Target & Timing, Search & Events, and Opening
  Visit Limits. Timing & Calibration remains visible.
- Errors identify the field and Review Inputs takes you there.
- Changed inputs mark the previous timeline and block its next ascension.
- Start from Scratch offers Undo Reset, including partially entered values.
  Undo is available in this open app session; exported files are untouched.
- Move ship mission rows up/down without re-entering them.
- Opening comparisons show their count; the timed routing search stays
  indeterminate. Elapsed time and best-so-far remain visible.
- Expand All / Collapse All controls the three timeline layers. Individual
  purchase rows load on demand. Date formatters are reused.
- Keyboard navigation, research-filter feedback, responsive footer clearance,
  reduced-motion preferences and forced-color controls improved.
- Solver boost schedules reuse their exact boundary state instead of repeating
  timezone conversion. Research/purchase rules and all opening choices remain.
- The current release audit consolidates validation and limitations.

VERSION 1.5.2 — PLANNING STRATEGIES
- Optimized Sequence optimizes within the prescribed stage order,
  including the allowed K1/I1 swap. Its description is beside the selector.
- User Selected Sequence requires your visit order and optimizes purchases
  and waits on that route. Compatible routes share Wasmegg purchase logic.
- Automatic visits are controlled by the strategy selection. Custom sequences
  stay entered when switching modes, but hidden values do not constrain an
  automatic search. Blank or unknown custom sequences must be corrected.
- Older automatic free-routing farms map to Optimized Sequence for new searches; older fixed routes
  map to User Selected Sequence. Saved plans still replay original actions.
- New ascensions retain your selected mode and custom sequence.

VERSION 1.5.3 — EID FUEL TANK IMPORT
- EID and JSON backup import read the shared tank upgrade from the home-farm
  artifacts section and stored Truth Egg fuel from the Virtue section.
- An upgraded tank no longer defaults to the 2B starter capacity when the
  separate Virtue tank-level field is absent or zero. Imported fuel is retained.
- Older JSON backup layouts remain supported. Truly overfilled tanks still
  produce an error; fuel amounts are never trimmed to make an import pass.

Opening maxima use 30-minute steps from 30 to 300. Additional Search Budget
starts after opening comparisons and is unused for Optimized Sequence.
Existing Virtue flights are imported automatically with Load EID or a game
JSON backup. The read-only flight list shows ship types and return times.
Sync the game and use Load EID to refresh; there are no manual flight fields.

VERSION 1.5.6 — FARM PANEL LAYOUT
Starting Farm, Truth Egg Progress, Planning Goals and Planned Ships now appear
in that order as full-width panels. Planned Ships has separate H1/H2 columns
on desktop, stacked on smaller screens. Load EID already imports claimed TE
and lifetime delivered eggs for all five Truth Eggs; pending TE is calculated
from those totals. Sync the game and reload EID to refresh saved-backup values.
Minimum Final TE remains a user-selected planning goal.

VERSION 1.5.7 — SEPARATE EID LOADING
Use Load Account Data to refresh Soul Eggs, previous switches, permit, tank
capacity and stored fuel, existing Virtue flights, Truth Egg progress, Epic
Research, Colleggtibles and equipped Virtue artifacts. The current egg, gems,
common research, habs, vehicles, silos, start time and planning goals are kept.
It works without an active Virtue farm in the backup. Pending TE is calculated
from the imported lifetime delivered eggs and claimed TE. Compatible alternate
artifact sets are retained. Tank output is derived from the standard capacity
upgrade rate; adjust it manually for auxiliary upgrades.

Load Current Virtue Farm imports all account data plus the active farm and
sets the plan start to now. It needs an active Virtue farm in the backup.
JSON game-backup import still loads the full snapshot. Both EID actions keep
uncompleted planning fields, including separately positioned ship controls.
Account loading also retains unfinished local farm inputs. The EID is excluded
from saved farm files and session recovery.

VERSION 1.5.8 — SWITCH COSTS AND CONCISE NUMBERS
- Each visit header shows duration, TE gained and the Soul Egg cost to enter it.
  The starting farm is labeled with no switch cost. The PDF includes these costs
  in both Shift Summaries and Quick Guide.
- Displayed decimals are capped at three places, including fuel, progress and
  Colleggtible totals. Calculations, farm files and recovery retain exact values.
  Focus a numeric field to edit its full value.
- Only the audit for the current version is included; older audit evidence is consolidated there.

VERSION 1.5.9 — COLLEGGTIBLE ACCOUNT IMPORT FIX
- Resolves contract IDs to custom eggs when backups omit their definitions.
  Both account and current-farm imports populate all supported Colleggtible tiers
  and compute their combined bonuses from active and archived contract progress.
- Uses a bundled Wasmegg lookup, so no additional API request is needed.
  Pre-Colleggtible runs of later custom-egg reruns do not grant bonuses.
- Missing or unknown contract data keeps previous selections with a visible
  note instead of silently replacing bonuses with None. Complete data replaces
  old selections and custom overrides.
- To rebuild the contract lookup, pass the pinned Wasmegg
  periodicals/data/contracts.json to scripts/build-contract-eggs.cjs with Node.

VERSION 1.5.10 — ACCOUNT UPGRADE EDITING
- Epic Research now appears on Farm & Goal beside Colleggtibles.
- Load Account Data populates both panels; values are greyed out and read-only.
  Each panel has its own Edit Manually checkbox to enable manual adjustments.
- Turning editing off keeps your values. Importing account/current-farm data
  refreshes both panels and turns manual editing off again. Partial or missing
  Colleggtible history still retains previous values with a visible note.
- Saved farms/plans, reset undo and recovery retain manual editing preferences.
  Older files default to locked fields while keeping their saved upgrades.
- Editing permission alone does not make an existing timeline stale. Changes to
  upgrade levels or tiers do; rerun the planner to reflect those changes.

VERSION 1.5.11 — SEPARATE ACCOUNT AND FARM DATA
- Account has its own navigation page: Soul Eggs, previous switches, permit,
  fuel tank, existing Virtue flights, permanent Truth Egg progress, Colleggtibles,
  Epic Research and artifact inventory. Load Account Data fills these records.
- Farm & Goal keeps current Virtue, gems, silos, habitats and shipping fleet.
  Farm Research keeps common levels; Artifacts & Stones keeps equipped gear and
  planned alternate sets. Load Current Virtue Farm refreshes live farm data too.
- Edit Account Manually and Edit Farm Manually are separate permissions. Farm
  controls on Farm Research and Artifacts & Stones share the farm checkbox.
  Imported data is grey/read-only; switching editing off keeps current values.
- Account imports relock account fields while retaining the farm's editing
  preference, values and loadouts. Current-farm imports relock both sections.
- Goals, per-Virtue minimums, waiting assumptions and planned alternate sets
  remain editable. Flights and inventory are API records; pending TE is derived.
- Saves, recovery and reset undo retain both editing preferences. Old individual
  Colleggtible/Epic editing switches migrate to the account-wide preference.

VERSION 1.5.12 — ONE IMPORT ON FARM & GOALS
- Account information is back on Farm & Goals, grouped separately from live farm
  values. The separate Account navigation page has been removed.
- One green-arrow button by the Egg Inc. ID loads account and active-farm data.
  The icon has a tooltip and accessible name and works with keyboard Enter.
- When no Virtue farm is found, account information still loads. A notice at the
  top says so, and existing starting-farm data, gear and start time are retained.
- Goals, ship plans, manual edit settings, precise saves, recovery and reset undo
  retain their existing behavior. Older sessions saved on Account reopen on
  Farm & Goals. JSON game backups use the same automatic import selection.

VERSION 1.5.13 — AUTOMATIC OWNED ARTIFACT SETS
- API/JSON import includes loose stones and socketed stones from the separate
  Virtue inventory. Home-farm gear, crafting and future drops are excluded.
- Earnings maximizes egg value times away earnings in Automatic Online + Offline
  mode, or egg value in Online Only mode. Owned stone quantities, equipment
  limits and one artifact per family are respected.
- Delivery searches tier/socket tradeoffs and every feasible Tachyon/Quantum
  split, balancing full-hab laying against shipping after solved research. The
  staged H1 choice also includes cars unlocked for K3; those cars still require
  actual purchases and never increase production early.
- Sets populate under Artifacts & Stones and are grey/read-only by default.
  Enable Edit Farm Manually to use entered sets instead of automatic choices.
  Turning it off restores automatic selection when inventory is available.
- The current equipped gear stays equipped until a listed Humility change.
  Automatic inventory sets never silently improve the starting gear.
- Timeline, Quick Guide and PDF list exact chosen artifacts and stone counts.
  Saved plans capture gear snapshots and replay without re-optimizing them.
  Next Ascension carries the actual final equipped gear.
- Available socketed stones may be moved between sets. Socketing/removal gem
  costs are excluded; arrange the listed sets before following the plan.
  A missing inventory keeps retained presets with a note; an explicitly empty
  inventory produces empty automatic sets. No new API request is added.

VERSION 1.5.14 — STARTING GEAR AND FEASIBILITY
- A saved fresh farm may have empty starting gear even after its inventory is
  imported. Automatic sets are recommendations, not silently equipped artifacts.
  An empty starting set now produces a clear warning and a useful solve error.
- Starting Farm includes Use Earnings Set at Start. For a new ascension, equip
  those artifacts and stones on Humility before ascending, then use the button
  to prepare the plan. Goals and automatic delivery optimization are preserved.
  For an existing farm, import the gear actually equipped; you cannot change it
  on Curiosity. The button never equips gear in the game or changes your account.
- The conservative feasibility calculation now includes owned delivery effects
  and research discounts beyond the three preset sets. Its independent maxima
  are generous bounds only; they can never be equipped by a route or saved plan.
- The earnings set is a combination, not an ordered artifact ranking. It may
  include both a T3L Ankh and a Gusset with Lunar stones. With equal stones, the
  Ankh's +100% egg value beats the T4L Gusset's +25% hab capacity in a direct swap.
  The Gusset may instead fill a remaining slot for its three stone sockets.

VERSION 1.6.0 — COMPACT PANELS AND RESEARCH-AWARE ARTIFACTS
- Farm & Goals returns to a compact two-panel desktop layout. Starting farm,
  account progress, upgrades, fuel, habitats and fleet are on the left; planning
  goals and ship lists are on the right. Narrow screens stack the panels.
- Smaller card gaps, tighter fields and shorter help text keep related values
  close together. Backup diagnostics are available under Import Details. Mobile controls retain comfortable touch targets.
- Research & Earnings selects actual income divided by the research-cost
  multiplier while common research remains. Cube discounts are now part of the
  objective, not a tie-breaker. Actual income includes the full-hab laying and
  shipping bottleneck, egg value, and away bonuses only in offline mode.
- An income-focused alternative is also evaluated for legal Humility set
  changes. Once all common research is maxed, income determines the earning set.
  Research savings do not discount vehicles, habitats, silos or ship launches.
- Earnings and delivery choices still use only owned Virtue gear and stones,
  permit slot limits, unique families and legal sockets. Candidate sets and
  state-specific choices share bounded caches; saved gear snapshots replay
  without being replaced by the new recommendations.
- Your current equipped gear is preserved. Use Earnings Set at Start explicitly
  prepares the new research-aware recommendation for a fresh ascension; equip
  it on Humility before ascending. The app does not equip artifacts in the game.
- Search minimizes the complete TE run, not just the artifact score. A stronger
  research score is a recommendation, not a guarantee of the fastest plan for
  every farm. Both old manual presets and previously saved plans still replay.

VERSION 1.6.1 — CONSISTENT OWNED-ARTIFACT RESEARCH PROJECTIONS
- Research & Earnings compares owned artifact/stone combinations using actual
  income divided by research cost. Research projections now share the same
  owned-gear delivery optimizer as the later Humility equip action.
- Fixed a missing farm snapshot in staged research proposals. It could cause
  projected shipping to fall back to a starter Trike and distort research choices.
- Delivery projections reconsider artifact structures and stone splits as research
  and unlocked cars change. Projected purchases never replace actual purchases.
- Effects, socket counts and stone strength come from the bundled game catalog.
  No particular Cube, Gusset, stone split or opening budget is preferred. Game
  changes require refreshing that catalog and matching reference tables; future gear is not assumed.
- Manual presets and historical gear snapshots retain their behavior. Automatic
  plans need a fresh solve. The attached 160→200 TE farm now completes in
  137d 12h 9m versus 141d 15h 6m, with unchanged inputs and all 36 opening pairs.

UI BATCH IN PROGRESS — EGG ARTWORK (2026-10-05)
- Original egg images now appear next to the existing names in farm/account
  fields, goals, fuel, Colleggtibles and the purchase timeline. The images work
  offline and names remain visible.
- Artwork sources are recorded in assets/eggs/ATTRIBUTION.txt. Seven images
  are from the Egg Inc. Wiki; all 13 Colleggtibles use official game assets.
- The sidebar title uses the official Egg Inc. chicken icon from Auxbrain's
  Google Play listing. The unchanged image is bundled for offline display;
  source details are recorded in assets/brand/ATTRIBUTION.txt and SOURCE.json.
- These changes are part of an ongoing UI batch. Layout/interaction checks
  will run once the batch is finished. Solver math is unchanged.

ARTWORK LAUNCHER FIX — v1.6.2
- The PC launcher now serves the bundled logo, egg images and artwork credits
  with the correct content types. Solver math is unchanged.
- Close the previous launcher window, extract this ZIP to a fresh folder,
  and launch Start-Virtue-Optimizer.cmd from the new folder.

UI BATCH — COLLEGGTIBLE ROWS AND FIELD ALIGNMENT
- Colleggtibles are listed vertically, with the selection beside each name.
- Egg labels and neighboring fields align; progress rows are centered.
- Values, imports and solver calculations are unchanged. Layout review is
  deferred until the remaining UI changes are complete.

UI BATCH — START TIME ENTRY
- Start (PC Local Time) only shows date, hour and minute.
- Saved plan timestamps retain their precision when the start is unchanged.

ARCHIVE COMPLETION FIX — v1.6.3
- The ZIP is fully closed and checked before becoming the downloadable release.
- This release retains the latest UI edits and the unchanged solver.
- If a previous extraction reported a data error, extract this new ZIP into
  a fresh folder rather than running files from the incomplete extraction.

UPDATE ERROR RECOVERY (v0.7.2)
Update errors stay visible in Update App. Copy Error copies the complete message.
Check Again clears the previous error for a retry. If a v0.7.0/v0.7.1 update fails,
save your farm, close the launcher, and extract the release ZIP into your existing
app folder, replacing app files. Launch Start-Virtue-Optimizer.cmd again. Farm
JSON files are not removed. Future updates use the button.

COMPACT EGG INC. IMPORT (v0.7.3)
The Egg Inc. ID field are below the Farm & Account heading.
The loaded backup timestamp remains visible. Press Enter in the ID field to load.

AUTOMATIC RELEASES (v0.7.4)
New versions are built and validated automatically when the app version increases
on the main GitHub branch. Install them with Update App as before.

VISUAL GEAR PICKERS AND LOCAL DEFAULTS (v0.8.8)
Hab tiles show larger artwork without repeating their names. Hover for the name;
the native selection menu, keyboard controls and accessible slot labels remain.
Start from Scratch, Load Farm and Save Farm sit at the bottom right of the header.
On Artifacts, enable Edit Farm Manually and click an artifact image or empty slot
for an illustrated chooser. Its actual number of stone sockets appears below;
click any socket for an illustrated stone chooser. Search by name, tier or effect,
select Empty to clear, or close/Escape to cancel. Catalog rarities, effects and
socket counts are shown. Current and Research & Earnings use separate tabs.
Calculated delivery gear is shown with its stones in the plan results.
Images work offline; readable item/effect text remains if an image cannot load.
Manual gear retains the same legality checks, permit limits and saving behavior.

ACCOUNT → VIRTUE FARM → PLANNING (v0.8.10)
Account is the opening/import page. Continue to Virtue Farm to review the
current farm in two columns: upgrades and expandable Common Research on the
left, artifacts, fuel and flights on the right. Artifact tabs show Current
or Earnings; arrow keys, Home and End switch tabs. Copying a set shows
Current for verification. Research tiers keep their maxed/collapsed behavior.
Fuel retains the account manual-edit setting, with a linked toggle on Virtue
Farm. Continue to Planning for targets, routes, dates, events and missions.
The solver, import rules, saved farm format and updater remain unchanged.

COMPACT GEAR AND VISUAL SHIPS (v0.8.12)
Artifact slots fit in one desktop row; small screens use two columns. Empty
stone sockets are circular + buttons. Delivery editing/copy controls are
removed from the normal artifact UI; existing saved values remain compatible.
H2 shows the actual gear used by the plan in both the shift summary and Quick
Guide. Artifacts are ordered Gusset, Metronome, Compass, then other artifacts,
with their exact stones below. Gear remains visible when carried from H1.
Click the start input for the date/time dialog; the separate launch button is
removed. Ship images open an offline illustrated chooser. Cost and fuel are
per launch for the selected mission length. Time to afford subtracts current
gems and uses the current farm earning rate; future upgrades, events and fuel
collection time are excluded. Assumptions are on How It Works.

VERSION 0.8.13 — OPENING DISCOUNTS AND SHIFT RATES
- Translate Bust Unions into the reference stage planner’s vehicle-discount key.
  Bounded K1 proposals now include the owned discount before selecting purchases;
  actual simulator prices, opening caps, waiting rules and saved Epic IDs stay intact.
- Optimized Sequence replaces the old strategy name. The combined free-routing
  choice is removed; older automatic farms use Optimized Sequence for new searches.
  User Selected Sequence and original saved-plan replay remain supported.
- Remove the switch-tradeoff table from the Purchase Timeline.
- Show start above end for each shift and report maximum earning (gems/hour),
  shipping and egg laying (eggs/hour) in summaries and Quick Guide completion.
  Peaks use the upgrades and gear present at each event time, the selected earnings
  mode and weekly multiplier. Shipping/laying are capacity before fuel diversion.
- PDF walkthroughs show the same dates and peak rates.
- Use gems throughout visible currency wording, including historical wait reasons,
  without changing saved JSON keys or recorded actions.


VERSION 0.8.18 — SIDEBAR AND RESEARCH DISPLAY
The Egg Inc. ID field is above the page menu, with a smaller field. Backup dates omit weekdays and seconds, while timeline actions retain
precise timing. Common Research opens by default; fully maxed tiers start
collapsed and show (Maxed) after their tier names. Imported levels, research
costs, saved plans, and solver calculations are retained. UI prose and exported
walkthroughs use Oxford commas for serial lists.

VERSION 0.8.19 — ENTER TO LOAD ACCOUNT
The sidebar EID field spans the same width as the menu items and uses the same
13px font. Press Enter to load or refresh your account; the arrow is removed.

VERSION 0.8.20 — SELECTABLE RESEARCH-SALE PLANS
Maximum New Switches and Maximum Research Sales are removed from Planning.
Optimized Sequence compares 1, 2, and 3 research-sale plans, with clickable
choices on Purchase Timeline. Switching choices updates the summary, Quick
Guide, purchase details, artifact recommendation, and export. Saved plans and
updater recovery retain all alternatives and your selected choice. Next
Ascension follows the selected plan. Legacy single-plan files still replay
with their original constraints.

Active ULTRA Pro and plan prioritization — v0.8.21
------------------------------------------------
EID/backup imports automatically set Video Doubler to Active (2×) for an active
ULTRA Pro subscription, including account-only refreshes. Other subscription
states retain the current selection. C3 delivery research is always included in
the optimized route and no longer carries an optional label.

Planning now offers Minimize Time or Minimize Switches under Plan Prioritization.
The choice is saved for a future update; current solver ranking still minimizes
time. Older farm files default to Minimize Time.

Conditional planning controls — v0.8.22
-------------------------------------
Minimize Time shows a required Maximum Time (Days) field; Minimize Switches
shows a required Maximum Shifts field. Both values are retained when toggling
priorities and are saved with farms and plans. These priority/maximum settings
are prepared for future solver work; they do not change search ranking or its
existing horizon in this release.

Automatically Determine Truth Egg Allocation is checked by default beside the
TE target. Uncheck it to display Per-Virtue TE Minimums below the target.
Checking it again keeps the entered values but uses automatic allocation.
Older files with explicit minimums open with manual allocation selected.
Next Ascension continues to reset per-Virtue minimums, including retained values.

Simplified Planning — v0.8.23
---------------------------
Planning starts with the TE target, the automatic-allocation checkbox below it,
and Planning Strategy. Plan Start (PC Local Time) and Event Schedule Timezone
share the next row. Plan Prioritization and its time/shift maximums are removed.
The target-default explanatory text is removed; the default target calculation
and automatic/manual allocation behavior remain available.

Seconds per Purchase defaults to 0.3 for new farms or missing form settings.
Explicit saved timing values, including zero, retain their values. Older saved
plans continue to replay with their original purchase timing.
