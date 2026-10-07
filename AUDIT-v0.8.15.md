# Egg Inc. Virtue Farm Optimizer v0.8.15 — Release Audit

v0.8.15 fixes visible unit artwork sizing/alignment and increases picker detail
sizes. Current validation appears in the v0.8.15 section below; prior evidence
is historical.

v0.8.14 adds currency and egg units to pickers/timeline, simplifies picker
estimates, sorts vehicle summaries, and adds Automatic/full timezone choices.
Current validation is in the v0.8.14 section below. Earlier evidence is historical.

v0.8.13 corrects the stage adapter’s Bust Unions discount, simplifies strategy
selection and adds shift start dates and peak rates. Prior evidence below is
historical; current validation and the limits of the opening comparison appear
in the v0.8.13 section at the end.

v0.8.12 compacts the artifact controls, adds visual ship selection, moves
Assumptions to How It Works and replaces artifact text in shift summaries and
Quick Guides with horizontal gear/stone displays. The current audit consolidates
prior solver evidence and the new presentation checks below.

v0.8.11 retries publication of the unchanged v0.8.10 app changes. The v0.8.10
Windows run passed build, package, native hidden launch, installation, restart
and rollback checks. Anonymous public-feed verification returned HTTP 403 after
five retries, and the pipeline hid that release as a draft. It remains untouched;
the new version runs the complete Windows pipeline and public verification again.
Only release metadata and this record change in the retry.

Publication is now verified. The original v0.8.11 Windows run also passed all
build/native update checks, but its initial public check received HTTP 403 and
left a draft. Recovery run 37563209722 verified that original commit and both
unchanged asset digests, downloaded the draft and checked every app file on
Windows, then published that same draft. The anonymous updater found v0.8.11,
downloaded the complete archive and passed all file checksums. No assets were
replaced and no new app version or runtime changes were introduced. The temporary
recovery workflow was removed after success; the normal release pipeline remains.

v0.8.10 reorganizes setup into Account → Virtue Farm → Planning. Account holds
progression and permanent bonuses. Virtue Farm combines current upgrades,
tabbed artifacts, expandable Common Research, fuel and existing flights.
All three pages retain the compact two-column desktop layout and existing
shared farm configuration, locks and calculations.
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
| Events | New UI farms default to the browser-detected timezone; saved zones are retained. Monday 09:00–Tuesday 09:00 earnings ×2; Friday 09:00–Saturday 09:00 research ×0.3, in the selected timezone. The model fallback remains Pacific. Special events are not predicted. |
| Purchases | Research rounds up; discounted hab/vehicle/car prices round down. Duplicate physical types affect prices. Calibration defaults to 1. |
| Switches | Gems reset, upgrades/deliveries persist, Soul Egg balance decreases and prior-switch count increases. Entered maximum new switches and interaction time are enforced. |
| Search | Every C1/K1 budget pair at 30-minute increments up to the selected maximum, capped at 300 minutes. No previous-plan incumbent. Caps include waits, interactions and fuel collection. Search is heuristic and does not prove a global optimum. |
| Routes | Optimized Sequence or User Selected Sequence. Entered visit order is honored; compatible upgrade visits share staged purchase rules. |
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


## Review sequence and remaining research cost — v0.8.7

The sidebar and Continue buttons follow Farm & Account → Artifacts → Common
Research → Planning. Farm Research is renamed Common Research without changing
its internal tab ID or saved research schema. All three review actions remain
available with unrelated invalid input and navigate without starting a worker.
Planning retains its existing Find Fastest Plan action and solver behavior.

The EID field and green import arrow sit directly below the Farm & Account
heading. Existing accessible labels, Enter behavior, sync API, account-name/EID
preferences, editing locks and backup timestamp remain. Local Planning sidebar
information and Import Details, including their rendering references/styles,
are removed. Imported/retained source badges and import result notices remain.
The two-panel farm/account and planning layouts are preserved.

Common Research adds Cost to Max immediately after Next Cost. Its display-only
preview prices every remaining level individually with the existing simulator
price function and round-up rule, at the entered start time and active loadout.
It applies the same Epic Research, Colleggtible, artifact and calibration
multipliers and current sale as Next Cost. Maxed research displays zero. Locked
research still shows its remaining cost, excluding tier prerequisites. It does
not forecast future sales or mutate research levels, farm state or the solver.
Compact rows, tier disclosures, default completed-tier collapse and filtering
remain; costs use compact notation with exact amounts in tooltips.

