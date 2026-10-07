# Egg Inc. Virtue Farm Optimizer v0.8.6 — Release Audit

v0.8.6 runs the Windows helper in the background while retaining the Farm & Account / Artifacts / Planning flow, compact layout and unchanged solver. Both pages retain
the compact two-panel desktop layout and share the existing farm configuration.
A small Planning summary shows current Virtue, claimed/pending TE and the last
backup timestamp. Focused validation is recorded at the end of this audit.
Solver and game data remain unchanged; earlier UI, asset, import, updater and
model evidence follows.

The solver evidence below is the unchanged v1.6.1 baseline.

Research projections and the actual automatic delivery recommendation now share
one owned-artifact optimizer. Farm & Account and Planning retain compact two-panel layouts.

## Cause and correction

The staged adapter supplied inventory and account data to the reference engine
but omitted its farm snapshot. The reference optimizer then fell back to a
starter Trike when evaluating theoretical maxed vehicles. Its distorted stone
balance changed delivery research priorities and missed the faster route
available with the same inventory. The adapter now includes current habs,
vehicles, car lengths and common research, with catalog-derived empty-slot IDs.

Automatic research projections use the app's existing delivery enumerator for
each hypothetical research state. Owned structures and available Tachyon/Quantum
splits remain candidates. The structure is reconsidered as research changes.
Common research, Epic Research and Colleggtibles carry into the projection.
Forecast maxed physical purchases never replace the actual state: purchases are
still funded on their permitted Truth Eggs, with tier unlocks, time and fuel rules.
Reference callers receive independent stone arrays. Manual presets retain their
proposal policy; recorded historical gear remains fixed during replay.

## Data-driven research purchasing power

Before planning, Research & Earnings maximizes actual income divided by the
artifact research-cost multiplier while common research remains. Income is
limited by full-hab laying and shipping, then multiplied by egg value and
offline-only away earnings. Fully researched farms use income as the objective.
Research, income and delivery alternatives remain available at legal Humility
visits. The complete run's elapsed time determines the winning plan.

Owned quantities, unique families, permit limits, legal sockets and catalog
bonuses constrain choices. Maximum stone count derives from owned catalog
socket counts rather than a fixed three-socket assumption. No artifact, stone
allocation, route, opening budget or account receives a fixed preference.
Catalog changes require refreshing bundled game data and matching reference tables. Future finds, crafting,
mission rewards and stone socketing/removal gem costs are outside the model.

For illustration only, a T4E Cube's 55% research discount can overcome losing
one +30% Lunar socket and a T4L Gusset's 25% hab bonus: 1/(1.3×1.25×0.45) = 1.368
in research buying power when shipping is unlimited. Actual selection uses the
farm's limits, rather than this fixed comparison.

## Attached-farm evidence

The automatic 160→200 TE farm completes in **137d 12h 9m**
(11,880,595.603 seconds), versus 141d 15h 6m (12,236,792.485 seconds).
All original farm and planning inputs are retained. All 36 C1/K1 pairs were
compared; winning budgets are 90/180 minutes. The 3,577 actions replay to 40 TE
per Truth Egg with 12 switches and the two entered nine-launch ship visits.
Final delivery is 845,767,861,189.453 eggs/second. The controlled manual-owned-set
comparison reproduces this result. This is fastest found, not a global optimum.
Personal farms/plans are excluded from the app archive.

## Validation

- Independent research/income and delivery oracles each cover 24 states, both
  permits, tier/socket tradeoffs, owned quantities and production limits.
- New regression: actual farm snapshots, primary-engine delegation, both permits,
  research-dependent cars, immutable state/gear, manual policy and 160→200 replay.
- Catalog checks verify all artifact effects/sockets and supported stone effects
  agree with reference tables, detecting stale tables before a release.
- A future catalog with five- and four-socket artifacts verifies enumeration
  uses all nine available stones without fixed item IDs or bonus magnitudes.
- Original manual reference: exactly 2,044 actions, 12,194,669.347 seconds and
  unchanged established action SHA-256.
- The complete synthetic owned-inventory staged route improves from 134.814 to
  125.058 days and replays exact gems, deliveries and time. It is a separate fixture.
- Independent Wasmegg math: 358 states, 13,980 research prices, 228 hab prices,
  612 vehicle prices, 27 car prices, 20,048 tier decisions, 240 Colleggtible
  selections and 132 ship combinations. Largest relative rate error: 1.784e-8
  (one chicken after floating-point ceiling). Game data commit:
  a089580df4cc6cce8a2f5a9a7dcf86583a2c216d. Reference source commit:
  9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67.
- Core, opening/cache, replay and relevant browser suites appear in VALIDATION.json.
  Browser coverage includes compact/mobile layout, imports/manual editing,
  worker solving, gear save/reload, timeline and PDF.
- Packaging checks current branding, worker code, archive integrity, one current
  audit and exclusion of temporary diagnostics and personal files.

