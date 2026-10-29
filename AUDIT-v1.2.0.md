# Egg Inc. Virtue Farm Optimizer v1.2.0 — Release Audit

## Release review — October 29, 2026 (Pacific Time)

The application enables the benchmarked Deep profile for new and remaining-plan
searches: four independently created workers, a shared 180-second requested
budget, width 32, purchase-package depths 2/4/6, up to 1024 package-growth nodes,
eight refinement roots, and 120 refinement slices per worker. Opening work uses
up to 20% of the budget, the main route phase up to 45%, ordinary refinement up
to 55%, and adaptive work up to 95%. Final validation/collection can run beyond
the requested budget. Existing compatible saved plans remain search incumbents.
If a worker cannot start, workers already created can continue.

Resumable refinement keeps each asynchronous comparison's cursor and paid
context across slices. Family/depth coverage prevents cheap repeated jobs from
starving larger packages. Partial tasks remain owned by the worker holding their
cursor; completed tasks are sealed, and failed workers release unfinished work.
Cancellation unwinds suspended comparisons before returning. Only complete,
independently paid/replayed candidates are exchanged across workers.

Recommendation is a set-wide rule: take the fastest elapsed completion duration
found, then prefer the fewest shifts among plans no more than 5% slower. The
allowance is inclusive and never compounds between alternatives. Remaining-plan
searches use remaining duration. Per-shift purchase search still keeps its fastest
paid candidate; the tolerance does not permit wasteful purchases within one shift
count. The three-option limit retains both the recommendation and its fastest
reference. Manual choices remain selected across save/load, while recommendation
metadata is refreshed. Remaining-plan safeguards compare the retained fastest
option with the original-route baseline, allowing a valid slower recommendation.

## Benchmark evidence

The same hypothetical fresh farm started at 160 claimed TE, with no additional
pending progress, zero common research/cash, a free Coop/Trike and one silo.
Existing permanent bonuses and inventory were retained. Target was 200 TE, with
12 shifts available; ships and sleep were disabled identically. Each configuration
started independently with no inherited winner. One run per configuration used
a requested three-minute budget on an eight-CPU, eight-GiB test host.

| Configuration | Actual search seconds | Best 12-shift duration | Best 11-shift duration |
| --- | ---: | --- | --- |
| Current / two workers | 184.4 | 137d 15h 29m 40s | 143d 03h 02m 52s |
| Deep / two workers | 186.3 | 137d 15h 33m 12s | 137d 15h 33m 09s |
| Deep / four workers | 187.3 | 137d 15h 30m 22s | 137d 15h 30m 19s |

Combining independently replayed winners, the new rule selects the 11-shift
result, 39.364 seconds slower than the fastest 12-shift result. The 10-shift plan
at 151d 00h 28m 47s is about 9.72% slower and is excluded by the 5% rule.
Deep/four improves the former 11-shift option by 5d 11h 32m 33s. All deeper
workers exercised depth-six packages, with no failed cooperative jobs. Peak
observed process memory was about 4.66 GiB with four workers versus 2.43 GiB
with Deep/two. These observations do not guarantee the same result, time, or
memory use on other farms or hardware. Private inputs and saved plans remain
outside tracked source.

## Validation and publication gates

The release workflow requires the existing model, purchase, sleep, continuation,
worker, UI, packaging and native Windows updater/launcher suites, plus the new
shift-preference, resumable-refinement and compiled Deep-default suites. Public
publication requires the Windows workflow and anonymous update-feed/archive/hash
validation. Current validation state is recorded in VALIDATION.json; native
Windows and public-download results are recorded only after those gates pass.
The game model and saved-plan format are unchanged. Search is bounded and no
global optimality claim is made.

All 36 locally runnable release/UI suites passed for the v1.2.0 candidate,
including real four-worker Deep searches, cancellation, continuation replay,
serialized partial-job ownership, scoped paid context, family/depth fairness,
5% boundary/noncompounding checks, and manual selection save/load. The
compiled app test confirms four distinct worker portfolios, width 32 and a
shared 180-second deadline. Native Windows validation remains a publication gate.