Targeted Chromium page-navigation, research-artwork, planning-clarity and
ui-polish suites pass. Checks cover all Continue labels, sidebar order,
removed UI, EID placement and actual synthetic protobuf/API sync, persisted EID
identity, invalid-input navigation, save/load values and Reset/Undo. All 56
cost totals are checked against an independent per-level formula, including
completed research, rounding, changed Epic Research, Cube discount, calibration
and current research-sale pricing. Frozen-state previews verify no mutation.
Existing tier/filter/keyboard, replayed worker plan, offline artwork/fallback,
focus and desktop/mobile overflow checks pass at widths down to 320 pixels.
Header and research desktop/mobile screenshots were inspected. No live-account
request or native screen-reader check is claimed. The historical import-account
suite remains unavailable because its two fixture dependencies are missing;
its header/detail assertions were updated for the current UI.

No solver, game data, account import calculations, ship scheduling or updater
source changes. The rebuilt solver worker remains byte-identical to v0.8.6:
SHA256 26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a.
The established Windows release workflow checks native hidden launcher,
updater install/restart/rollback, packaging and anonymous public-feed/download
checksums before release handover. Local PowerShell execution is unavailable.

Local npm ci/build, release-state and prepare-publish guards pass. Packaging
verifies 164 runtime files, archive integrity and one current audit.


## Visual gear editing and detected defaults — v0.8.8

Hab selectors now display 56-pixel artwork without visible item/slot names. The
native select overlays each tile, retaining its values, Habitat N accessible
name, keyboard operation and item-name tooltip/menu. Empty tiles remain labeled.
Missing sprites or forced colors reveal the text control. Only hab picker
artwork grows; vehicle and timeline artwork mappings and sizes remain unchanged.
The three farm file actions align at the bottom right of the header beside the
source/backup line, matching the requested screenshot. Narrow screens wrap them.
The compact two-panel farm/account and planning layouts and review flow remain.

Artifact images and empty placeholders are now buttons opening an illustrated
catalog dialog. It supports filtering by name, tier/effect, selected-item state,
rarity borders, readable names/effects/socket counts and Empty to clear. Each
artifact displays exactly its catalog socket count, with independently clickable
stone slots opening the stone catalog. Modal focus containment with explicit Tab/Shift+Tab edge wrapping, sticky
controls, close/backdrop/Escape cancellation and focus restoration are provided,
including replacing an artifact with a different socket count. Search and cancel
do not change gear or invalidate an existing result. Missing images retain text.
Manual-edit fieldsets still enforce the existing account/farm locks. Imported
owned automatic sets remain previews until manual editing is enabled. Selection
uses the existing value IDs, change/input processing, socket reset policy,
permit limits, family validation and save schema. Review routes hidden-control
errors to their visible image buttons, with visible and accessible error text.
No ownership limits or new gear choices are imposed on existing manual overrides.

New UI farms, Reset and Next Ascension default to currently claimed TE + 40,
capped at 490. The default tracks claimed progress edits and active/account-only
backup imports; pending TE are excluded. Entering a target switches to an explicit
goal. Saved explicit goals remain unchanged. An optional targetMode property in
the version-1 plan retains automatic intent through farm saving and updater
handoffs. Importer's fresh-form detection recognizes this new default, retaining
its previous initial import behavior. Production/import calculations are unchanged.

The browser's Intl timezone is detected for new UI farms and Reset. As requested,
it defaults both displayed dates and weekly event timing to that zone. Arbitrary
valid detected/saved IANA zones are added to the existing selector. Saved zones
remain selected; unavailable detection falls back to Pacific. Start input remains
PC local time. This changes default inputs; event calendar math and explicit-zone
interpretation remain unchanged.

Targeted browser validation is recorded after the final checks below. Native
screen-reader execution and live-account requests are not claimed. The old
import-account suite still lacks its two fixture dependencies; self-contained
suites cover synthetic backup and real protobuf/API sync. No solver, game data,
ship scheduling, PDF or updater source changes. The solver worker SHA256 remains
26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a.
The established Windows workflow must pass hidden-launcher, core updater,
install/restart/rollback, packaging and anonymous public-feed/archive verification
before handover. Local native PowerShell execution is unavailable.