## Established game-model assumptions


| Area | Applied behavior |
| --- | --- |
| Habs | Always full; filling time is ignored. Results are more reliable around 100 TE and above. Fresh farms and ascensions start with one free silo. |
| Artifacts | Owned Virtue inventory supplies automatic sets. Manual overrides use entered gear. No crafting, future finds or mission reward upgrades are predicted. Stones may be moved between owned artifacts; socketing/removal gem costs are excluded. |
| TE | Delivered thresholds determine pending TE; earnings use claimed TE. Fuel-diverted eggs earn neither gems nor delivered TE. |
| Research | Common tiers unlock from previously bought common-research levels. Epic Research does not unlock common tiers. |
| Colleggtibles | Owned tiers multiply within a stat; away bonuses of 3× and 2× compose to 6×. |
| Earnings | Delivery × egg value × claimed-TE bonus × entered bonuses. No running-chicken bonus, boosts, gifts or drones. Offline adds away bonuses; standard permit applies its penalty. |
| Breaks | Online, offline and purchase batches are compared. Offline minimum is at least one minute or the user's larger minimum. Ties favor fewer earning breaks. Maintained silos/video are assumed; silo refill check-ins are additional. |
| Events | Default Pacific calendar: Monday 09:00–Tuesday 09:00 earnings ×2; Friday 09:00–Saturday 09:00 research ×0.3. Event timezone overrides change the schedule. Special events are not predicted. |
| Purchases | Research rounds up; discounted hab/vehicle/car prices round down. Duplicate physical types affect prices. Calibration defaults to 1. |
| Switches | Gems reset, upgrades/deliveries persist, Soul Egg balance decreases and prior-switch count increases. Entered maximum new switches and interaction time are enforced. |
| Search | Every C1/K1 budget pair at 30-minute increments up to the selected maximum, capped at 300 minutes. No previous-plan incumbent. Caps include waits, interactions and fuel collection. Search is heuristic and does not prove a global optimum. |
| Routes | Wasmegg Optimized Sequence, Best Found: Wasmegg Optimized + Free Routing, or User Selected Sequence. Entered visit order is honored; compatible upgrade visits share staged purchase rules. |
| Ships | Separate H1/H2 lists launch in entered row order. Earlier returns, funding, fuel transfer and fuel production are included. Final ships need not return before departure. Imported existing flights occupy slots and their launch fuel is not spent again. |
| Ascensions | No sleep or downtime allowance. Each solve covers one ascension. Next Ascension preserves permanent progress and active flights, with one starting silo. |

Staged policy: C1 develops fleet size/Graviton within its budget; K1 buys affordable vehicles within its budget; I1 finishes Chicken Universes and moves ahead of K1 automatically when it finishes under one hour. C2 uses the established four-hour fleet/coupling policy. K2 completes vehicles/unlocked cars; R1 buys silos within one hour; C3 develops delivery research and prerequisites through compared sales. H1 equips delivery gear and launches planned ships; K3 adds unlocked cars and collects its allocation. Final C/I/R/H visits collect their allocations and refuel/launch H2 where applicable.


## Limits

Artifact purchasing power is a local objective, not proof of the fastest complete
route. Gear changes require Humility. Staged opening comparisons and bounded
free-route search do not prove global optimality. Full habs, maintained silos/video,
no sleep and no downtime remain assumptions. API tests use synthetic backups;
no live-account request was added. Native Windows PowerShell and screen-reader
execution remain untested here.

## UI batch in progress — 2026-10-05

Bundled 20 original egg images for offline display: the five Virtue eggs, Soul
and Truth eggs, and all 13 Colleggtibles. Seven images come from the Egg Inc
Wiki image host; all 13 Colleggtibles use official Auxbrain asset URLs in the game catalog.
Per-image source details and attribution are included under assets/eggs.

Decorative icons appear beside existing text in the current farm,
Truth Egg Progress, fuel fields, per-Virtue minimums, opening limits,
Colleggtibles and purchase-timeline shift headings/final TE totals. Image-only
content does not replace labels; native inputs and their values are retained.
Icons are excluded from screen-reader labels, and unavailable images retain
text. The purchase PDF content is unchanged in this UI step.

The sidebar title now uses the official Egg Inc. chicken app icon from
Auxbrain's Google Play listing, replacing the decorative Truth Egg in that
position. The original image is bundled unchanged under assets/brand with
source details and attribution. Existing text identifies the optimizer;
the compact 44-pixel icon reserves its size and works offline.

The validation evidence above applies to the completed v1.6.1 solver release.
These UI changes are being collected into a batch; layout and interaction
validation is deferred until the user has finished that batch. Solver source,
game data and the solver worker bundle remain unchanged.

## Artwork launcher regression — v1.6.2

