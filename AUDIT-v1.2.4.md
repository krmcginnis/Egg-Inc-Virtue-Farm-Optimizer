# Egg Inc. Virtue Farm Optimizer v1.2.4 — Release Audit

## Accepted publication — October 30, 2026 (Pacific Time)

v1.2.4 is published and accepted. Windows run
[41143788202](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/41143788202) passed all 40 required suites for source
commit `ba808b6c14e2c0657ae7db13250abf001ff37ba4` (job `124364011865`).
The native updater/launcher, complete-asset publication and public update-feed,
full archive download and runtime-hash checks passed. Windows logs specifically
confirm the adjacent-count and automatic final-plan evaluation suites.

Independent anonymous downloads verified the latest tag/source, both asset sizes
and GitHub SHA-256 digests, ZIP CRC, all 169 archive entries and
167 runtime file hashes, the sole current audit and repository/version metadata.
The public compiled app passed Deep-default/old-plan and three-column comparison tests,
including automatic checks before presenting a remaining-plan proposal, saving,
reloading and application. Real Chromium against the public ZIP verified the
reported saved plan and three live Blob purchase-check workers after merged search,
completed statuses on all three plan headers, no separate completed-check action, per-plan
selection/checkpoints and responsive layouts. The public worker matches the
validated source worker SHA-256 `9a45ea34b24319e80aa8f331b089458d61dcefbd7c7b4e798d77d64bbe7c4280`.

Published assets:

- Egg-Inc-Virtue-Farm-Optimizer.zip: 8652764 bytes; asset `693735165`; SHA-256 `3896d99c5f16bef10b159b3ec290fb46704b150a2abf9ea28d6419d7236105ad`.
- update-manifest.json: 239 bytes; asset `693735166`; SHA-256 `85083bd395e68588d6604a9e2df7f120d8715afbc3a28f4fe897cfb5d7608883`.

The immutable public ZIP contains the prepublication review below. This acceptance
evidence was added afterward in source; assets are unchanged. Install through
Update App → Update & Restart. Start a new search or reoptimize a checked farm
to run the automatic purchase checks; loading a saved plan preserves its timeline.

## Release review — October 30, 2026 (Pacific Time)

The comparison presents the fastest complete paid plans found at exactly N+1,
N and N−1 shifts, in that order. N is selected by default when available. The
three plans are selectable column headers; rows compare shift count, elapsed
time, projected finish in 24-hour notation, maximum laying and shipping rates
in eggs/hour, and future Soul Egg cost. The selected column is highlighted.
Manual selection changes the timeline and exports, survives saving/loading,
and works in the remaining-plan preview before application. No recommendation
or slowdown preference is applied.

N is the remaining specified comparison count. New Automatic Planning searches
no higher than N+1, capped at 30, and reserves route proposals for all three
counts. Completed-plan refinement focuses on those counts. Internal per-count
winners remain available for paid merging and fallback. Legacy unflagged plans
retain their original ceiling during replay. Run tracking still subtracts shifts
already used from the specified total; a new remaining search can compare one
extra shift. Manual routes retain their entered order and original constraints.
The new comparison metadata survives replay and manual purchase checks.

Missing exact-count plans are labeled not found within the budget, never declared
impossible. N=0 has no minus-one option; N=30 cannot search above the supported
ceiling. If N is unavailable, the fastest available requested count is selected.
If no requested count completes, the best other completion is retained as a
fallback timeline and identified explicitly. Loading older plans preserves their
selected timeline and checked progress; it cannot invent unsaved alternatives.
Start a new search or reoptimize for the new comparison.

Peak capacities are reconstructed across recorded research, physical purchases
and artifact changes using the existing rate model. Laying and shipping peaks
may occur at different times. They are capacity peaks before fuel diversion and
silo downtime, not average delivered rates. Soul Egg cost uses the sequential
shift formula from the starting Soul Egg balance and lifetime switch count,
not untrusted saved cost fields. Research and physical purchases still cost gems.

All available final comparisons run automatic purchase-order checks after the
merged search. Up to two workers share five additional minutes after the shared
three-minute, four-worker route search; the third plan uses a subsequent cohort.
Only paid, target-reaching results with the same count and a non-worse completion
are accepted after replay. Failure preserves the original valid plan; stopping
retains valid results and resumable checkpoints. Setup, final replay and minimum
cancellable slices can slightly exceed the nominal budget. Completed checks need
no separate action; older/unfinished plans retain the manual fallback. The game
model, Monday/Friday events and purchase formulas are unchanged. Bounded route
search and declared groups of up to five purchases do not prove global optimality.

## Validation gates

Selection and merger tests cover the exact requested counts and order, the N
default even when N+1 is faster, tie/missing/zero/upper-bound cases, old timeline
replay, saved manual choices, reserved routes and the N+1 ceiling. Paid solver
integration retains all three incumbent counts and the specified default. Three
final plans are checked using two workers at a time. Capacity/cost tests compare
reconstructed peaks and sequential shift costs, including stale saved cost fields.

Generated-app tests verify column headers, all six metric rows against replay,
column highlighting, busy locks, 24-hour dates, saving/loading, reoptimization,
preview/application and retained legacy progress. Chromium checks use the N=12
illustrative fixture with 13/12/11 columns and three real Blob purchase-check
workers after merged search, plus the actual reported saved plan. Responsive
layouts, manual/keyboard selection, check metadata and exports are inspected.
Native Windows checks and independent public-asset checks are publication gates.

All 39 locally runnable release/UI suites passed after building v1.2.4. Both
Chromium checks passed, including the 13/12/11 plan columns and six metric rows.
The Windows workflow requires 40 suites, including the native updater/launcher.
Compiled worker SHA-256: `9a45ea34b24319e80aa8f331b089458d61dcefbd7c7b4e798d77d64bbe7c4280`. Native Windows and independent public
acceptance remain separate publication gates.