Final local validation: npm ci/build, Node syntax, release-state and prepare-publish
guards pass. All eight Chromium suites pass: visual-gear, page-navigation,
loadout-artwork, farm-artwork, research-artwork, planning-clarity, ui-polish and
timeline-readability. Checks include picture selection/clearing, catalog rarity,
0/1/2/3 sockets, socket replacement, locked/manual/automatic sets, duplicate-family
error review, keyboard/Escape/focus, non-mutating search/cancel, save/load,
Standard/Pro Permit layouts, offline choices and missing-art fallback. Targets
track claimed progress through manual edits, active/account-only synthetic import,
saving/reloading, Reset and Next Ascension; explicit goals remain. Timezone checks
cover UTC, New York, Berlin and India (including equivalent IANA aliases), while
saved Pacific selections remain. Synthetic EID sync still uses the actual
protobuf/API path. Existing worker replay, tiers/cost previews, timeline
content, focus and 1440–320 pixel overflow/two-panel checks pass. Header, enlarged
hab tiles, artifact cards and desktop/mobile artifact/stone popups were inspected.
The generated solver worker checksum is unchanged.

Packaging verifies 164 runtime files, archive integrity and one current audit.


## Physical image choices, ordering and date confirmation — v0.8.9

Click any hab or fleet image/Empty placeholder to open the shared illustrated
chooser. Choices use a compact vertical image/name/details row matching the
provided screenshot, plus search, selected state and Empty. Closed selectors
show images, with accessible slot/current-item names and item-name tooltips.
Missing sprites and forced colors retain readable names and the same controls.
Manual farm locks, fleet unlock visibility, Hyperloop car inputs, existing IDs,
round-trip values, validation review and unchanged saved schema remain intact.
Hab picker artwork is 42px (56px reduced by 25%); vehicle picker artwork is
18px square or 36×21px wide (24px or 48×28px reduced by 25%). Timeline artwork
sizes and asset pixels are unchanged.

Capacity uses simulator.stats on a cloned state containing only the candidate
item, incorporating current research, portal/hover/Hyperloop factors, current
artifact modifiers, Epic Research and Colleggtibles. Vehicle rates show eggs/hour;
an already selected Hyperloop retains its current car count, while a new train
shows one car, stated beside its rate. Prices use simulator.price for the
specific replaced slot, including other copies and existing discounts.
Affordability subtracts current gems and divides by current event earnings in
the selected earnings mode. It is explicitly a current-rate estimate, assuming
full habs, maintained silos and no future events or purchases. Zero-income farms
show No current income, affordable items show Affordable now, and estimates
beyond a year use a concise >1 year label. Invalid required inputs show unavailable
estimates rather than stale values. This preview does not execute purchases or
predict new upgrade routes.

Fuel inputs now stack vertically and Truth Egg Progress follows C K I R H.
Underlying game-data indices, saved fuel keys, claimed/delivery arrays and
solver ordering remain unchanged. Per-Virtue goal order is retained.
The sidebar's specific margin rule now puts Update App at the bottom in desktop
windows; independent scrolling keeps it reachable in short windows. Mobile
navigation retains its existing layout.

Click Start or Choose Date & Time to open a PC-local date/time dialog. Edits stay
in the dialog until the bottom-right Ok button commits both values; Cancel,
Escape and backdrop dismiss without changing the plan. Required-date/time
validation, Enter confirmation, Tab wrapping and restored focus are provided.
Typing in the original minute-precision start input remains supported. An
unchanged minute retains the exact original saved seconds. Draft modal fields
are excluded from plan invalidation and update handoff capture.

Validation: npm ci/build, physical-preview unit checks and all nine Chromium
suites pass, including new physical-picker checks. Coverage includes every
hab/vehicle row, calculated portal/hover/train/epic/duplicate-price factors,
zero gems/income, immutable preview state, filtering/cancel/focus/locks,
Hyperloop cars, save/load, exact image sizes, egg DOM order/vertical stacking,
bottom sidebar alignment, date commit/cancel/required validation/second precision
and 1440–320px layouts. Existing suites retain actual synthetic protobuf/API
imports, worker execution and action replay. Catalog and worker SHA256 remain
unchanged. Screenshots of desktop/mobile choosers and date panel were inspected.
The standalone import-account suite still lacks its two existing fixtures.
Native Firefox, live-account and screen-reader execution are not claimed.