The actual PowerShell helper now serves all 21 images with matching bytes and
correct PNG/WebP content types. Artwork credits and catalog load; unregistered
app files and traversal paths remain unavailable. Chromium confirms the logo,
progress/fuel/goal icons, all 13 Colleggtibles and saved timeline shift icons
load through that helper and from offline index.html. The regression test is
`npm run test:artwork`. Runtime: PowerShell 7.6.6 on Linux and headless Chromium;
a native Windows/Windows PowerShell 5.1 runtime was not available. The change
uses the existing launcher-compatible APIs. Full UI batch review remains
deferred. No solver inputs, game data or calculation source changed.

## UI batch — Colleggtible rows and alignment

Colleggtibles now use one row per egg, with the existing name/icon and native
selection on the same row. A consistent selection column and row separators
make the list easier to scan; the column narrows on small screens. Existing
input IDs, option values and account editing/import behavior are retained.

Form labels use matching line/icon heights and controls align at the bottom
of each grid row when labels wrap. Stat labels use a consistent header height;
Truth Egg Progress cells are vertically centered. These are HTML/CSS changes
only. Layout/interaction review remains deferred until the UI batch finishes;
the earlier artwork-launcher regression evidence remains unchanged.

## UI batch — Minute precision start control

Start (PC Local Time) now formats its displayed value as YYYY-MM-DDTHH:mm
and uses the datetime-local control's 60-second step. Seconds and fractional
seconds are absent from the entry field. Existing saved plan timestamps are
retained when the displayed start is unchanged, preserving replayed plans.
Editing the minute produces a minute-precision start. Solver durations and
action timestamps are unchanged. UI batch validation remains deferred.

## Archive completion — v1.6.3

The latest saved v1.6.2 archive was truncated in worker-source.js and had no
central directory/end-of-directory record. Its materialized bytes matched the
incomplete local deliverable. This is an archive delivery fault, not a solver
or start-time calculation error. The original calculation worker remains
unchanged. The package script now writes to a private temporary path, closes
and CRC-checks the entire ZIP, then atomically replaces the release path. The
new version filename avoids reusing the affected download path. Validation
includes an independent unzip test and saved-download comparison.

## App updater — v1.7.0

An explicit Update App action uses a public GitHub stable-release feed. The
local session token and same-origin checks protect all configuration and install
requests. Release/tag/manifest versions must agree; both the archive and every
managed runtime file are checksum-verified. ZIP entries are allowlisted and
traversal, duplicate paths and symbolic links are rejected. Downloads are bounded.
The updater backs up managed app files, replaces complete files, restarts at the
same port and rolls back if installation or startup fails. Unknown files and
update-source preferences are retained. A one-time browser snapshot restores
current inputs and the timeline without retaining EID; recovery preferences
remain unchanged. Public packages omit all personal farms and account fixtures.

Targeted updater validation is recorded in VALIDATION.json. Native Windows
PowerShell 5.1 was not available locally; the GitHub release workflow runs the
core update tests on Windows before publication. Full UI batch and solver
validation remain deferred; the solver worker must match the v1.6.3 checksum.

Targeted tests passed with the real local helper and updater child processes:
successful restart at the same origin, corrupt download rejection, mid-install
rollback and startup-failure rollback. Unfinished invalid draft inputs and a
replayed saved timeline survive both successful and rolled-back restarts. Recovery
turned off stays off; EID is absent. User JSON files and update configuration
remain byte-for-byte intact. Archive/version/source guards and offline messaging
pass. The publishing tree builds independently without personal farm fixtures.
The public repository and v1.7.0 release were published. GitHub Actions run
37400731948 passed the core updater/install/rollback tests and verified the live
public feed, full release download and all file checksums on Windows PowerShell
5.1.26100.33438.

## Current release numbering — v0.7.0

The app is renumbered from v1.7.0 to v0.7.0. Package metadata, displayed version,
launcher version, release tag and update manifests use the same number. Current
release audit links point to this file; only this audit is packaged. All features
and the validated solver worker are retained. Existing 1.x installations require
one manual ZIP installation because the updater rejects lower version numbers.
Future 0.7.x releases follow the normal numeric update policy. The release
workflow repeats native Windows core and public-feed checks before handover.

## Compact farm statistics and fuel display — v0.7.1

The farm-stat cards use a compact two-row layout on desktop, retaining every
label, value and explanatory note. Narrow screens stack the label and value.
Fuel tank values use whole T, one decimal for B/M/K, and whole numbers below
1,000. The fuel formatter is confined to the UI. Numeric input sources retain
exact values through focus, edits, blur, saving and recovery; rounding does not
change solver inputs. Existing number-format checks and targeted fuel notation,
unit-boundary and exact-value editing/recovery checks passed. Synthetic account import, exact saved-farm round trips and compact layouts at
1440, 1280, 800, 390 and 320px passed with no horizontal overflow. The solver
worker is byte-identical to v0.7.0. The full UI batch review remains deferred. The release pipeline repeats Windows updater checks.

## Windows updater restart and persistent errors — v0.7.2

