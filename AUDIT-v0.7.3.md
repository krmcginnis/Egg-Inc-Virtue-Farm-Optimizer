# Egg Inc. Virtue Farm Optimizer v0.7.3 — Release Audit

v1.6.2 fixes the PC launcher asset routes. The bundled images were present
in v1.6.1, but Local-Helper.ps1 returned 404 for every assets/ URL. The
launcher now registers only bundled asset files and serves them with their
correct image content types. Other app files remain outside the allowlist.

The solver evidence below is the unchanged v1.6.1 baseline.

Research projections and the actual automatic delivery recommendation now share
one owned-artifact optimizer. Farm & Goals retains the compact two-panel layout.

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