Node release-state and prepare-publish guards pass; packaging verifies 164 runtime
files, ZIP integrity and one current audit. The established Windows workflow
must validate hidden launcher, updater install/restart/rollback and public-feed
archive/checksum checks before handover. Local PowerShell is unavailable.
Solver worker SHA256:
26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a.


## Account, Virtue Farm and Planning — v0.8.10

Account is the opening/import page. EID/identity preferences, Soul Eggs, permit,
lifetime switches, Truth Egg Progress, Colleggtibles and Epic Research are here.
Virtue Farm combines starting farm values, habs, fleet and Common Research in
the left column, with artifacts, tank/fuel and existing flights in the right.
Planning retains its existing goals, strategy, dates/events and planned missions.
Navigation and Continue buttons follow Account → Virtue Farm → Planning. The
Planning review button returns to Virtue Farm. Import backup/source information
remains visible on Account and Virtue Farm; EID controls appear on Account.
Help, README and flight/research import instructions match the new locations.

Common Research now sits in a closed Review Research disclosure, retaining
all original levels, tiers, cost previews, filters and completed-tier collapse.
Artifact Current/Earnings/Delivery tabs show one existing set at a time in a
compact two-column gear grid (one column on narrow phones). Accessible tablist,
selected state, one tab stop, arrow/Home/End movement and labeled, focusable
panels are provided. Tab switching is UI-only and does not change active set,
gear, goals, saved data or result validity. Copying an alternate set retains
its existing deep-copy behavior and selects Current for immediate review.
Manual gear/image/socket choices and automatic inventory sets are unchanged.

Existing account/farm lock groups and source provenance stay intact. A linked
Edit Account Manually checkbox on the fuel panel controls the same existing
account setting; it creates no new persisted permissions or solver inputs.
Validation chooses the destination page, artifact tab or enclosing research
disclosures/tier and focuses the visible control or corresponding edit toggle.
Reset/Undo preserves the selected artifact tab. Update handoff captures/restores
that UI selection; legacy artifacts/research page names route to the integrated
Virtue Farm panels. Existing farm/plan schema and updater protocol are unchanged.

Validation: npm ci/build, Node syntax, physical-preview, release-state and
prepare-publish checks pass. All ten Chromium suites pass: page-navigation,
visual-gear, physical-picker, farm-artwork, research-artwork, loadout-artwork,
planning-clarity, ui-polish, timeline-readability and update-error. Navigation
covers panel location/visibility, primary labels, keyboard tab movement,
non-mutating tab review, copies/stones, shared goals/missions and exact values,
save/load, cross-page validation, closed research, linked fuel locks,
Reset/Undo selection, real protobuf/API EID sync and persistent identity.
Actual browser updater capture/reload/restore retains the selected artifact
tab and config; injected older artifacts/research snapshots route correctly.
Existing tests retain actual solver execution/replay, timeline presentation,
research/physical price previews, Standard/Pro Permit and image fallbacks.
Paired-column and overflow checks pass from 1440px to 320px, with independent
short-window sidebar and focus access. Desktop/mobile pages were inspected.
The import-account suite still lacks its two existing fixture dependencies;
live-account, Firefox and native screen-reader execution are not claimed.

Packaging verifies 164 runtime files, ZIP integrity and one current audit.
The established Windows workflow must pass hidden launcher, updater
install/restart/rollback and public feed/download checksum verification before
release handover. Local PowerShell is unavailable. Simulator, optimizer,
worker, game data, import math, ship scheduling and updater source are unchanged.
Solver worker SHA256:
26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a.


## Compact artifacts, visual ships and H2 gear — v0.8.12

The Virtue Farm artifact panel uses compact tiles in one desktop row, with two
columns on small phones. Exact socket counts remain; editable empty sockets
use a + and fixed square dimensions with 50% rounding, overriding general
button minimum heights. Native controls and manual locks retain existing values.
Current/Earnings tabs remain. The Delivery tab, copy button and normal starting
choice are removed. A hidden legacy option and native delivery values preserve
existing saved configurations and solver inputs. Old delivery-tab handoffs land
on Current. Invalid delivery gear in an old saved file can still be reviewed and
corrected through validation; it does not restore normal delivery selection.