A native Windows PowerShell 5.1 helper/worker test reproduced the previous
restart failure: the updater inherited the server socket, keeping it alive
after the parent exited. A replacement listener either could not bind or could
not receive requests when socket reuse was attempted. The local host now marks
listening and accepted sockets non-inheritable before starting child processes.
The existing exclusive loopback listener and session/origin checks are retained.
Idle pre-opened connections have a short first-byte deadline so they cannot block
the local request loop. Restart errors are captured in job logs. Failed update
results reopen the update dialog, and a separate persistent error region survives
farm notices, refreshes and reopening. Copy Error preserves the message; an
explicit Check Again clears it. Browser checks for rollback display, copying,
reload, reopening, retry and blocked storage passed. The release workflow now
exercises actual Windows helper/worker restart and startup-failure rollback before
publishing. No solver changes were made.

Native Windows verification run 37405606247, job 112082381907 passed the actual
helper/worker successful update and injected startup-failure rollback. It also
rejected a second app helper on the live port and retained private test farm JSON
and the configured update source. The published workflow repeats these checks.


## Compact account import — v0.7.3

The Egg Inc ID and icon-only green arrow now sit to the left of the farm file
buttons in the header; the standalone Load from Egg Inc card is removed.
The saved backup timestamp stays visible beneath the toolbar, with a year,
timezone and machine-readable time. It uses the backup timestamp rather than
the moment of import. Import Details retains warnings and import scope.
Starting from scratch clears the timestamp; undated backups say not supplied.
Enter in the ID field starts the same guarded import as the green arrow.

The synthetic account import browser suite passed toolbar position, visible
backup time, full and account-only imports, saved farm privacy, delayed reset,
undated backups, draft preservation, keyboard and widths down to 320 px.
Solver and game data are unchanged; the worker SHA256 remains
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The standard release workflow also validates file installation, actual Windows
helper restart, rollback and the public update feed before keeping a release live.


## Local Git and automatic releases — v0.7.4

A clean public Git checkout is now the development source. The generated app
bundle is removed from tracked source; the release workflow builds it and the
worker into the runtime ZIP. This reduces future source commits by about 4.4 MB.
The staged-index publishing helper rejects private/unsupported paths and EIDs,
retains local drafts and files, and prepares one atomic expected-head connector
commit when terminal credentials are unavailable.

Version increases on main trigger Windows validation and publishing without a
browser dispatch. The release-intent gate skips same-version edits and duplicate
pushes, rejects downgrades and mismatched tags, and preserves verification-only
runs. Publication is serialized and tags the exact tested commit. Gate and
publishing-plan tests passed. The standard Windows release checks remain required.
Solver and game data are unchanged; the worker SHA256 remains
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.


## Sidebar update control — v0.7.5

Update App is now the final item in the sidebar, below the Local Planning note.
The existing flex layout places it at the bottom of the desktop menu panel.
Its ID, accessible name, styling and update handler are unchanged.
No solver, game data or update logic was changed.


## Visual artifact loadouts — v0.7.6

Current, Research & Earnings, and Delivery sets now show tier-specific original
artifact artwork, visible tier/rarity, a horizontal socket row, and separate
artifact/stone effect text. Repeated stones are grouped with their catalog bonus
labeled “each”; displayed bonuses are read from the existing game data. Empty
sockets and artifacts remain readable. Manual editing reveals the original
native selectors, IDs and saved values; automatic sets remain read-only.

All 171 catalog artifacts and 30 stones map to 114 original 128-pixel PNGs,
bundled unchanged with pinned source, attribution and checksums. They use the
existing managed artwork directory so older app updaters accept this release.
No updater rules or solver calculations change.

Targeted Chromium checks cover catalog integrity, tier/rarity, horizontal
sockets, effect text, manual edits and locks, automatic owned-inventory sets,
saved-farm round trips, layouts from 1440 to 320 px, offline file display,
missing-image text fallback, and Standard Permit slots. The solver worker
remains byte-identical:
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The release workflow repeats native Windows updater restart, rollback and public
feed verification before keeping the release available.


## Inline research artwork — v0.7.7

All 56 Common Research and 22 Epic Research items now show their original game
icons beside the existing text. Common descriptions, level fields, input IDs,
accessible names and account edit locks are retained. Research names in the
purchase summary, quick guide and lazy full breakdown also receive inline icons.
The decorative icons do not enter saved farm data or research calculations.

The 78 source icons use a pinned asset mirror and the Wasmegg ID mapping.
They are packed into one 318,904-byte lossless PNG sheet without resizing or
changing source pixels. Non-square source icons are centered with transparent
padding. Source checksums, source-pixel checksums, positions and attribution
are bundled in the existing managed artwork directory.

Targeted Chromium checks passed all mappings and pixel integrity, inline
labels, retained values and edit locks, research filtering, a synthetic replayed
plan through all three timeline layers, layouts from 1440 to 320 px, offline
file display, saved-farm round trips and missing-art text fallback. The earlier
artifact display remains intact. No solver calculations or game data changed;
the worker SHA256 remains
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The release workflow repeats native Windows install/restart/rollback and
published feed verification before handover.