Read-only gear strips replace artifact text in shift summaries and Quick Guides.
Each equip action uses its recorded loadout, or the saved named manual set for
older plans. H2 without a new equip shows the gear carried from earlier shifts.
Presentation sorts a copied slot list Gusset, Metronome, Compass, then other
artifacts, with empty slots last. Slot count follows the saved permit and each
artifact keeps its actual stones. Raw actions, equipment order, replay, research
and solver calculations are unchanged. Compact family labels keep phone rows
readable; full item names/effects and stone names remain accessible/tooltips.

The start input retains its click/keyboard date dialog and Ok/Cancel, without a
second launcher button. Assumptions move intact from Planning to How It Works.
Ship image buttons use the existing illustrated dialog with 11 offline game
icons, search, selection state, cancellation and restored focus. Fuel is for the
row's selected mission length, per launch, ordered C K I R H. Cost uses the
existing ship catalog; ETA subtracts current gems and divides by current event
farm earnings. It assumes full habs and maintained silos, excludes future events,
upgrades and fueling, and shows affordable/zero-income/unavailable cases.
No ownership, mission availability, scheduler or ship-cost rules are changed.
Original ship pixels are bundled losslessly from the same pinned asset mirror
as habs/vehicles, with mapping, hashes and attribution. Existing managed asset
paths support these files; no updater allowlist or runtime source changes.

Validation: npm ci/build, Node syntax, physical-preview, release-state and
prepare-publish checks pass. All eleven Chromium suites pass, including the new
equipment-flow suite. It checks compact rows, exact circular sockets and + edits,
legacy delivery round-trips, no delivery controls, input-only dates, all ship
artwork/costs/fuel, finite current-rate ETA, affordable and zero-income cases,
search/cancel/order/focus, assumptions location, real replayed automatic H2 gear
whose stones differ from its starting preview, inherited H2 gear, both summary
and Quick Guide, unchanged actions, and 1440–320px layouts. Updated navigation,
physical-picker and actual browser update-handoff suites pass. Existing gear,
research, farm artwork, planning, timeline and polish coverage remains passing.
Desktop/mobile artifacts, ship catalog and H2 views were visually inspected.
The standalone import-account suite still lacks its two existing fixtures;
no live-account, native screen-reader or Firefox execution is claimed.

Packaging checks 167 runtime files, ZIP integrity and one current audit. The
Windows workflow must pass native launcher/update/rollback checks and anonymous
public-feed/archive verification before release handover. Local PowerShell is
unavailable. The solver worker is byte-identical to v0.8.11:
26a402fae2d31a8c270bf7fd6d03e0e0ebbda684095f4f5c1ad4cb5937b0625a.


## Opening discount and shift rates — v0.8.13

Cause: the bundled reference vehicle planner reads Bust Unions through its
`cheaper_vehicles` alias, while the adapter supplied only canonical `bust_unions`.
The engine therefore forecast undiscounted vehicles and cars, truncating bounded
K1 proposals before actual replay could use the account’s discount. The adapter
now creates an independent Epic Research map containing the translated alias.
Simulator prices, account Epic IDs, permits, purchase permissions, time caps,
calibration, offline minimums and ship scheduling remain unchanged.

On the retained private 160→200 comparison farm, the old 90/180 short-online
proposal predicted 10,146.749 seconds for K1; actual execution took 5,676.987.
The corrected 90/120 proposal contains the same 49 physical purchases and predicts
5,073.374 seconds, then executes to the same 5,676.987 seconds under the actual
interaction/offline rules. The full fresh 12-pair 90/120 search finds C1
4,616.141 seconds (displayed 1h 16m 57s), K1 5,676.987 seconds and the previously
validated complete run of 11,880,595.603 seconds. All actions replay under the
smaller opening caps, with the entered ships/fuel and offline minimum unchanged.
This retained farm’s complete duration is 137d 12h 9m; the user’s newer
136d 23h 24m 38s configuration was not supplied, so that exact total is not claimed.
The fresh 36-pair 180/180 comparison finds a further 145.586-second improvement
using a different C1 proposal budget. Larger proposal budgets can still change
heuristic purchase choices even when actual durations fit smaller caps. The fix
restores the omitted discount; it does not enumerate all feasible purchase orders
or prove a global optimum. No private farms, EIDs or plans enter tracked source.

Optimized Sequence and User Selected Sequence are the only menu choices. Older
automatic/free-routing configurations map to Optimized Sequence for subsequent
searches; custom routes retain their entered sequence. Original saved results
replay before UI migration with the original configuration/actions. Legacy solver
strategy IDs remain accepted for that replay. The switch-tradeoff table is removed
from display without altering recorded solver frontier data.

Shift summaries show start above end, with semantic times. Each visit’s peak
rates are reconstructed from its starting configuration, purchases and immutable
recorded artifact loadouts. Earnings use the selected earning mode and weekly
multiplier; event boundaries are matched to the gear/upgrades present then rather
than multiplying an early event by stronger later gear. Shipping and laying are
capacity before fuel diversion. Peaks survive set replacements, inherited gear,
zero-duration purchases, waits, ship launches and missing historical before/after
snapshots. The same values appear in Quick Guide Shift Complete and PDFs. Raw
actions and replay timing are unchanged. Legacy reasons/notices display gems
through a presentation formatter; persistent currency keys remain compatible.

Self-contained opening-discount regression checks both permits and zero/partial/
max Bust Unions, independent simulator prices for every proposed vehicle/car,
proposal truncation, actual K1 caps, affordability replay and account immutability.
Shift-rate regression covers both earning modes, weekly event/gear pairing,
calibration, independently calculated peaks, inheritance, legacy snapshots,
unchanged actions, strategy migration and historical gem wording. PDF text and
rendered pages are inspected for dates/rates, completion and currency wording.
Browser, packaging and Windows release results follow after completion.

Local validation completed: npm ci/build, Node syntax, opening-discount,
shift-rates, physical-preview, release-state and prepare-publish checks pass.
All eleven Chromium suites pass: timeline-readability, planning-clarity,
equipment-flow, page-navigation, physical-picker, loadout-artwork, visual-gear,
farm-artwork, research-artwork, ui-polish and update-error. Updated timeline
checks cover the two strategy choices/default, legacy automatic migration,
retained custom routing, semantic start/end ordering, identical peak values in
summary and completion, no tradeoff table, historical gems wording with unchanged
replayed reasons, lazy breakdowns and 1440–320px layouts. Actual browser worker
execution, artifact gear/stone displays, imports, research, physical pickers,
update handoff/legacy page routing and compact paired panels remain passing.
Desktop/mobile timeline and PDF summaries/completion were inspected. The older
standalone import-account suite still lacks its two fixture dependencies.
No live-account, native Firefox or screen-reader execution is claimed.

Packaging verifies 167 runtime files, closed ZIP integrity and one current audit.
The generated worker SHA256 is now
b4cc67c1c7a05b66df423a2e83f1e37bef62f1a603ca4a1cb55ce6a326d43bfc,
reflecting the reviewed proposal-discount/strategy changes. The prior byte-identical
worker statements above describe historical releases. Native Windows launcher,
installation/restart/rollback and anonymous public-feed/archive checks must pass
in the established automatic workflow before release handover. Local native
PowerShell is unavailable.


Publication is verified. Original Windows run 37575363920 passed build,
packaging, native hidden launch, install/restart/rollback and both asset uploads.
Its first anonymous check received HTTP 403 after retries, hiding the release as
a draft. Recovery run 37575699986 rechecked that original job and immutable
commit e9a783b19b024f94a17c0a624aedecedf557657f, release ID 405403481,
both original asset digests, the manifest and every app-file checksum on Windows.
It published the same draft and the anonymous updater found v0.8.13, downloaded
the complete archive and verified all file checksums. No asset was replaced,
no new version/runtime change was introduced, and the temporary recovery workflow
is removed after success. The normal release workflow remains unchanged.


## Units, timezones, and model revalidation — v0.8.14