## Research artwork publication — v0.7.8

The v0.7.7 source passed Windows installation, restart and rollback checks in
run 37484216147. The final anonymous public-feed request returned HTTP 403,
so the existing publishing workflow held that release. This patch republishes
the same research artwork and UI through the unchanged standard release
process on a fresh Windows runner. No recovery workflow, updater code, solver
code or game data was added or changed.


## Account clarity and planning feedback — v0.7.9

Epic Research and Colleggtibles display concise summaries with keyboard-operable
native disclosure controls. Their existing fields, artwork, exact values and
account edit locks remain intact. Enabling manual account editing opens the
fields; disabling it restores their previous disclosure state without discarding
edits. Epic Research inputs validate against the same maximum shown in the UI.

Source labels distinguish imported backups, retained farms when no active
Virtue farm was found, unresolved Colleggtible records, manual editing, and
edited-and-locked values. Small optional uiProvenance metadata preserves manual
source labels through farm saves and browser recovery. Next-ascension inputs
are labeled as projections from the completed plan. Reimport clears it for
refreshed groups while retaining it for a retained farm or unresolved tiers.
Artifact cards distinguish starting-farm previews from delivery recommendations
for the last completed plan; changes to planning inputs invalidate that label.

A search status card uses existing worker events for the latest stage, completed
opening comparisons, elapsed seconds and best complete plan. Routing remains
indeterminate because it cannot provide an accurate percentage. Search failures
keep their original message and add links to the relevant input or a retry.
Review opens closed details and focuses the edit toggle when an imported field
is locked. Generic failed heuristic searches do not claim impossibility; existing
optimistic production bounds remain distinguished. Previous timelines and frozen
run inputs retain their existing safeguards.

Targeted browser checks cover real synthetic backup imports, retained-farm and
missing-contract labels, summary counts and multiplicative bonuses, keyboard
disclosures, manual edits and locks, exact saved values, linked field errors,
worker progress and cancellation, a real replayed worker plan, offline display,
and layouts from 1440 to 320 pixels. Artifact and research artwork checks are
also repeated after the presentation changes. No solver or game-data source was
changed. The generated worker SHA256 remains:
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The unchanged release workflow requires native Windows install/restart/rollback
and public-feed checksum verification before handover.


## Existing-screen usability fixes — v0.7.10

The desktop sidebar stays fixed and scrolls independently in short windows.
Its contents keep their natural size, leaving Update App reachable by scrolling
and keyboard without jumping the main form. Narrow screens retain the existing
horizontal navigation. Checkbox inputs have explicit dimensions and inherit
neither the height nor padding of text fields; the full label stays clickable.

Shipping Fleet hides locked empty slots and displays the current unlocked count.
All 17 original controls and values remain in the form and saved farms. Adding
fleet research reveals newly available slots. Occupied locked slots remain
visible when validation fails. Train Cars appears only for Hyperloops. Invalid
hidden car values reveal their controls for correction, while the enclosing
manual-edit lock remains enforced. Each fleet control has its slot in its
accessible name. The layout no longer dims an occupied invalid slot.

The planning bar wraps earlier on narrower desktop windows and keeps its
actions from shrinking. Full input errors remain in the persistent notice and
linked field; the bar uses a short instruction rather than duplicating the error.
Its measured height continues to reserve space for the form and focused fields.

The targeted browser suite verifies fleet unlocks, hidden-value save/load
round trips, Hyperloop car edits, invalid hidden-field correction, account
locks, short-window Update App access, independent focus scrolling, checkbox
dimensions, and planning-action visibility/overlap from 1366 to 320 pixels,
including a 683-by-384 viewport representing desktop zoom. Existing planning
clarity and artifact/research artwork regressions are repeated. These are
presentation and interaction changes only; solver/game data and generated
worker bytes are unchanged. The standard Windows release workflow requires
installation, restart, rollback, and anonymous public-feed checksum verification
before the release is handed over. Native screen-reader testing is not claimed.


## Habitat and vehicle artwork — v0.7.11

All 19 habs, 12 vehicles, and the Hyperloop car use their original game images
from the same pinned asset mirror as the research artwork. The existing catalog's
iconPath fields supply the hab/vehicle mapping. All 32 downloaded sources were
checked against the pinned repository Git blob IDs and recorded SHA256 hashes.
Their original RGBA pixels are packed unchanged into one 132,630-byte PNG sheet.
Source/pixel checksums, geometry, attribution, and a developer regeneration
script accompany the sheet in the existing managed artwork directory.

The selected item's icon appears beside its farm-control label and updates
immediately on selection. Wide artwork receives a wider inline viewport; square
and tall artwork uses the existing compact icon size. Empty slots retain their
text without an empty-image box, and control rows remain aligned. Native selects,
accessible names, values, import/manual locks, and the two-panel layout are
retained. Select tooltips show the full item name when a narrow field truncates it.
Summary chips, quick-guide purchases, and lazy full-breakdown actions receive
matching hab/vehicle/car artwork. Raw actions and PDF content remain unchanged.

Targeted Chromium checks cover all mappings and original pixels, selection
changes, empty slots, labels and edit locks, saved-farm round trips, replayed
plans through all three timeline layers, Hyperloop car icons, layout widths
from 1440 to 320 pixels, offline file loading, and text/control fallback when
artwork cannot load. The previous sidebar, focus, fleet, and planning-bar
checks are repeated. No solver, game catalog, purchase, or routing source changed.
The generated worker SHA256 remains
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The unchanged release workflow requires native Windows installation, restart,
rollback, and public-feed/download checksum verification before handover.


## Selected names and timeline clarity — v0.7.12

Native hab, vehicle, artifact and stone selects gain a wrapped selected-name
readout only when the closed field would clip it. A shared, debounced animation
frame measures actual rendered text and updates on selection, resizing, tab
changes and disclosures. The readout is decorative to assistive technology;
native names, options, values, keyboard behavior and manual-edit locks remain.
Short or empty selections add no height. Hab controls stay aligned when one
selection wraps. Artifact titles wrap inside their cards; selectors omit the
repeated effect text while the selected artifact and stone effects stay visible
beneath the artwork.

Shift headers retain duration, gained TE, Soul Egg cost and the end timestamp.
Quick guides distinguish purchase groups, labeled online/offline/fuel breaks,
and one final Shift Complete strip. Break duration and the exact resume date
are prominent. A shift ending in a break, including a wait-only shift, now
receives its completion strip. Research tiers, in-game order and level ranges
are retained, with levels vertically aligned beside their names. Wait coloring
also carries through to the lazy full breakdown. Mode labels provide meaning
without color. Shared guide instructions appear once; repeated hints elsewhere
are shortened while input constraints, precision, timing, inventory and model
rules remain available near controls or in Assumptions.

Targeted browser checks verify clipped, short and empty selections, keyboard
labels and editing locks, resizing and tab changes, artifact effects, saved
values, exact break modes/durations/resume timestamps, one completion strip per
shift, ordered research and adjacent levels, folded brief online waits, lazy
full details, unchanged replay actions and layouts from 1440 to 320 pixels.
The existing planning-clarity, sidebar/fleet UI polish, loadout, research and
farm-artwork suites also pass, including offline operation and missing-art
fallbacks. The two-panel desktop layout is retained. Screenshots were inspected
for the selected-name and purchase/break/completion views.

No solver, shared action grouping, game data, ship, routing or PDF code changes.
The rebuilt worker SHA256 remains
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The unchanged release workflow requires native Windows installation, restart,
rollback and anonymous public-feed/download checksum verification before
handover. Native screen-reader testing is not claimed.

Local npm install/build, release-state and publish-plan guards pass. The local
verified package contains 164 runtime files and only the current audit.


## Separate farm entry and plan development — v0.8.0

The app opens on Farm & Account. The import arrow, backup information, starting
farm, account data, Truth Egg progress, tank, existing flights, Colleggtibles,
Epic Research, habs and vehicles live there. Farm/equipment occupy the left
column and account data the right. Planning is a separate sidebar destination:
goals, route controls, limits and timing/calibration occupy the left column;
planned H1/H2 ships occupy the right. Assumptions remain visible below the
planning columns. Farm Research and Artifacts & Stones keep their existing pages.

Planning starts with a compact, non-editable summary of the selected Virtue,
claimed and pending starting TE, and last backup timestamp. Source badges
continue to distinguish imported, retained, manual and projected farms. The
summary updates from current inputs even when unrelated planning input is
invalid. Invalid TE values receive a review prompt rather than stale totals.
Missing backup timestamps remain explicit. Review Farm returns to data entry.
The Farm page's primary action is Continue to Planning; opening it does not
start a worker. Planning's primary action starts the existing solver.

All original input IDs and saved schemas remain. Hidden page fields stay in the
shared form and gather/save/recovery operations. Save Farm retains account and
farm data together with every goal, limit, timing value and ship schedule.
Import retains planning goals; account-only import still retains the starting
farm. Error review opens the affected page and retains manual-edit locks.
Reset returns to Farm & Account; Undo and recovery can restore Planning with
its goals and missions. Old saved Farm-tab sessions open Farm & Account; the
new Planning tab is also retained in browser/updater session snapshots.

Targeted Chromium checks pass for initial navigation and the primary action,
page-specific input visibility, farm/TE/backup context, imported/retained labels,
actual farm downloads containing hidden planning settings and exact numeric
values, save/load round trips, import retention, invalid-field navigation,
Reset/Undo and recovery to Planning. Compact two-column layouts are verified
on both pages, with overflow checks on every app page from 1440 to 320 pixels.
Desktop screenshots of both pages were inspected. Existing planning-clarity,
UI-polish, timeline-readability, farm-artwork, research-artwork and loadout-artwork
suites also pass, including keyboard focus, worker progress/cancellation, a real
replayed worker plan, manual locks, offline operation and artwork fallback.