Timeline summary and Quick Guide peak rates use the original Virtue gem for
income and the current shift's egg for laying/shipping, followed by /hour.
Both rate lists are left aligned. TE gains use +number and that shift's egg,
including the Shift Complete strip; switch cost uses the Soul Egg image.
Image units retain accessible names and text fallback for failed artwork.
Hab/vehicle choices retain the same research-aware capacity, price and current
income calculation. Estimates omit “to afford”; zero wait displays ~<1,
including the free Coop. Ship images are 48px rather than 64px (25% reduction).
Mission-specific cost, fuels and estimate form three rows; all fuels fit one row
at desktop widths. Estimates assume unchanged current income, full habs and
maintained silos; they exclude future purchases, events and fueling.
The original gem is pinned to EggIncAssets e821c7c9d5b39a9aee3eed0144a732c39489de1e,
64/egginc/icon_virtue_gem.png; SHA256
55ca39d6da05b89d3549c7bc6fcdc6b23fde87e411d83fc59d58f9456a21a5a1.

Vehicle groups sort by base shipping capacity with catalog-order ties. Current
research modifiers preserve that speed order (hover/Hyperloop modifiers only
increase higher vehicle types). Actual purchases and replay action order remain
unchanged; the same presentation groups are used by the PDF.

New UI farms use eventTimezoneMode=automatic and store a resolved IANA
eventTimezone. Automatic resolves the device timezone for new searches; saved
plans replay their captured resolved zone. Explicit zones in older farms remain
selected. The menu includes every regional zone exposed by Intl, UTC and fixed
UTC-12 through UTC+14 zones, plus Kolkata/Kathmandu aliases. Regional zones
follow daylight saving; fixed UTC offsets do not. The event calendar now scans
quarter-hour boundaries so 09:00 local is precise in 30/45-minute offset zones.
Pacific/UTC whole-hour behavior is unchanged. Focused timezone checks cover
Kolkata, Kathmandu, Chatham, UTC+14 and the Pacific November DST transition.

Independent Wasmegg audit uses source commit
9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67 and game data commit
a089580df4cc6cce8a2f5a9a7dcf86583a2c216d. tests/reference-math.cjs accepts an
external bundle exporting the unmodified reference functions (computeSnapshot,
getArtifact/getStone, research price/tier helpers, hab/vehicle/car price tables,
silo duration/cost, TE thresholds, shift cost, Colleggtibles and mission tables).
WASMEGG_REFERENCE supplies that bundle; optional WASMEGG_AUDIT_PLAN supplies a
private historical replay fixture. No account information is tracked.

The current checkout passes 855 state comparisons, 13,980 research prices,
228 hab prices, 612 vehicle prices, 27 car prices, 47,880 tier decisions,
240 Colleggtible selections and 132 ship/mission/FTL combinations. Explicit
isolated coverage includes all 56 common researches at zero/mid/max levels,
all 22 Epic entries at zero/mid/max, all 171 artifacts and all 30 stones with
catalog bonuses/socket counts, all 19 habs under both permits, and all 12 vehicle
rates with unresearched/max-research scenarios. Empty/locked vehicle slots are
respected. Farm assumptions remain full hab population and selected earnings
mode; hatchery/UI-only Epic bonuses do not change steady-state delivery.

Two of 855 comparisons differ by one chicken due to floating-point multiplication
order before habitat ceiling. The tiny Coop fixture makes this a 0.338983% rate
difference; the large-farm case is 1.78431e-8 relative. All other relative rate
errors are <=6.37284e-16. The audit tolerance is bounded by that actual single
chicken capacity difference, not a broad percentage allowance.

Independent exhaustive income/research and delivery loadout oracles each pass
24 scenarios across both permits, online/offline modes, tier/socket tradeoffs,
owned/loose stones and laying/shipping bottlenecks. Catalog/projection checks
also pass farm snapshots, research-dependent train lengths, immutable owned
gear, future five/four-socket catalogs and a complete synthetic 160→200 TE
route with exact time/delivery/affordability replay. The Bust Unions proposal
regression and 120-minute K1 cap pass. Rate/event/gear pairing, physical previews,
vehicle display order, and Automatic/explicit/fractional timezone tests pass.

Four affected Chromium suites pass at 1440–1000px: timeline-readability,
physical-picker, visual-gear and equipment-flow. Desktop screenshots are reviewed
for timeline units/alignment and ship fuel rows. Mobile checks are no longer run
for this batch at the user's request. npm ci/build, release-state, prepare-publish
and diff checks pass. No purchase strategy/catalog changes were needed; the only
simulation change is precise fractional-timezone event timing. The solver remains
a heuristic search; this audit verifies calculations and replay, not global
optimality. PDF text units remain readable words; its vehicle order is shared.

Windows release proof: app commit 03522803623b0e17e990623df6ddfde629fd1b73;
automatic Publish App Release run 37578025152 / job 112651184472 succeeds.
The Windows build/package has 169 runtime files. Archive guards, seven bad archive
cases, digest mismatch, rollback, exact backup restore, preserved user settings,
and stage tamper checks pass. Actual CMD launches from paths with spaces,
hidden/reused helpers, successful restart, startup-failure recovery and legacy
worker recovery all pass. Windows PowerShell 5.1.26100.33438 anonymously reads
the published feed, downloads the complete release and verifies every app-file
checksum. The first feed attempt succeeds; no recovery workflow was needed.

Published release v0.8.14 is public (not draft), targets the app commit above and
contains exactly both verified uploaded assets:
- Egg-Inc-Virtue-Farm-Optimizer.zip: 8,558,921 bytes; SHA256
  fe6963488d6ac8a9d506bd615840e226f1a379fc65e5b9b0d91902c664ae18ea.
- update-manifest.json: 240 bytes; SHA256
  c9758cd9744e3ccc980aa9e03a735786a3b48f00dcca0d2a28ef5bfacbcee0e7.

This final audit proof is a same-version documentation commit after the immutable
release assets were verified; it does not replace or repackage them.


## Unit sizing and picker readability — v0.8.15

The v0.8.14 gem source has only 39px of visible artwork within its 64px canvas,
while the eggs use different source sizes/padding. Giving every original a 20px
image box therefore produced inconsistent visible sizes. UnitIcons now frames
the visible bounds (alpha >16) of the pinned original gem, five Virtue eggs and
Soul Egg in a fixed symbol box. CSS positions/scales each original with its
aspect ratio preserved; no artwork file is edited or replaced. Symbols are
centered beside the numeric text, with tabular numerals and consistent spacing.
Timeline rates use 16px symbol boxes; TE gains/switch cost use 18px. Picker costs
use 20px, ship fuels 18px. Broken images still fall back to readable unit names,
and accessible labels retain quantities/units.

Hab, vehicle and ship metadata increase to 13px (previously 11px, with ship fuel
at 10px); vertical row gaps increase to 6px. Ship selection is up to 960px wide
instead of 850px so the larger details stay readable. Fuel captions remove only
redundant trailing zeroes (25.000T becomes 25T, 2.400T becomes 2.4T); the rounded
numeric value, original accessible quantity and all saved values are retained.
All fuels still fit one line. Farm columns, hab/vehicle/ship artwork sizes,
purchase calculations and replay actions stay unchanged.

npm ci/build, release-state and prepare-publish guards pass. Three affected
Chromium suites pass at desktop widths 1440–1000px: equipment-flow,
physical-picker and timeline-readability. Added checks verify fuel rows fit
inside ship cards, number/symbol centers align within 1px, symbol boxes are
square, and picker detail fonts are at least 13px. Desktop screenshots of hab,
vehicle, ship, timeline and Quick Guide layouts are reviewed. Mobile layouts
are not checked, as requested. The solver worker SHA256 remains exactly the
v0.8.14 value:
4c7950f0d1fd01da5189a6aed4a59806f05c5ea5823951e9c056bfda4d7da272.
No solver/catalog/math source changes were required.

Windows release proof: app commit fa586edcd152d50e47e65b46f04506e0d07e02c9;
automatic Publish App Release run 37583381597 / job 112667908063 succeeds.
The native Windows build packages 169 runtime files. Archive validation, rollback,
preserved user settings and tamper guards pass. Hidden CMD launch, repeat-launch
reuse, successful restart, startup-failure recovery and legacy-worker recovery
pass. Windows PowerShell 5.1.26100.33438 anonymously finds v0.8.15, downloads
its complete archive and verifies every app-file checksum on the first attempt.

The public release targets the exact app commit and contains both verified assets:
- Egg-Inc-Virtue-Farm-Optimizer.zip: 8,560,666 bytes; SHA256
  fdc6dd9828648d5a28803dd0653c3d58933a9a864eabce3706f76b2b273fa624.
- update-manifest.json: 240 bytes; SHA256
  d566fa00e1c2e87c8cac0a3d8179ce7c4dffbf5a22ff8340b163810a0915d198.

This final audit proof is recorded after release verification without replacing
or repackaging the immutable release assets.