No solver, game data, shared action grouping, API, ship scheduling or PDF source
changes. The rebuilt worker SHA256 remains
`2dfad0d4ad2a0cf69776c6bfdcce5dbd775131c0670710aa5842f21bd0727320`.
The unchanged release workflow requires native Windows installation, restart,
rollback and anonymous public-feed/download checksum verification before
handover. Native screen-reader testing is not claimed.

Local npm install/build, release-state and publish-plan guards pass. Original
static input/select IDs and types match the previous release. The verified
local package contains 164 runtime files and only the current audit.


## Planning and account cleanup — v0.8.1

Hold to Research now uses the current 20-level Epic Research range. Its 20
catalog prices run from 5,000 through 20,000 Golden Eggs and total 249,991.
This correction affects account validation/display only; Hold to Research does
not change the optimizer's farm production model.

Shipping Fleet selectors retain their native selects, artwork, values and
accessible slot labels, but no longer repeat a visible “Vehicle” label inside
each slot. The Farm & Account Artifact Inventory summary card is removed; the
owned inventory itself remains available to automatic artifact selection and
the Artifacts & Stones page.

Planning groups Maximum Research Sales with Target Total Truth Eggs, Maximum
New Switches and Start time. The editable Planning Limit field is removed.
Newly gathered plans use the established 366-day internal ceiling, including
old saved farms that previously carried a shorter maxDays value. C3 is described
as optional in the stage guide because its usefulness depends on the research
sales compared; solver routing and stage implementation are otherwise unchanged.

Persistent browser recovery/autosave, its controls, local-storage session key,
and recovery module are removed. Reset/Undo remains an in-memory current-session
safety action. Save Farm and Save Plan remain the explicit persistence paths.
Update App continues to use a separate one-time sanitized handoff only during
the verified restart process; update rollback and restart behavior are unchanged.

Regression coverage was updated for the removed recovery UI, the moved research
sales control, planning error routing, focus/overflow behavior, and the 20-level
Hold to Research input. The release workflow will rebuild the app/worker and run
the established Windows release-state, publish-plan, updater, restart, rollback,
archive and public-feed checks before publication.


## Public-feed retry — v0.8.2

The v0.8.1 Windows build, packaging, updater and publication steps passed, but
the immediate anonymous public-feed verification received HTTP 403 from GitHub.
The workflow correctly returned that release to draft instead of leaving an
unverified update public.

v0.8.2 republishes the same app changes and retries the complete anonymous feed,
archive download and checksum verification up to five times with short increasing
delays. Any persistent failure still hides the release. This changes release
verification only; app behavior, solver behavior and update verification rules
are unchanged.


## Sync repair and EID identity — v0.8.3

Removing persistent browser recovery in v0.8.2 left one reference to the deleted
Restore Previous Session control inside the shared busy-state handler. Starting
an EID import invoked that handler before the backup request, causing a browser
exception and preventing current-farm synchronization. The stale control
reference is removed.

The EID is now a deliberately separate local preference rather than part of
farm/session recovery. A valid EI + 16 digit identifier is stored under its own
local key and survives reloads and Start from Scratch. It remains excluded from
Save Farm/Save Plan data. After a successful backup response, backup.userName is
stored separately for display. The resting EID input shows that username;
focusing the input reveals the underlying EID. New or incomplete edits are
validated as typed and never silently fall back to the previously saved account.

Import browser regression coverage now exercises the actual backup request,
username display, click-to-reveal behavior, EID persistence, and reset/reload
behavior. Solver routing and optimization code are unchanged.


## Fleet picker sync repair — v0.8.4

The visible “Vehicle” label was removed in v0.8.2 by passing an empty label into
the existing farm-artwork picker decorator. That decorator assumed the first
child was always a text node. With an empty label, the first child was the native
<select>, so decoration replaced the select itself with the artwork caption.
renderForm then attempted to set Fleet Slot ARIA metadata on the missing select,
producing the Firefox error “querySelector(...) is null” during EID sync.

The decorator now distinguishes an optional text node from the actual native
select. When visible label text is absent, it inserts the artwork caption before
the select instead of replacing the select. Native vehicle controls, values,
artwork updates and accessible Fleet Slot labels are therefore preserved while
the redundant visible “Vehicle” word remains removed.

The existing ui-polish browser regression already asserts that #vehicle-0 exists
and has its Fleet Slot accessible label after rendering; this defect would have
failed that suite. The current automated release workflow does not execute the
Playwright browser suites, which is why v0.8.3 packaging checks did not catch the
UI regression. No solver code is changed.


## Artifact review and compact research tiers — v0.8.5

Continue to Planning on Farm & Account now opens Artifacts for current-loadout
review; continuing from Artifacts opens Planning. Neither action starts a search.
The page and sidebar use Artifacts. Copy Earnings to Current and Copy Delivery
to Current copy the selected alternate set, including stones, into Current and
select Current as the active starting set. Source sets remain independent.
Existing manual farm editing locks still apply; the copy notice explains that
the gear must be equipped in the game before using it as the starting set.

Colleggtibles and Epic Research move into the left Farm & Account column while
retaining their account editing toggle, disclosure behavior and saved values.
The ambiguous Review Tiers badge is replaced by Partially Imported, Previous
Values Retained, or Reconstructed from Totals, according to its actual source.
Visible explanations describe missing/unmatched contract progress and retained
values. Fully matched account imports still show Imported Backup. No import
matching, bonus calculations or fallback rules changed.

All 56 common researches appear in their 13 catalog tiers with native keyboard
operable disclosures. Completed tiers start collapsed; incomplete tiers start
open. Tier summaries show purchased/maximum levels and Maxed when appropriate.
Compact rows retain original artwork, current-level inputs, maximum levels and
next cost/locked state. Descriptions remain searchable, available on hover and
associated with inputs for assistive technology. Filtering temporarily opens
matching tiers; clearing restores previous disclosure states. Error review clears
filters and opens the affected tier before focusing its input or edit toggle.
Manual edits update totals without collapsing a focused tier. Saved research
values, input IDs and validation limits are retained.

Targeted Chromium suites pass page-navigation, planning-clarity,
research-artwork, loadout-artwork and ui-polish. Coverage includes actual API/
protobuf sync with a synthetic backup, fleet rendering, EID identity persistence,
both navigation steps without a worker, distinct loadout copies with stones,
source independence, account/farm locks, completed-tier collapse, filtering and
restoration, invalid-field review, saved-value round trips, replayed worker plans,
offline artwork/fallback and overflow checks from 1440 to 320 pixels. Desktop
and mobile research screenshots and the two-panel farm layout were inspected.
The older import-account-browser suite cannot start in this checkout because
its import-tank-fixture.cjs and import-colleggtibles-fixture.cjs dependencies
are absent; current self-contained suites exercise imports and the EID API.
No live-account request or native screen-reader check is claimed.

No solver, game data, import calculations, ship scheduling or updater source
changed. Independently rebuilding the v0.8.4 worker from its clean Git tree
produced bytes identical to this release's worker (SHA256
26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a).
Historical hashes above describe earlier catalog/build states. The standard
Windows release workflow checks updater installation, restart, rollback,
packaging and the anonymous public feed before handover.

Local npm ci/build, release-state and prepare-publish checks pass. Packaging
verifies 164 runtime files and one current audit. Local update-core execution
is blocked because pwsh is unavailable; native Windows updater checks remain
mandatory in the automatic publishing workflow.


## Hidden Windows launcher — v0.8.6

The existing CMD entry point now starts a separate Windows PowerShell helper
with WindowStyle Hidden and exits. No persistent command window is needed for
EID sync or updates. The CMD bootstrap can still flash briefly. An explicit
--console diagnostic mode retains the visible helper and Ctrl+C shutdown.
Background startup failures display a Windows error dialog instead of failing
silently; normal request errors remain in the app.

Windows update and rollback workers launch hidden helpers too. The helper also
hides its console in place by default unless Console is specified, supporting
first installation by an older updater worker that lacks hidden-window flags.
Its PID, loopback listener, socket inheritance protection, update health check,
local session token and restart/rollback policy are retained.

Repeated normal launches probe the existing loopback port range and reuse only
a healthy matching installation (hashed folder identity, app hash and version).
This retains its port and browser EID preferences without accumulating helpers.
Explicit-port launches still reject occupied ports as before. Probes are bounded;
no filesystem path or additional account data is exposed in health responses.
The hidden helper remains running when the browser closes and stops at Windows
sign-out/shutdown. README and in-app help describe this behavior and diagnostics.
No new managed file type or updater allowlist expansion is required.

The Windows release test now launches the actual CMD file from a folder with
spaces, checks the helper's hidden-window arguments/window handle, tests repeated
background-launch reuse and unchanged session identity, and verifies hidden
successful/rollback restarts. A third fixture simulates an older updater worker
without hidden flags to exercise first-update compatibility. All fixtures retain
private synthetic farm files and update-source settings. Tests reject a second
helper bound explicitly to the live port. The automatic workflow must pass these
native tests, core update rejection/install/rollback checks and anonymous public
feed/archive checksum validation before handover.

Local Node syntax, release-state and prepare-publish checks pass. Local Windows/
PowerShell execution is unavailable; native behavior is checked in the existing
Windows release workflow. The rebuilt solver worker remains byte-identical to
v0.8.5: SHA256 26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a.
No solver, farm/account import calculations, game data or UI layout changes.
