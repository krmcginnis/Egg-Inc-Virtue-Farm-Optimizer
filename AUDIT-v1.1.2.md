# Egg Inc. Virtue Farm Optimizer v1.1.2 — Release Audit

## v1.1.2 release review — October 23, 2026 (Pacific Time)

This release adds persistent run shift tracking and removes the sidebar hint.
Each loaded account retains only a starting lifetime shift count, claimed TE
identity, optional backup reset index, total allowance, and latest observation.
Account refreshes derive shifts used and remaining, including after a restart
or Start from Scratch. Saved run/continuation metadata can recover the anchor;
an older plan generated midway through a run cannot establish zero shifts used.
Unknown runs require a one-time entry. Changed run identifiers invalidate the
anchor instead of guessing, and stale backups are rejected. UI reset/undo cannot
roll back the stored observation watermark. Future ascension previews do not
overwrite the live account record. Saved files carry no EID in their run record.

Planning exposes the used count and total run limit, while Maximum New Shifts
continues to show the remaining ceiling. Ordinary and remaining-plan searches
receive that ceiling. The sidebar's account instruction hint is removed; backup
age remains visible. New model and generated-app checks are registered in the
Windows release workflow. Publication requires its complete Windows regression,
native updater/launcher, and anonymous public-feed gates.

The v1.1.2 build and all 29 locally runnable release/UI suites passed.
The complete release workflow has 30 suites, including two native Windows
updater/launcher suites; the additional local UI check covers sleep controls.
Per-suite results are recorded in VALIDATION.json. Checks include account
isolation, blocked/malformed storage,
new/stale snapshots, reset/restart, file tracking, continuation accounting,
worker requests, actual generated-worker search/replay, and the removed hint.
The supplied saved remaining plan independently loaded/replayed with its prior
timeline context intact and recovered anchor 56, six used, and six remaining.
The supplied mid-run eight-shift plan correctly provides no zero-used anchor.
DOM checks do not constitute a real desktop visual review. Native Windows
publication checks remain pending until the release workflow passes.

## Accepted v1.1.1 publication — October 18, 2026 (UTC)

v1.1.1 is published and accepted. Windows run
[39096125107](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/39096125107)
passed all 28 required workflow suites for source commit
`d1786148188785303309773d2f395041d9e2cc06` (job `117582836132`). This includes
finite-search oracles, real worker coordination, generated-app DOM workflows,
compiled-worker continuations, and the complete existing model regression gates.

Native updater/launcher checks passed installation and version/digest guards,
invalid archives, rollback, exact backup restoration, user JSON/config retention,
stage tampering, hidden CMD launch/reuse from paths with spaces, successful
restart, startup-failure recovery, and legacy-worker recovery. The anonymous
public feed, complete ZIP download, and app file checksums passed on Windows
PowerShell 5.1.26100.33438.

Independent anonymous downloads verified the latest tag and source commit,
both asset sizes and GitHub SHA-256 digests, update-manifest hash, ZIP CRC,
all 169 archive entries and 167 manifest file checksums, version/repository
metadata, the sole current audit and link, and compiled UI/verification code.
Real desktop visual layout remains unverified; DOM behavior is covered above.

Published assets:

- Egg-Inc-Virtue-Farm-Optimizer.zip: 8660678 bytes; asset `652442091`; SHA-256
  `afa18764cfbe87891879a22a662c4c2762a5a99b1dde5f51846453472f908dea`.
- update-manifest.json: 239 bytes; asset `652442092`; SHA-256
  `ab6ba6275cd70b07c7a2078320293663d87f3bd4059e69250eac4140771de133`.

The immutable published ZIP contains the reviewed prepublication audit. This
acceptance evidence was added afterward in source; published assets remain
unchanged. Install through Update App → Update & Restart.

## v1.1.1 release review — October 18, 2026 (UTC)

This release combines the search/verification work and the subsequent UI pass.
Detailed algorithms, finite-check scope, benchmark methods, and limitations are
recorded in SEARCH-VERIFICATION.md and SEARCH-RESEARCH.md. Local check results
are recorded in VALIDATION.json. Publication requires the Windows workflow's
complete regression, native updater/launcher, and anonymous public-feed gates.

The v1.1.1 build and all 27 locally runnable release/UI suites passed before
publication, including release-state, publish staging, both optimality suites,
real worker coordination, compiled-worker continuations, and sleep-controls DOM
integration. These local checks preceded the Windows results recorded above.

The normal search keeps its 90-second budget and one/two-worker selection.
Calculated production/affordability departures supplement sampled candidates.
Optimistic milestone and funding bounds avoid impossible branches without
using a heuristic score as proof. Workers coordinate exact refinement identities
and release unfinished jobs after a sibling failure. All winners independently
replay actual costs, prerequisites, owned gear, sleep, fuel, missions, and TE.

Selected groups of up to five existing purchases receive exhaustive legal-order
and subset checks under the declared earliest-affordable completion policies.
The automatic check uses at most five seconds of the remaining normal budget,
on worker zero. Purchase Order Check can continue for up to five minutes, pause,
and save/load its exact frontier. These finite checks do not exhaust additional
upgrades, joint changes across groups, routes, intentional waits, or continuous
departure time. The global optimum remains unproven. The displayed optimistic
minimum is a floating-point bound under the entered model, not expected savings
or statistical confidence; its remaining gap can be wide.

Paired two-worker trials against v1.1.0 used identical private inputs, width 16,
a 90-second allowance, and advancing historical clocks. Original case: 20.821 s
baseline / 26.957 s updated, with the best six-shift finish preserved. Follow-up:
29.744 s / 26.407 s, finishing 25,041.98 s (6h 57m 22s) earlier with six shifts;
its five-shift alternative improves by 302,955.55 s (3.506 days). Every alternative
replays and retains sleep, TE/floors, and all 351 launches. These observations
do not imply universal runtime or plan-quality gains. Exact-state reduction in
a controlled five-purchase oracle uses 32 states versus 326 enumeration nodes,
with the same optimum. Four plans provide 234 prefixes and 13,104 funding-level
comparisons without rejecting their known feasible completions.

The UI exposes account loading, makes Save Plan and Export Walkthrough prominent,
adds next-step navigation, prioritizes progress, and separates purchase checks
and next-ascension actions. Availability reasons are visible. Existing best time
is retained during optional checks; startup and worker failures retain a valid,
retryable plan. DOM integration uses the generated app and real worker threads
for loading, saved alternative selection, scroll restoration, next-step focus,
changed-input/progress states, failure recovery, pause/save/load/resume, scope,
and next ascension. This is behavior validation, not visual layout verification.

Local Chromium is blocked by socket restrictions, and the remote browser cannot
reach the local app. Real desktop visual checks remain unverified. Native
PowerShell checks run in the required Windows release workflow. No updater or
launcher production code changed. Existing game-model assumptions and numeric
rounding limits remain those recorded in the prior accepted audit below.

## Prior accepted release evidence

## Accepted v1.1.0 publication — October 18, 2026 (UTC)

v1.1.0 is published and accepted. Windows run
[39088277036](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/39088277036)
passed all 26 workflow suites for source commit
`a05f2ad64542e1f217e93c16ee1a2b1b2e8722a0` (job `117559346680`). This includes the new efficiency and real worker-pool suites, compiled
worker checks, and the remaining-plan and purchase-economics regressions.

Native Windows updater and launcher checks passed installation, invalid
archives, digest/version rejection, rollback, exact backup restoration,
user JSON/config preservation, stage tampering, hidden launch/reuse from
paths with spaces, successful restart and startup/legacy-worker recovery.
The anonymous public feed, complete ZIP download and every runtime file
checksum passed on Windows PowerShell 5.1.26100.33438.

Independent anonymous downloads verified the latest tag and source commit,
both asset sizes and GitHub SHA-256 digests, update-manifest hash, ZIP CRC,
all 169 runtime entries, every file checksum, version/repository
metadata, the current audit link and the compiled search refinements.

Published assets:

- Egg-Inc-Virtue-Farm-Optimizer.zip: 8,643,813 bytes; asset `652183110`; SHA-256
  `d2c0c553f1a952671ec97f7228931b8cd2488354e5cc981fef25aa99c63f0ef4`.
- update-manifest.json: 239 bytes; asset `652183109`; SHA-256
  `2b2074c4fe6166012b341d1eb1f191b8ecedf418847f6c45608089ff2560486a`.

The immutable published ZIP contains the reviewed prepublication audit.
This acceptance evidence was added afterward in source; published assets
remain unchanged. Install through Update App → Update & Restart, then
reoptimize from a checked farm to use the expanded search.

## v1.1.0 efficiency review

This release combines profiled calculation savings with bounded backtracking,
conservative production bounds, larger purchase families, nearby route edits,
finer departure timing and independent background search islands. Primary
research sources, adopted ideas and limitations are documented in
[SEARCH-RESEARCH.md](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/blob/main/SEARCH-RESEARCH.md).
The default allowance remains 90 seconds. Results remain fastest-found plans
within bounded search, with no global optimality guarantee.

Research-only aggregate multipliers are cached per prepared farm and every hit
validates the complete research vector. Cloned vectors inherit cache metadata
without sharing mutable research levels. Weak identity tables stay out of
structured-cloned contexts and are rebuilt lazily. Gear, capacity, events, calibration and
cash remain live. Pacific event generation directly tests actual weekly event
boundaries, including DST, instead of polling each quarter hour. Exact dense
multiple-choice DP replaces allocation maps without a convexity assumption.
Deeply frozen calendars use context-local identities in checkpoint keys;
mutable calendars retain complete value checks.

Safe pruning uses relaxed remaining egg demand and an optimistic free-upgrade
production ceiling. It preserves missing shift-count comparisons and never uses
the ordinary ranking heuristic as a proof. A bounded reserve revisits discarded
paid states. Purchase neighborhoods omit or move related families with dependency
closure; route edits reuse the completed paid prefix and depart it once rather
than restarting an already-completed opening recipe. Every competitive alternative
pays actual costs, interactions, sleep and mission time and independently replays.

The app uses two independent workers when the browser reports at least four
logical cores, otherwise one. The coordinator supports up to four, falls back
when worker creation fails, and merges only complete independently replayed
candidates for the same farm/rules. Workers use different portfolio priorities
and exchange verified winners under a common deadline. Cancellation retains
verified candidates; one sibling's failure does not erase another's complete plan.

### Efficiency measurements

Final paired measurements and model/regression results are recorded in
`VALIDATION.json`. Fixed-work farm stats were identical across 96 varied states;
three 250,000-call trials had median times of 530.8 ms for v1.0.10 and 130.3 ms
for the updated calculation (4.07× faster). This is a calculation benchmark,
not a claim that every complete search is 4.07× faster.

Complete searches compare the exact published v1.0.10 worker with the updated
standalone worker and worker pool. Inputs, advancing historical wall clocks,
width 16 and 90-second allowances match. Heavy trials run sequentially. Returned
plans independently replay, satisfy sleep/floors/targets and retain all 351
launches; supplied files remain unchanged. Two supplied farms do not establish
performance for all farms or hardware. Private inputs and full diagnostic plans
remain outside source.

| Saved-plan case | v1.0.10, one worker | v1.1.0, one worker | v1.1.0, two workers |
| --- | ---: | ---: | ---: |
| Original | 32.617 s | 20.854 s | 28.539 s |
| Followup continuation | 44.746 s | 21.135 s | 23.259 s |

The one-worker runs used about 36% and 53% less time; the default two-worker
runs used about 13% and 48% less time while examining 17,339 and 17,416 states
versus 6,963 and 7,072 in the published worker. Parallelism is additional search
diversity, not a guaranteed linear speedup over one updated worker. The fastest
six-shift ends remain `1803891264.1683307` and `1803913247.141548`, respectively.
The followup five-shift alternative improves from `1805767484.514458` to
`1805514722.2043824`, about 2.9255 days earlier. Every returned alternative in
these trials independently replayed and retained its required launches.

All 24 locally runnable workflow suites passed. The optional independent
Wasmegg audit passed 751 farm/intermediate/isolated states, 13,980 research prices,
42,056 tier checks and all catalog categories. A separate model audit covered
186,400 combined-discount prices, passive/DST integrations, fuel and Pacific
events. Existing floating/ceiling rounding limits remain: at most four chickens
of habitat rounding in sampled states, and at most one gem at integer research
prices in the combined-discount audit. The built app was also exercised in JSDOM
with two actual worker threads, including result merging, summary regeneration
and restored controls. Canvas rendering was outside that DOM integration check.
Local validation lacked PowerShell, so native updater/launcher checks ran in the
mandatory Windows workflow. Those gates passed as recorded above.

Initial route and refined-wait implementations repeatedly restarted opening
recipes, spending about 52 seconds in a pass without a useful improvement.
Profiling exposed opening-recipe work after the shared visit had already been
paid, or after a refined wait should have departed the current visit. Reusing and departing the completed prefix reduced an
isolated source comparison from about 6 seconds to 0.15 seconds. Failed tuning
attempts are excluded from the accepted efficiency measurements.

### Release gates

The public workflow adds search-efficiency and real worker-pool regression suites.
Local regression, independent reference-model, package and application integration
results are recorded in `VALIDATION.json`. Windows workflow, native updater/launcher
and anonymous public asset verification passed as recorded above.

The historical audits below preserve prior model limits and publication evidence.
Their measurements refer to those earlier versions, not to v1.1.0.

## Accepted v1.0.10 publication — October 17, 2026 (Pacific)

v1.0.10 is published and accepted. Windows run
[39076957465](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/39076957465)
passed all 24 workflow suites for source commit
`4086ecc3e25bfe73e1fa16073507ea5e37106465` (job `117525981811`). This includes the new search-refinement
suite and the compiled worker's package, adaptive-pass and saved-alternative paths.

Native Windows updater and launcher checks passed installation, invalid
archives, digest/version rejection, rollback, exact backup restoration,
user JSON/config preservation, stage tampering, hidden launch/reuse from
paths with spaces, successful restart and startup/legacy-worker recovery.
The anonymous public feed, complete ZIP download and every runtime file
checksum passed on Windows PowerShell 5.1.26100.33438.

Independent anonymous downloads verified the latest tag and source commit,
both asset sizes and GitHub SHA-256 digests, update-manifest hash, ZIP CRC,
all 169 runtime entries, every file checksum, version/repository
metadata, the current audit link and the compiled search refinements.

Published assets:

- Egg-Inc-Virtue-Farm-Optimizer.zip: 8,626,891 bytes; asset `651832128`; SHA-256
  `92144cd22588279fe37a52d8285380e65860db6adca51ad22ac4691b25c37c6f`.
- update-manifest.json: 240 bytes; asset `651832129`; SHA-256
  `72fb09fa581cc256a6798baf89d87d975587a78d3cc0c4bcb641896877d0cbeb`.

The immutable published ZIP contains the reviewed prepublication audit.
This acceptance evidence was added afterward in source; published assets
remain unchanged. Install through Update App → Update & Restart, then
reoptimize from a checked farm to use the expanded search.

## v1.0.10 search refinements — October 17, 2026

v1.0.10 implements isolated paid-prefix reuse, new paid purchase packages,
adaptive additional comparisons and compatible saved-alternative seeding.
The accepted v1.0.8 publication evidence is retained below as prior evidence.
The default search allowance remains 90 seconds. Results remain bounded
fastest-found plans rather than a proof of global optimality.

Prefix reuse is limited to the same starting state, prepared context and
execution mode, with a 768-entry cap and cloned states. Reuse stops before
delivery allocation, whose goals depend on later edits. All comparisons pay
actual prices and interaction time. Competitive candidates independently
replay their complete histories before entering the winners; losing paid
trials avoid a redundant second replay.

New packages compare up to four additional purchases, including complementary
laying/shipping capacity, tier fillers, habitats, engines and cars. Their
paid states continue both the saved purchase suffix and an earlier departure
variant. Already-paid template targets are skipped without granting unpaid
levels. Growth and completion share bounded slices and cancellation checks.
The adaptive queue explores distinct package, economics and timing passes,
prioritizes kinds that improve retained plans, and stops at exhaustion, the
job cap, cancellation or the remaining time limit.

Saved alternatives must replay their source plan, match the visited farm
prefix, and retime from the same checked farm and selected plan's original
shift allowance. Historical/current ship batches must match before reviewed
launch counts are remapped; remaining mission configurations must agree.
Unavailable or incompatible alternatives are skipped. A larger supplied
case exposed automatic equips generated from a replay context losing their
gear snapshots. Automatic equip actions now retain those snapshots even
when the inventory-search model is absent.

### Paired compiled-worker comparisons

The published v1.0.8 worker and updated standalone worker used the same
supplied inputs, historical start times, width 12 and 90-second budgets.
Heavy comparison jobs ran sequentially. Each result passed complete replay,
awake-interaction checks, target/floor checks and launch accounting. Uploaded
files were unchanged. These are single paired trials, not runtime guarantees.

| Case | Published / updated elapsed | Published / updated economics comparisons | New package comparisons | Fastest finish |
| --- | --- | --- | --- | --- |
| Original remaining plan | 32.5 s / 46.8 s | 280 / 964 | 128 | Unchanged: `1803891264.1683307` |
| Followup continuation | 33.0 s / 62.5 s | 325 / 1,105 | 632 | Unchanged: `1803913247.141548` |

Both fastest results retain six shifts, 40 TE on each Virtue and 351 launches.
The updated search spends more of the allowed time comparing alternatives.
In the followup case its five-shift alternative also improved from
`1813018291.392286` to `1805767484.5196815`, a gain of 83.9214 days. That
alternative independently replays to 200 TE, satisfies the configured floors
and retains all 351 launches; the six-shift choice still finishes earlier.

A separate same-work prefix comparison ran 53 proposals with retained and
rescheduled calendar waits. All 106 outcomes, including 82 completed paid
comparisons, matched exactly with reuse enabled or disabled. Reuse recorded
1,960 hits; measured execution was 1,142 ms without reuse and 1,043 ms with
reuse. This small timing sample is illustrative; exact outcome equivalence
and avoiding repeated work are the stronger evidence.

All 19 local regression suites passed, including the compiled standalone
worker, search refinements, purchase economics, launch accounting and sleep.
Local results are recorded in `VALIDATION.json`. The Windows workflow,
native updater/launcher and anonymous public-release gates passed as
recorded in the acceptance evidence above.

### Unpublished v1.0.9 preparation attempt

The first Windows run, `39076593602`, passed the solver/model suites and the
new source search-refinement suite, then stopped on the built worker's saved-
alternative count assertion. Its 800 ms search allowed only a 100 ms shared
original/alternative precheck, making the integration assertion timing-sensitive
on that runner. No v1.0.9 release or assets were published. The worker fixture
now allows a 10-second search (1-second precheck), leaves adaptive coverage
to its dedicated fixture, and prints full assertion stacks.
The production search budget and algorithms are unchanged by this test fix.
A fresh version reruns the complete automatic Windows release path.

## Accepted v1.0.8 publication — October 17, 2026 (Pacific)

v1.0.8 is published and accepted. Windows run
[39067254199](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/39067254199)
passed all 23 workflow suites for source commit
`4ffaea728b0e52b0da25b5d9a6ac5c3086f86754` (job `117497371965`).
This includes the new dependency-aware purchase-economics tests and the
compiled worker's capacity-versus-income and missed-sale comparisons.

Native Windows tests passed installation, seven bad archive cases, digest
rejection, rollback, exact backup restoration, user JSON/config preservation,
stage tampering, hidden CMD launch/reuse from paths with spaces, successful
restart, startup-failure recovery and legacy-worker recovery. The anonymous
public update feed, complete ZIP download and all app-file checksums passed
on Windows PowerShell 5.1.26100.33438.

Independent anonymous downloads verified the latest tag and source commit,
both asset sizes and GitHub SHA-256 digests, update-manifest hash, ZIP CRC,
all 169 runtime entries and every file checksum, version/repository metadata,
current audit links and the compiled purchase-economics implementation.

Published assets:

- ZIP: 8,616,036 bytes; asset `651538972`; SHA-256
  `0d6f6883617eeea26f951c00a4a17f23f2ec1a8045254f69a7c82ca06b9ca5f3`.
- Update manifest: 239 bytes; asset `651538977`; SHA-256
  `118b200d5189c38a3d092acec8c5bf8b81e75eada20b77c7148fe7c99ed9f653`.

The immutable published ZIP contains the reviewed prepublication audit.
This acceptance evidence was added afterward in source; published assets
remain unchanged. Install through Update App → Update & Restart, then
reoptimize the remaining plan to compare purchases from the checked farm.

## v1.0.8 purchase-economics comparison — October 17, 2026

The supplied applied remaining plan correctly used the current full price for
Atomic Purification 27 → 28, but retained an economically inferior purchase.
The value multiplier changes from 3.7× to 3.8×: a 2.7027027% earnings gain,
with no delivery-rate gain. It costs 10.2784145625 Td and initially adds
19.7648530925 D/hour, a simple payback of 21.668 normal-earnings days.

A paired replay held every other purchase and time in the saved Curiosity
visit fixed. Including weekly earnings events, subsequent paid research,
sleep, silo coverage, and the fuel diversion, that level adds only
7.93536296196 Td before leaving Curiosity. Its cost exceeds that income by
2.34305160054 Td. Both paired runs deliver the same eggs through departure.

Complete paid continuations reproduce the saved finish exactly. Omitting
that level finishes 4h 33m 51s earlier. Deferring it to October 23, 2026 at
09:00 PDT costs 3.08352436875 Td and finishes 6h 6m 28s earlier: March 1,
2027 at 00:54:24 PST instead of 07:00:52 PST. Both retain 200 TE, with 40 TE
on each Virtue, six further shifts, and all 351 launches. Strict replay and
sleep-interaction checks pass; the uploaded inputs remain unchanged.

### Capacity-ordering findings and broader fix

The route scorer gives projected capacity, tier unlocks and fleet slots value
before they produce current earnings. These projections rank proposals only;
they never supply free capacity. The earnings-first reorder pass improves
some orders but retains every selected level and preserves the original order
among upgrades with any immediate income gain. Neither mechanism alone
compares whether a whole purchase chain is worth its cost and timing.

The new purchase-economics pass covers every common-research category plus
habitats, vehicles, train cars and silos. It proposes omitting a purchase and
its dependent levels, moving it behind productive purchases in the same
visit, waiting for the next research sale, or moving it to the next eligible
Virtue visit. It also compares omitting a visit's combined capacity research.
Complementary laying/shipping capacity, tier counts, fleet slots, engines,
car levels and train-length research are checked together. A deferral cannot
move a prerequisite beyond a purchase that needs it; an omission removes
invalid dependents rather than granting free levels or cheaper car levels.

Every accepted comparison starts from the actual farm, recomputes funding,
pays current prices and interaction overhead, and completes the TE route.
Delivery stops before deferred purchases retain their actual egg goals, so
the delivery-tail allocator cannot silently skip those purchases. Calendar
waits are compared both retained and rescheduled: discarding an event wait
can worsen offline funding and sleep timing. Both variants require strict
paid replay, with the existing target, ship, inventory, sleep and shift rules.

The baseline remains eligible. Acceptance uses full completion time and the
existing tie preferences, not a fixed payback threshold or speculative
capacity. Better plans may therefore buy idle capacity early when it enables
a useful later investment. The pass shares the existing refinement budget:
up to 16 purchase anchors, 72 edits and two calendar variants per pass, with
up to three passes to combine improvements. This is a broader bounded search,
not exhaustive enumeration of every purchase combination or a global optimum.

### Verification

With the normal 90-second budget and the original supplied saved plan, the
broader solver completed in 26.352 seconds, performed 407 verified purchase
economics comparisons (371 involving research), retained both original shift
candidates, and recovered the same six-hour improvement described above.
A separate run seeded with the already-improved plan retained its finish.

A controlled unused-train-capacity case finishes 21.3627 seconds earlier by
buying income first, with identical selected research and goals. Six legal
orders are independently enumerated; the comparison retains a plan at least
as fast as their best. Omitting a productive habitat-capacity research level
instead adds 391,580.2313 seconds, demonstrating why capacity must not be
blanket-deferred or removed. Regressions cover all physical upgrade types,
research/engine/car/fleet dependencies, later eligible visits, delivery stops
before deferred purchases, actual prices, cancellation and immutable inputs.

The app and standalone worker build passed, along with 14 focused suites:
purchase economics, earnings-first research, worker, investment search,
route solver, search quality, research breakpoints, earnings incumbents,
research-sale plans, continuation, sleep search quality, sleep schedule,
silo comfort and purchase-decision explanations. The compiled worker checks
both missed-sale income research and unused capacity. Exhaustive research
and sleep-quality fixtures retain zero completion-time gaps.

Release-intent and staged-publishing suites also passed. Local runtime
packaging verified 169 files; the curated source package contains 291 files.

The native Windows and public-feed gates subsequently passed; see the accepted
v1.0.8 publication above. The v1.0.7 evidence below describes the previous release.

## Accepted v1.0.7 publication — October 16, 2026 (Pacific)

v1.0.7 is published and accepted. Windows run
[38974262303](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38974262303)
passed for source commit `51d84b872bacf7ca84373bb6a3d7a573f400a6dd`.
All 22 workflow suites passed, including calendar/wake timestamp boundaries,
resource and launch guards, completed funding batches, retained original-route
candidates, and the standalone generated worker. Local browser checks passed
actual account refresh, checklist evidence, upcoming purchase grouping,
unchanged manual confirmations and schedules, save/load, and update recovery.
The supplied saved plan and current farm also passed the actual browser flow.
The extracted curated source installed, rebuilt, and passed progress-model,
release-intent, and staged-publishing checks.

Native Windows checks verified installation, seven invalid archive cases,
digest rejection, rollback, exact backup restoration, retained user JSON/config,
stage tampering, hidden CMD launch/reuse from paths with spaces, successful
restart, startup-failure recovery, and legacy-worker recovery. The anonymous
public feed, full ZIP download, and every app-file checksum passed on Windows
PowerShell 5.1.26100.33438.

Independent anonymous public downloads verified the latest tag and reviewed
source commit, both complete assets and GitHub digests, manifest size/hash,
ZIP CRC, all 169 runtime entries and every file checksum, version/repository
metadata, current audit links, and the compiled progress checklist fix.

The accepted release is
[v1.0.7](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.7).
This acceptance record is a source-only follow-up. Published assets retain
the prepublication audit snapshot.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 648783284 | 8,609,197 | `a3740a0aeec990eff36f60c0c8a06e8af0f73865f7589700bb452bf412d185cb` |
| update-manifest.json | 648783282 | 239 | `8d2ffc50bad2649bd33f463776b747ce296b8db5062f507b505c5a9fde209f56` |

## v1.0.7 release preparation — October 16, 2026

A checked backup from October 16 at 15:01:53 PDT still displayed the Friday
research-sale wait ending at 09:00 PDT. That wait was treated as a manual step,
even though the calendar condition had ended and its following purchases were
already present. Calendar-event and wake-time waits now receive an elapsed
state when the checked snapshot reaches their end. Elapsed waits cannot block
Next Planned Step or reappear as a break in its purchase batch. The checklist
labels the backup evidence instead of asking for a second manual confirmation.

The backup clock is required; advancing the PC clock alone does not complete
a wait. Resource accumulation, delivered-egg milestones, fuel transfers, and
launch batches retain their observed/manual checks. An unpurchased upgrade
still blocks progress even when a later calendar wait has ended. Funding waits
can be superseded by observed following purchases across an elapsed wake-time
wait. Manual confirmations, plan actions, schedules, and the solver's search
rules remain unchanged. Earlier timestamp, ascension, visit, and required-upgrade
guards remain active.

The supplied farm matches its saved plan and now selects the funding break
ending at 15:53:33 PDT followed by Atomic Purification 26 → 27. Its 28 present
purchases are retained. The saved plan replays successfully and both input files
remain unchanged. The original finish is retained; this change updates progress
display rather than reoptimizing the saved schedule.

Native v1.0.7 Windows checks and independent public-download acceptance remain
release gates until recorded as accepted. The v1.0.6 evidence below describes
the previously published assets.

## Completed local v1.0.7 checks

Dependency installation and the versioned app/worker build passed. All seven
local suites passed: progress model, continuation model, standalone generated
worker, progress browser, continuation browser, release intent, and safe staged
publishing. Regressions cover backup times immediately before, exactly at, and
after calendar/wake boundaries; undated and future backups; unpurchased upgrades;
resource and launch guards; funding/sleep boundaries; and removal of elapsed
waits from the upcoming purchase batch. The browser checks real protobuf account
refresh, unchanged manual confirmations and schedules, save/load, and update
recovery. The extracted curated source independently installed, rebuilt, and
passed progress-model, release-intent, and staged-publishing checks.

The supplied 21 MB saved plan loaded and replayed in the actual browser app.
Its restored progress and a separate check with the supplied current farm both
selected Atomic Purification 26 → 27 after the 15:53 PDT funding break. The old
sale wait is labeled ended by snapshot time in the checklist. The replayed
schedule and both uploaded input files remained unchanged; no browser errors
were observed.

The runtime ZIP contains 169 entries and the curated source contains 289 files,
including all 22 workflow suites and their local dependencies. Both ZIP CRCs,
every runtime file checksum, archive/manifest size and hash, version/repository
metadata, current audit links, and the compiled progress fix passed. Generated
bundles and private input directories are excluded from source; private input
directories are excluded from runtime.

## Accepted v1.0.6 publication — October 15, 2026 (Pacific)

v1.0.6 is published and accepted. Windows run
[38793700773](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38793700773)
passed for source commit `09371e51fa07c8d90d1540dfa5d0b331d8e2e9c2`.
All 22 workflow suites passed, including source-backup timestamp boundaries,
retained original-route candidates, repeated reoptimization, and the standalone
generated worker. Local browser checks also passed immediate next-step display,
actual protobuf/account refresh with the same and later pre-start backups,
older-backup rejection, save/load, reset/undo, update recovery, and return to
the previous plan. The extracted curated source installed, rebuilt, and passed
progress-model, release-intent, and staged-publishing checks.

Native Windows checks verified installation, seven invalid archive cases,
digest rejection, rollback, exact backup restoration, retained user JSON/config,
stage tampering, hidden CMD launch/reuse from paths with spaces, successful
restart, startup-failure recovery, and legacy-worker recovery. The anonymous
public feed, full ZIP download, and every app-file checksum passed on Windows
PowerShell 5.1.26100.33438.

Independent anonymous public downloads verified the latest tag and reviewed
source commit, both complete assets and GitHub digests, manifest size/hash,
ZIP CRC, all 169 runtime entries and every file checksum, version/repository
metadata, current audit links, the source-backup check in both compiled bundles,
and the immediate next-step behavior in the app bundle.

The accepted release is
[v1.0.6](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.6).
This acceptance record is a source-only follow-up. Published assets retain
the prepublication audit snapshot.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 644928769 | 8,607,345 | `480ed069336816134ea700cc657faffa4a57ea5f29e9f1e2d1a4239f88d7ade8` |
| update-manifest.json | 644928767 | 239 | `3fd3b7ccae0cfedef7a8115ecf0ab8eb10e8f2122b8cfbf8be4d86b4cae87b90` |

## v1.0.6 release preparation — October 15, 2026

v1.0.6 fixes a freshness check that compared account backup time
against the reoptimized schedule's later PC start. A remaining plan now accepts
its starting backup or a newer backup. The lower bound is used only when valid
continuation metadata matches the saved starting farm's import timestamp and
does not exceed the plan start. Other plans retain their plan-start check;
unbound/invalid metadata cannot relax it. Future-time, ascension, lifetime
shift, Virtue, delivered-egg, and required-upgrade checks remain active, and an
account refresh older than the last successful check still leaves it intact.

Applying a remaining plan now retains the actual checked farm as progress on
the new timeline, with a new plan key and empty manual confirmations/launch
counts. Next Planned Step appears immediately. Remaining-plan headings and
dates remain labeled as remaining-plan output after subsequent refreshes.

The app/worker build and five focused suites passed: progress model,
continuation model, generated worker, progress browser, and continuation
browser. The latter uses the actual protobuf/account path to apply a plan,
refresh with the same pre-start backup, reject an older backup, and accept a
newer backup still before the schedule start. It also checks apply/save/load,
update recovery, and return-to-previous behavior. Repeated reoptimization with
the same backup passed through the generated worker. The supplied farm case
now matches, produces a next batch, rejects an older backup, and retains replay
validity without changing either input file. Native v1.0.6 Windows checks and
independent public-download acceptance remain release gates until recorded as
accepted. The v1.0.5 evidence below describes the previously published assets.

## Completed local v1.0.6 checks

Dependency installation and the versioned app/worker build passed. All seven
local suites passed: progress model, continuation model, standalone generated
worker, progress browser, continuation browser, release intent, and safe staged
publishing. The extracted curated source independently installed, rebuilt,
and passed progress-model, release-intent, and staged-publishing checks.

The runtime ZIP contains 169 entries and the curated source contains 289 files,
including all 22 workflow suites and their local dependencies. Both ZIP CRCs,
every runtime file checksum, archive/manifest size and hash, version/repository
metadata, current audit links, and the compiled timestamp/apply fixes passed.
Generated bundles and private input directories are excluded from source;
private input directories are excluded from runtime.

## Accepted v1.0.5 publication — October 15, 2026 (Pacific)

v1.0.5 is published and accepted. Windows run
[38789659130](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38789659130)
passed for source commit `8cf036a6d66742b9c4bc9d839f3cf3a06c77fdc7`.
All 22 workflow suites passed, including recorded automatic gear restoration,
current artifact/stone ownership, retained original-route candidates, and the
standalone generated worker. Local browser checks also passed the full
comparison/apply/save/load/return flow. The extracted curated source installed,
rebuilt, and passed continuation, release-intent, and staged-publishing checks.

Native Windows checks verified installation, seven invalid archive cases,
digest rejection, rollback, exact backup restoration, retained user JSON/config,
stage tampering, hidden CMD launch/reuse from paths with spaces, successful
restart, startup-failure recovery, and legacy-worker recovery. The anonymous
public feed, full ZIP download, and every app-file checksum passed on Windows
PowerShell 5.1.26100.33438.

Independent anonymous public downloads verified the latest tag and reviewed
source commit, both complete assets and GitHub digests, manifest size/hash,
ZIP CRC, all 169 runtime entries and every file checksum, version/repository
metadata, current audit links, and the compiled artifact recovery in both app
and worker bundles. The supplied farm reproduction and its March 1 retained
finish are documented in the preparation snapshot below.

The accepted release is
[v1.0.5](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.5).
This acceptance record is a source-only follow-up. Published assets retain
the prepublication audit snapshot.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 644853558 | 8,605,816 | `bc8dd7daa9c20277e1ab332921e7e29cbbb7761d49fcd8d64d71abf5cf77929a` |
| update-manifest.json | 644853560 | 239 | `c8e22e89517c1e24a82d1c970963642ca04a5a3e6225a5607cf749bcfa8b17ee` |

## v1.0.5 release preparation — October 15, 2026

Continuation previously rejected saved automatic artifact names that were not
yet registered in the fresh search context, even when the snapshot owned all
the recorded gear. That prevented original-route replay and removed its
candidate from the search. The fix restores recorded set contents on
demand, validates the generated content key and permit, and checks artifact
quantities and the complete owned stone pool. Manual farms may recover an
equivalent configured loadout despite slot/socket ordering. Missing gear or
insufficient stones still prevent that original route from being used.

The supplied saved plan and all alternatives replayed. At the reported
October 15, 2026 11:37:29 PDT remaining-plan start, the fixed original route
finishes March 1, 2027 at 00:30:23 PST, versus the original saved 07:00:59 PST
finish. A search with the normal 90-second budget retained that baseline and
returned the same finish, reaching 200 TE with six further shifts and all
351 outstanding launches. Independent replay and sleep-interaction checks
passed, and both input files remained unchanged. This is a feasible retained
candidate, not proof of the globally fastest remaining plan.

The app/worker build, continuation model suite, generated standalone worker,
and continuation browser flows passed. Regressions cover automatic generated
names, fixed and automatic routing, retained candidates, inventory and stone
shortages, socketed/loose stone equivalence, manual loadout equivalence,
tampered set content, immutable inputs, and apply/save/load/return behavior.
Native v1.0.5 Windows checks and independent public-download acceptance remain
release gates until recorded as accepted. The v1.0.4 evidence below describes
the previously published assets.

## Completed local v1.0.5 checks

Dependency installation and the versioned app/worker build passed. All five
local release suites passed: continuation model, standalone generated worker,
continuation browser, release intent, and safe staged publishing. The supplied
case's normal-budget search and independent replay are recorded above. Package
acceptance is recorded in VALIDATION.json as it completes.

## Inherited v1.0.4 publication evidence

## Accepted v1.0.4 publication — October 15, 2026 (Pacific)

v1.0.4 is published and accepted. Windows run
[38785990902](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38785990902)
passed for source commit `e351bf3f24e2f03d77b81ff8a7f9d47c9732e519`.
All 22 workflow suites passed. Native checks verified installation, seven
invalid archives, digest rejection, rollback, exact backup restoration,
retained user JSON/config, stage tampering, hidden CMD launch/reuse from paths
with spaces, successful restart, startup-failure recovery, and legacy-worker
recovery. The anonymous public update feed, full ZIP download, and every app
file checksum passed on Windows PowerShell 5.1.26100.33438.

Local browser regressions verified exact restoration of a complete plan over
6 MiB with full localStorage, consumed handoff cleanup, legacy handoffs,
fallback storage, and blocking installation after unavailable storage or an
aborted write transaction. Mouse and keyboard navigation retained independent
tab positions and expanded shifts at 1,000 and 1,440 pixels. Progress and
remaining-plan save/load/reset/update recovery passed. The extracted curated
source independently installed, rebuilt, and passed release intent, staged
publishing, and progress-model checks.

Independent anonymous public downloads verified the latest tag and reviewed
source commit, both complete assets and GitHub digests, manifest size/hash,
ZIP CRC, all 169 runtime entries and every file checksum, version/repository
metadata, current audit links, and the compiled recovery/scroll fixes.

The accepted release is
[v1.0.4](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.4).
This acceptance record is a source-only follow-up. Published assets retain
the prepublication audit snapshot.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 644787104 | 8,603,891 | `ea64b3671ef7f0e181fe01f576df010793fda662393f65d749257c8b9099c9b1` |
| update-manifest.json | 644787111 | 239 | `7cf7db8f2372ce291a4ef0811b247a4d317c7de3b90136ccd71855b1ec92d03b` |

## v1.0.4 release preparation — October 15, 2026

v1.0.4 contains the updater and navigation fixes described below.
Update recovery stores the complete sanitized handoff in IndexedDB and waits
for its transaction to commit before submitting installation. Earlier
localStorage handoffs remain readable, and smaller sessions can fall back to
localStorage when IndexedDB is unavailable. Restoration chooses the newest
valid handoff and consumes it after successful recovery. Failed preservation
blocks installation. No browser data is cleared to make room for an update.

Sidebar navigation remembers separate scroll positions without rebuilding the
timeline or closing expanded shifts. Mouse and keyboard navigation retain the
position; loading a plan or intentionally navigating to a new result starts at
the top. Model, search, and saved-plan calculations are unchanged.

Local browser checks cover a complete plan exceeding 6 MiB, the real
localStorage quota with filled storage, exact post-restart config/result
equality, consumed-session cleanup, legacy handoffs, fallback storage,
unavailable storage, aborted storage transactions, rollback/error display,
and independent tab positions at
1,000 and 1,440 pixels. Current release acceptance below describes the
published v1.0.3 assets. Native v1.0.4 Windows checks and independent public
download verification remain release gates until recorded as accepted.

## Completed local v1.0.4 release checks

Dependency installation and the versioned app/worker build passed. The six
focused model/browser suites from implementation passed, and the v1.0.4 build
passed release intent, safe staged publishing, standalone worker, oversized
update recovery, and mouse/keyboard progress/navigation checks.

Both packages passed CRC, runtime manifest size/hash, every runtime-file
checksum, version/repository metadata, audit links, and private-input
exclusions. The runtime has 169 entries. The curated source has 289 entries,
including all 22 Windows workflow suites and their source dependencies.

## Inherited v1.0.3 publication evidence

## Accepted v1.0.3 publication — October 15, 2026 (Pacific)

v1.0.3 is published and accepted. Windows run
[38782938097](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38782938097)
passed for source commit `daad592b0b4ff9a847229588093c6bb747a1fe5f`.
All 22 workflow suites passed, including remaining missions/refill handling,
purchase-batch progress, guide ordering, and the standalone generated worker.

Native updater checks passed verified installation, seven invalid archive
cases, digest rejection, rollback, exact backup restoration, retained user
JSON/config, and stage-tamper rejection. Native launcher checks passed hidden
CMD launch/reuse from paths with spaces, successful restart, startup-failure
recovery, and legacy-worker recovery. The anonymous public feed, complete ZIP
download, and every app-file checksum passed on Windows PowerShell
5.1.26100.33438.

Independent anonymous downloads verified the latest stable tag and reviewed
source commit, both complete assets and GitHub digests, manifest size/hash,
ZIP CRC, all 169 runtime entries and every file checksum, version/repository
metadata, current audit links, the upcoming purchase-batch UI, large break
duration styling, and compiled remaining-mission handling.

The accepted release is
[v1.0.3](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.3).
This record is a source-only verification follow-up. Published assets retain
the prepublication audit snapshot.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 644730254 | 8,601,898 | `6c2e4e545773d73c7b7412b805f61e79b6c0851bf3a4aef70743b779f98ed092` |
| update-manifest.json | 644730256 | 239 | `47418839ceb79fe6c8e202ebeeea34f9ee9ec374b820e65edbdf36346a216875` |

## Release preparation snapshot

v1.0.3 contains the reviewed remaining-plan routing fix and purchase-batch
presentation changes. This section records the local preparation snapshot before the accepted
publication described above.

Automatic remaining searches consider the saved remaining route before fresh
ascension presets. Outstanding launch batches can be consolidated on the one
remaining Humility visit only when mission-group limits and tank requirements
fit. Mission order, outstanding counts, active flights, fuel costs, and the
remaining shift ceiling are retained. If completed H1 leaves H2 fuel to collect,
the empty current visit remains explicit so launches follow the required refill.
Fixed routes that cannot accommodate their outstanding launches fail with an
explanation. A bounded automatic miss reports remaining-search guidance.

Next Planned Step shows the complete upcoming purchase batch, omits completed
upgrades, and adjusts partial research/car level ranges from the snapshot. Its
funding break has a large duration. An observed completed batch supersedes its
funding wait; observing only part of a batch does not. Manual wait confirmation
and original-plan dates remain available. New views are reconstructed from the
saved plan and checked farm rather than trusted cached presentation data.

Quick Guide and the PDF place funding waits before their dependent purchases.
Trailing delivery waits remain standalone and fuel transfers remain after their
setup action. The regrouping retains every raw action and every wait/fuel block
with its original duration. Ship launch schedules, target TE, sleep, and model
rates are unchanged by the presentation work.

The implementation review passed model, route, standalone-worker, save/load,
update-recovery, and browser checks. Desktop review covered 1,000–1,920 pixels.
The saved 12-shift plan replays with the same 137d 23h 0m 51s finish, 200 TE target,
and 18 launches; all 94 visible wait/fuel blocks and their total duration are
preserved. The full 64-page PDF passed page-bound checks; rendered walkthrough
pages and the new next-batch panel passed visual review. The synthetic export
also confirms an 11m 31s funding break appears before its purchase batch.

Current versioned build, package and release results are recorded in
VALIDATION.json as they complete. The Windows workflow includes the new
quick-guide-order suite. The updated bedtime test uses the next UTC bedtime
rather than a fixed historical date.

## Completed local v1.0.3 release checks

Dependency installation and the versioned app/worker build passed. All 15 local
release checks passed: release intent and safe preparation; progress and
continuation models; quick-guide order; shift rates and vehicle presentation;
purchase explanations; route solver and standalone worker; progress,
continuation, timeline, research-artwork, and purchase-explanation browser flows.

Both packages passed ZIP CRC, manifest size/hash, every runtime file checksum,
metadata, current audit links, and private-input exclusions. The runtime has
169 entries. The curated source has 288 entries, including all 22 workflow
suites and their source dependencies. An extracted source install/build passed,
as did its progress, continuation, guide-order, and release-intent tests.
Native Windows and independent public-download acceptance are recorded above.

## Inherited accepted release evidence

The following v1.0.2 and earlier results are historical baseline evidence.
Current v1.0.3 publication and verification are recorded separately above.

# Egg Inc. Virtue Farm Optimizer v1.0.2 — Release Audit

## Accepted v1.0.2 publication — October 9, 2026 (Pacific)

v1.0.2 is published and accepted. Windows run
[38023306042](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38023306042)
passed for source commit `85e1fa0c508ccc9d435538712dbf185160ba5486`.
All 21 workflow suites passed, including the new progress, continuation, and
purchase-explanation checks and the standalone generated worker.

Native updater checks passed verified installation, invalid-archive and digest
rejection, rollback, exact backup restoration, retained user JSON/config, and
stage-tamper rejection. Native launcher checks passed hidden CMD launch/reuse
from paths with spaces, successful restart, startup-failure recovery, and
legacy-worker recovery. The anonymous update feed, complete download, and every
file checksum passed on Windows PowerShell 5.1.26100.33438.

Independent anonymous verification confirmed v1.0.2 as the latest stable
release, downloaded both complete assets, and verified GitHub digests, manifest
size/hash, ZIP CRC, all 169 runtime entries, every file checksum, current audit
links, repository/version metadata, and all three new feature entry points.

The accepted release is
[v1.0.2](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.2).
This verification record is a source-only follow-up. Published assets retain
the prepublication audit snapshot.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 626972021 | 8,597,823 | `710f77ffb3555ac240abb8efa0fc94ce73af07e37107e20dcf63506a3270c515` |
| update-manifest.json | 626972025 | 239 | `ba38e59994aa19567f460c7a1f03d7eef39d601cb48f0c97f4a8b690f4bfb1fe` |

## Release preparation snapshot

v1.0.2 includes saved-plan progress tracking, remaining-plan reoptimization,
and research purchase explanations. This section records the local preparation
snapshot before the accepted publication described above.

Progress comparison identifies repeated visits by lifetime shift count and
checks research and permanent upgrades from a farm snapshot. Waits, fuel
transfers, and launch batches require explicit confirmation. Original plan
inputs, actions, and dates remain available. Confirmations are scoped to the
selected plan and survive save/load, reset/undo, and update recovery.

Remaining-plan search uses the checked farm's upgrades, gems, stored fuel,
active flights, and remaining shift allowance. It preserves the target, per-egg
floors, sleep, and display timezone. It starts at the current PC time without
inventing production since the backup. Launched mission counts must be
confirmed. The original remaining route is paid and retimed from the same
snapshot and retained as a candidate when feasible. Proposals require explicit
application; previous plans and comparisons remain restorable.

Remaining plans may buy research on their final Curiosity visit, including when
no shifts remain. That visit uses bounded paid comparisons rather than a build
recipe which assumes later physical upgrade visits. Fresh full-farm planning
retains its final-C delivery convention and normal 90-second search budget.
The standalone worker exercises continuation replay and stop/retain behavior.

Research explanations are reconstructed from each purchase's contemporary farm,
gear, and research levels. They identify immediate earnings gains, actual tier
unlocks, contributions toward tiers used later, and delayed physical capacity.
Grouped ranges retain multiple roles and distinguish partially useful levels.
Historical before/after snapshots and saved explanation text cannot fabricate
these effects. Summary exposes research hidden by Max Tiers; Quick Guide,
Full Breakdown, and native icon tooltips show the same effects. Explanation
rendering does not change replay actions or the supplied 12-shift finish.

The previous implementation checks passed the new model and browser suites,
saved-plan roundtrips, progress/update recovery, partial ship launches,
zero-shift continuations, and desktop layouts at 1,000–1,920 pixels. v1.0.2
release checks and package results are recorded in VALIDATION.json as they
complete. Native Windows launcher/updater and anonymous feed verification run
in the release workflow; acceptance is recorded only after those gates pass.

## Completed local v1.0.2 release checks

Dependency installation and the versioned app/worker build passed. Ten local
suites passed: release intent, safe publish preparation, progress comparison,
remaining-plan model, purchase explanations, paired shift rates, standalone
worker, and all three feature browser suites. Browser checks include save/load,
reset/undo, update recovery, partial launches, repeated visits, and 1,000–1,920
pixel desktop layouts. The supplied 12-shift plan replays with its same
137d 23h 0m 51s finish, 200 TE target, and 18 launches.

The runtime archive has 169 entries. ZIP CRC, the archive manifest and every
runtime checksum passed. The curated source archive has 287 entries, includes
all 21 release-workflow suites and their source dependencies, and excludes
private input directories. Version metadata and current audit links match
v1.0.2. The extracted source archive installs, rebuilds, and passes progress,
continuation, purchase-explanation, and release-intent checks.

## Inherited accepted release evidence

The following v1.0.1 and earlier results are historical baseline evidence.
Current v1.0.2 publication and verification are recorded separately above.

# Egg Inc. Virtue Farm Optimizer v1.0.1 — Release Audit

## Accepted release status

v1.0.1 is published and accepted. It adds native desktop hover tooltips to the shared research icon renderer.
Each tooltip shows the research name and its game effect description. This
covers Summary, Quick Guide, Full Breakdown, and research input pages. Existing
text labels and decorative artwork accessibility are retained. The solver,
research data, saved-plan schema, purchase grouping, and timing are unchanged.

`npm ci` and the v1.0.1 app/worker build passed. The research-artwork browser
suite passed across replayed Summary, Quick Guide, and Full Breakdown views,
research inputs, saved-farm roundtrips, desktop layouts, offline use, and missing
artwork. The built app contains the research name/effect tooltip assignment.
Release-state and publish-preparation guards also passed.
The Windows release workflow passed its solver, updater, launcher, packaging,
and anonymous public-feed checks. Independent anonymous downloads also passed
archive and file checksum verification.
The current release status is recorded in `VALIDATION.json`.

The runtime ZIP contains 169 files; ZIP CRC, the archive manifest size/digest,
and every runtime file checksum passed. The curated source ZIP contains 281
files, including all 18 suites used by its release workflow and their
dependencies. Version metadata, current audit links, and the compiled tooltip
assignment match v1.0.1. Private review inputs are excluded from both archives.

## Accepted v1.0.1 publication — October 9, 2026

Windows run [38013764440](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/38013764440)
completed successfully for source commit `2659764b4542ef3766a69a4056c56f7e4c9d2015`.
All 18 workflow suites passed, including solver/replay, research ordering, sleep,
Pacific events, and the generated worker. Native updater checks passed verified
installation, seven invalid archive cases, digest rejection, rollback, exact
backup restoration, user JSON/config preservation, and stage-tamper rejection.
Native launcher checks passed hidden CMD launch/reuse from paths with spaces,
successful restart, startup-failure recovery, and legacy-worker recovery.

The anonymous update feed, complete ZIP download, and every app-file checksum
passed on Windows PowerShell 5.1.26100.33438. Independent anonymous verification
confirmed v1.0.1 as the latest stable release, downloaded both complete assets,
and verified GitHub digests, manifest size/hash, ZIP CRC, all 169 runtime entries,
every file checksum, current audit links, repository/version metadata, and the
compiled research-name/effect tooltip assignment.

The accepted release is [v1.0.1](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.1).
This is a source-only verification follow-up. Published assets retain the
pre-publication audit snapshot; no existing assets were replaced.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 626692114 | 8,577,808 | `690f1db5be6f8749fba1e28b40a50acccb267707dc3682ab8adc0b39d8359b30` |
| update-manifest.json | 626692111 | 239 | `1da33fad6510fe1b13b00ad52dbaf9b36e534ca9b35ebb31bfff19c68f4a89b9` |

## Inherited v1.0.0 release evidence

The following checks and publication results belong to v1.0.0. They are retained
as baseline evidence. v1.0.1 acceptance is recorded separately above.
The solver and model are unchanged by v1.0.1.

## Accepted release status

v1.0.0 is published and accepted. The source, model, and browser checks listed
below passed locally. The Windows publication workflow passed the native
launcher/updater checks and anonymous public-feed verification. Independent
anonymous downloads also passed archive and file checksum verification.
The accepted publication evidence is recorded below.

## Changes since the accepted v0.9.14 release

The solver compares earnings-first orders on research-capable Curiosity visits,
including individual visits and opening combinations. It evaluates actual
income with the current habitats, vehicles, research, and gear after every
level. Inactive capacity can wait until departure. Selected lower-tier levels
remain eligible to unlock earnings, and complementary production upgrades can
be bought when their chain raises income. All selected levels are paid; projected
research is used only to rank proposals.

Paid offline-batch comparisons are retained. Reexecution preserves selected sale
prices, interaction time, sleep, research deadlines, tank/fuel constraints, and
missions. Complete continuations are strictly replayed before acceptance. The
previous feasible plan remains available when a reorder is infeasible or slower.
The normal search budget remains 90 seconds; proposal comparisons share it.

The final review tightened research-range validation to reject gaps, overlapping
ranges, invalid timestamps, and non-integer/non-finite starting levels. Grouped
levels without an explicit starting level map every purchased level correctly.
The bundled Wasmegg comparison and migration guidance now describe current
behavior. Builds synchronize audit links in the app and comparison document.
The developer source ZIP includes every public test invoked by its release
workflow, plus the PowerShell updater test dependency.

Four browser tests still described earlier UI behavior. They now target the
labeled app navigation, preserve separate purchases with interaction time in
Full Breakdown, focus an existing calibration field, and check the compact
timezone menu. Quick Guide research-range grouping remains verified. An earlier
stale search-budget expectation was also updated to the existing 90 seconds.

## Local verification — October 9, 2026

`npm ci` and the v1.0.0 app/worker build passed. All 37 available Node/browser
suites passed, covering paid route/research/physical investment decisions,
incumbent retention and earnings adaptation, research breakpoints, sleep and
DST, silo coverage, Pacific events, worker operation, account/backup import,
save/load/reset, selected saved-plan alternatives, corrupt-file rejection,
artwork/equipment controls, desktop layouts, timeline rates, and PDF generation.
Release-state tests explicitly accept a v0.9.14 to v1.0.0 version increase;
publish-preparation guards passed. No live account import was requested.

Independent reference-math verification used unmodified upstream Wasmegg source
commit `9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67`, independently bundled from the
app's proposal engine. The pinned app data remain at
`a089580df4cc6cce8a2f5a9a7dcf86583a2c216d`.

| Independent check | Final-review coverage | Result |
| --- | ---: | --- |
| Farm snapshots and isolated effects | 738 states | Match within numerical/habitat rounding |
| Regular/sale research prices | 13,980 | Match within numerical tolerance |
| Habitat / vehicle / car prices | 228 / 612 / 27 | Match |
| Research tier unlocks | 41,328 | Exact match |
| Colleggtible selections | 240 | Exact match |
| Ship mission/FTL combinations | 132 | Exact match |
| Compounded research discount prices | 186,400 | At most one gem at safe-integer ceilings or permitted floating-point units |
| Passive earnings/delivery integrals | 16 | Match |
| DST sleep integrals | 2 | Match |
| Fuel conservation/transfer cases | 4 | Match |
| Pacific event boundary checks in selected zones | 192 | Exact match |

The reference samples cover all 56 common research items, 22 Epic Research
items, 171 artifact variants, 30 stones, 19 habitats, and 12 vehicles. The
maximum relative rate difference was `1.784305611747559e-8`, caused by one chicken
of habitat-ceiling rounding. Excluding that case, the maximum was
`1.0198447235008816e-15`. The compounded-price audit recorded 20,465 differences,
including 260 safe-integer differences of at most one gem; these are explicitly
reported rounding differences, not exact integer agreement.

The small earnings-first regression independently enumerates both legal orders
of an income upgrade and an unused slot upgrade and matches their minimum paid
completion time. Additional cases verify productive shipping, complementary
capacity, tier prerequisites, original sale prices, real offline breaks, invalid
proposals, deadlines, cancellation, multiple Curiosity visits, and full replay.
Those finite cases establish correctness within their stated domains; they do
not establish a global game optimum.

### Supplied 12-shift plan

The final v1.0.0 built-worker search used the supplied 160→200 TE inputs,
12-shift ceiling, owned inventory, 22:00–06:00 Pacific sleep, and required H1/H2
missions. With a 90-second budget, elapsed time including preparation, finalization,
and replay was 93.550 seconds. The retained 12-shift plan completed in
11,919,651.5115304 seconds: 137d 23h 0m 51s, with 40 TE per Virtue and 18 launches.
Final delivered eggs remained 3.044764300282032q/hour.

Strict replay and awake-interaction checks passed. Research, habitats, vehicles,
silos, and mission counts matched the prior plan. Five reordered complete plans
were replay-verified. The selected plan's C1 was about 10m 8s shorter; an earlier
paid C1/C2 comparison saved about 12m 7s combined. Later sale timing absorbed those
gains. A 0.0000174-second completion difference is numerical rounding and is not
reported as a meaningful speed improvement. Equal-finish selections can differ
in offline break counts and early-visit duration.

Private account inputs, plans, logs, and review screenshots remain outside
tracked source and both archives. `VALIDATION.json` records current local results
and records the accepted Windows/public-feed results.

### Release package verification

The runtime ZIP contains 169 files. ZIP CRC, the complete archive's manifest
size/digest, and every runtime file's size/checksum passed. Version metadata,
repository configuration, current audit links, and the built earnings-first
worker match v1.0.0. Source, tests, dependency folders, and private review files
are excluded from the runtime archive.

The curated developer ZIP contains 281 files, including all 18 public suites
invoked by the bundled release workflow and their source/PowerShell dependencies.
ZIP CRC and dependency checks passed. A fresh extraction installed dependencies
with `npm ci --offline`, rebuilt the app and worker, and passed the earnings-first,
worker, release-state, and publish-preparation suites.

### Windows verification before publication

No PowerShell/Windows runtime was available in the local review environment, so
`tests/update-core.cjs` and `tests/update-launch.cjs` were reserved for the mandatory
Windows publication workflow. They cover verified download/install, invalid
archives, rollback, preserved user files, hidden launch/reuse from paths with
spaces, restart, and startup-failure recovery. The workflow also verifies the
anonymous public update feed after publication and hides a release if that
validation fails.

Before this publication, the last accepted Windows/public-feed result was v0.9.14, source commit
`23f26a2c9c8bde64dc527769cad7735d69cffd4d`, in run
[37961773163](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/37961773163).
That historical success is not a v1.0.0 Windows result.

## Accepted v1.0.0 publication — October 9, 2026

Windows run [37985709711](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/37985709711)
completed successfully for source commit `efdee7c6ab2dbcd1a7055eb0ccdb7daec70ecc64`.
All 18 workflow test suites passed, including the new earnings-first ordering
checks, finite exhaustive sleep-search cases, and generated worker replay.

Native updater checks passed verified installation, seven invalid archive cases,
digest rejection, mid-install rollback, exact backup restoration, user JSON/config
preservation, and stage-tamper rejection. Native launcher checks passed hidden CMD
launch and reuse from paths with spaces, successful restart, startup-failure
recovery, and legacy-worker recovery.

The anonymous update feed, complete ZIP download, and every app-file checksum
passed on Windows PowerShell 5.1.26100.33438. Independent anonymous verification
confirmed v1.0.0 as the latest stable release, downloaded both complete assets,
verified GitHub digests and manifest size/hash, ZIP CRC, all 169 runtime entries,
every file checksum, version/repository metadata, current audit links, and the
built earnings-first code.

The accepted release is [v1.0.0](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v1.0.0).
This is a source-only verification follow-up. Published assets retain the
pre-publication audit snapshot; no existing assets were replaced.

| Asset | ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 626071854 | 8,576,789 | `bf40e6794edd9db9b106f1f1cc5f9fb783435e0aa901ced5c0801c2ca6f925c6` |
| update-manifest.json | 626071855 | 239 | `3bd767f1d6aa5921a17b7f268b20a02a6ee76cecdc478757ba18dc2106f1e81c` |

## Remaining model and search limits

Habitats are treated as full; growth time below roughly 100 claimed TE can make
predictions optimistic. Awake waits assume regular silo refills and maintained
video doubling. Automatic gear uses owned inventory, while manual sets use the
entered values. Running-chicken bonuses, boosts, gifts, future mission rewards,
and future gear are excluded. Ship final returns do not delay completion.
The bounded search returns the fastest complete plans found. Replay validates
feasibility under these assumptions, rather than proving global optimality.

## Inherited historical evidence

The following evidence predates v1.0.0. It is retained as model and solver
validation history and does not imply that v1.0.0 has passed Windows release
verification or that its solver is globally optimal.

## Inherited solver scope and search budget — v0.9.11


This release extends the verified v0.9.8 sleep and silo model. The normal search budget
remains 90 seconds. New early-R and calendar comparisons use that budget;
earnings-only schedule adaptation uses at most its first five percent, capped
at 4.5 seconds. Existing bounded comfort finalization remains unchanged.

### Changes

- When sleep exceeds currently owned silo coverage, reserve early Resilience
  proposals under the entered shift ceiling, including 10/11-shift ceilings.
  With no required missions, also compare a two-shift silo visit and return to
  the starting farm; other farm visits are not required merely to buy coverage.
  Covered farms and sleep-disabled proposals retain their previous route list.
- Expose paid prefixes within passive funding waits at the last full awake
  shift before bedtime, wake time, and a research-sale change. Interactions are
  never cut short. Cash, delivery, and offline-minimum eligibility are computed
  again for the prefix. Initial/physical/research traces and breakpoint selection
  can judge those departures through complete continuations.
- Only a stronger starting earnings setup with unchanged production, discounts,
  inventory, plan, sleep, and every other input can reuse an earlier result as a
  purchase-order proposal. Strictly replay the old source, then strictly replay
  its full calendar timeline with the actual new gear. Preserve distinct shift
  counts before comparing compressed waits. Reexecute and replay compressed
  candidates with a finish/shift ceiling; add no time or shifts. Other input
  changes still reject old winners. This does not inherit old cash/progress or
  promise monotonic cold-search results without an earlier verified plan.
- Add finite exhaustive search and earnings-upgrade rejection/reexecution checks
  to Windows release verification. Extend the private benchmark command
  with shared-zone sleep hours and optional saved-plan input.

### Evidence

Nine synthetic finite decision problems enumerate every legal research/silo/
shift order plus at most one explicit hold at the next sleep/sale boundary.
The 13,777 explored states include later-C research, early paid coverage, both
permits, sale start/end, Monday earnings, and the nine-hour fall-back night.
The solver matched every finite optimum exactly. This is controlled exhaustive
coverage of the stated domain, not a proof of the global game optimum.

A separate two-shift automatic case, with only Curiosity TE remaining, improves
from 226,800.00099992752 seconds and zero shifts to 172,832.00099992752 seconds
and two shifts: 14 hours, 59 minutes, and 28 seconds sooner. The previous route
list could not propose C → R → C under that ceiling. The new plan buys coverage,
returns to C, respects final-C delivery, and strictly replays with awake actions.

Private baseline comparisons use the same 160→200 TE inputs, currently owned
gear, 23:00–07:00 sleep in the shared Pacific timezone, and 90-second built-worker
searches. Account inputs and complete diagnostic results remain outside source.

| Trial | 12 shifts, seconds | 11 shifts, seconds | 10 shifts, seconds |
| --- | ---: | ---: | ---: |
| v0.9.8, cold, weaker stones | 11,923,251.511547804 | 12,407,043.281859875 | Not found |
| v0.9.8, cold, stronger stones | 11,923,251.511547804 | 12,926,644.254121304 | Not found |
| Candidate, cold, weaker stones | 11,923,251.511547804 | 12,407,043.281859875 | Not found |
| Candidate, cold, stronger stones | 11,923,251.511547804 | 12,926,644.254121304 | 13,802,565.727726221 |
| Candidate, weaker stones, prior verified plans | 11,923,251.511547804 | 12,406,885.128358603 | 14,096,612.441129446 |
| Candidate, stronger stones, prior weaker plans reexecuted | 11,923,251.511547804 | 12,406,885.128358603 | 14,095,500.508260489 |

The upgraded-gear reexecution preserves 12/11 shifts and improves the established
10-shift plan by 1,111.9328689575195 seconds (18 minutes, 31.93 seconds), without
extra shifts. The cold stronger trial found a faster 10-shift path but a worse
11-shift path. Cold comparisons remain variable; preserving verified alternatives
avoids discarding a better known result. Earlier R visits did not improve the
baseline's fastest time in these trials: its first R already prevents empty-silo
sleep. Worker elapsed times include initialization/replay and comfort finalization
and were approximately 93–95 seconds. Final-source repeat results follow below.

Build, sleep-search quality, earnings adaptation, route solver, research
breakpoints, investment search, existing sleep/silo/search quality, release-state,
publish preparation, DOM controls, and the generated browser worker pass. Worker
checks include actual earnings-only stone upgrades with old/new strict replay.
Rejected cases include changed targets/sleep/timezones, silo counts, inventory,
production, research prices, weaker/equal earnings, corrupt or malformed old
plans, and cancellation. CLI smoke comparisons retained all three baseline plans
and replayed each. Native Windows checks are required on the release runner before publication is accepted.


### Final-source repeat verification

The final generated worker repeated both 90-second runs against the prior
verified weaker-stone plans. Weaker stones retained all three 12/11/10-shift
completion times exactly. Stronger stones reexecuted all three source plans,
retained the exact 12/11-shift times, and again returned the 10-shift improvement
of 1,111.9328689575195 seconds. Both repeats had zero empty-silo time; final silo
counts remained 8/8/3. Worker elapsed times were 94.933 and 91.669 seconds,
including preparation, comparison, finalization, and independent replay. Every
plan strictly replayed, survived JSON round-tripping, reached its TE goal, and
kept all interactions awake. The worker regression also directly covers the
new automatic two-shift coverage-and-return case.

The eight full worker trials (two v0.9.8 cold, two candidate cold, and two pairs
of incumbent/upgrade trials) were run sequentially without simultaneous heavy
tests. A cold stronger run's faster 10-shift path remains separately verified;
reexecuting an earlier weaker plan does not guarantee discovery of that path in
every bounded rerun. The baseline fastest result and all retained alternatives
are maintained. Whitespace checks pass, private fixtures/results are excluded,
and generated bundles remain excluded from source commits.


## Historical release verification — v0.9.11

Release preparation builds v0.9.11 and runs the new exhaustive sleep-search and earnings-reexecution regressions, existing solver and worker checks, release-state checks, publish-preparation checks, and packaging. Windows native updater/launch checks and anonymous public-feed/download verification must pass before this release is accepted. Verification results will be recorded in a source-only follow-up; published assets retain the pre-publication audit snapshot.

The initial Windows release run stopped before publication because the 1.2-second finite-quality test allowance did not reach its expected optimum on that runner. Quality checks now allow eight seconds while retaining exact-optimum and strict-replay assertions. The application default remains 90 seconds. The corrected source passed the final Windows release run described below.

The second attempt (v0.9.10, source 9f40a486fc3dd9ed930484205da41a429d5a330b, Windows run 37840961939) passed all solver, native updater, packaging, and launch checks. Independent anonymous verification passed both complete downloads, GitHub/manifest digests, ZIP CRC, and all 169 runtime entries. The Windows anonymous feed check then received HTTP 403 after retries, and the workflow hid that release. It is not an accepted public release. v0.9.11 retries on a fresh runner with clearer HTTP/rate-limit diagnostics; the solver is unchanged.


### Accepted release verification

Windows run [37841706720](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/37841706720) completed successfully for source commit `0361dc7af4cf5b2e1e14ddb3fb78cacfd0c88934`. All solver checks passed, including all nine exact finite sleep-search optima and the generated browser worker. Native Windows checks passed valid installation, seven invalid archive cases, digest/version rejection, rollback and exact backup restore, user JSON/config preservation, hidden CMD launch and repeat reuse from paths with spaces, successful restart, startup-failure recovery, and legacy-worker recovery.

The anonymous public-feed lookup, complete ZIP download, and every app-file checksum passed on Windows PowerShell 5.1.26100.33438. Independent anonymous verification confirmed v0.9.11 as latest, downloaded both complete assets, checked GitHub digests and manifest size/hash, ZIP CRC, all 169 runtime entries and every file checksum, current version/branding, one current audit, updater repository configuration, and the new calendar-departure and earnings-adaptation worker code.

The accepted release is [v0.9.11](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v0.9.11). v0.9.9 never published; v0.9.10 remains hidden after its runner's HTTP 403. No existing assets were replaced.

| Asset | GitHub ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 622967586 | 8,582,266 | `d39b71b937e103ec555a87117a46c87c43eac31a8c75cb0d717db5b2918dfc51` |
| update-manifest.json | 622967582 | 240 | `90a580bba23147041e214091992df9b593ecbf130fe388f253bdeda54a8af19d` |

This record is a source-only follow-up. Published assets retain the pre-publication audit snapshot; the app version and release assets are unchanged.

## Local game-model audit — October 8, 2026

This is a model audit of source `f9900068e3152fd0548daf14dd6b292638558d46`,
separate from solver search quality and release verification. The initial audit
added only this report and an optional reference-backed test. The subsequent
event-calendar correction is recorded below and included in v0.9.12. The
initial audit left the application version and published assets unchanged.
No private account inputs were used.

### Independent reference and coverage

A fresh checkout of [Wasmegg](https://github.com/wasmegg-carpet/egg) at
`9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67` was compiled outside this application
checkout. The audit calls its unmodified TypeScript calculation modules, not
the app's bundled stage/proposal engine. The inspected model/data paths were
unchanged against the reference repository's advertised current HEAD,
`134d5c38268fa46dd2e2bc6c2abee2da434d855f`. Symlinked artifact and custom-egg
data targets were included in that comparison. The app adapter translates IDs
and input structures; it does not supply the independent expected formulas.

Wasmegg is an independently implemented community model. Both applications
share some data origins, so agreement is not proof against the actual game
client, server, or every live event. This audit does not establish global solver
optimality or rebenchmark the private baseline.

| Area | Evidence | Result |
| --- | --- | --- |
| Earnings, egg value, laying, habitats, and shipping | 738 farm states; isolated coverage of 56 common research items, 22 Epic items, 171 artifacts, 30 stones, 19 habitats, and 12 vehicles | Reference agreement within floating-point/ceiling differences |
| Unlocks and colleggtibles | 41,328 tier checks; 240 seeded colleggtible selections | Agreement |
| Purchase costs | 13,980 research prices, 228 habitat prices, 612 vehicle prices, and 27 train-car prices | Original reference suite passes |
| Combined discounts | 186,400 prices spanning every Cube variant, no Cube, Epic discount endpoints, colleggtible endpoints, and sale/regular prices | Only multiplication-order rounding discrepancies; details below |
| TE and shift costs | All 98 TE thresholds, values immediately around them, and 200 seeded Soul Egg/shift-count states | Agreement; pending TE does not increase current earnings |
| Silos and passive time | All silo prices; reference duration formula; 16 independent two-day income/delivery integrals across permits, Lunar gear/stones, wait modes, and coverage | Earnings and delivered eggs stop when sleeping silos expire |
| Daylight saving | Explicit seven-hour spring and nine-hour fall nights, with two hours of coverage | Coverage uses real elapsed time; no extra sleeping income or delivery |
| Weekly event boundaries | 192 checks immediately before, at, and after Pacific sale/earnings boundaries, including DST transition weeks and four selected timezones | Agreement; selected zones no longer move events |
| Mission data | 132 ship/duration/FTL combinations | Fuel, mission duration, and gem costs agree |
| Fuel accounting | Three independently calculated single launches with different stored Humility amounts; one storage test with zero shipping and silo exhaustion | Fuel uses laying; diversion grants no income or TE; inventory and parallel transfer timing agree |
| Existing sleep regression | Sleep/timezone/DST, affordability, sale deadlines, paid silos, ships, replay, and summary checks | Pass |

The largest original rate discrepancy was one extra habitat chicken caused by
ceiling after differently grouped floating-point multiplication. Its relative
effect was `1.784305611747559e-8`; excluding that case, maximum relative rate
error was `1.0198447235008816e-15`.

### Findings

**1. Event timezone override changed physical event times (fixed in v0.9.12).** The published v0.9.11 app places
Monday double earnings and Friday research sales at 09:00 in the selected
timezone. Wasmegg fixes their times to Pacific. The original override was
disclosed by `assumption-notices.cjs`, but Automatic resolves the PC's timezone;
users outside Pacific can therefore optimize against a different schedule.
Sleep sharing that timezone is correct; moving game events with it is the
accuracy concern.

| Selected timezone | October sale starts early by | December sale starts early by |
| --- | ---: | ---: |
| America/Los_Angeles | 0 | 0 |
| America/New_York | 3 hours | 3 hours |
| UTC | 7 hours | 8 hours |
| Asia/Kathmandu | 12 hours, 45 minutes | 13 hours, 45 minutes |

The user confirmed that recurring events always start at 09:00 Pacific,
following PST/PDT. The local calendar now uses America/Los_Angeles for every
event boundary. The selected timezone remains in use for sleep and date display.
The differences in the table describe the original published model; all are
zero after the correction. The established Pacific event schedule is unchanged.

**2. Full habitats are a modeling assumption, not simulated population growth.**
The simulator computes production from capacity immediately after habitat or
capacity upgrades. It does not integrate internal hatchery growth or imported
population. The existing below-100-TE notice acknowledges this, but 100 TE is
not an independently verified guarantee of instantaneous fill for every farm
and upgrade state. Low-TE starts and large early habitat upgrades are therefore
outside a claim of fully faithful timing. Research that improves hatchery rate
has no growth benefit in the current simulation.

Recommendation: validate representative habitat-growth delays against observed
gameplay before v1.0; if material, model population during those delays. This
audit used the reference's explicit `skipGrowth` mode for rate agreement, so it
does not hide this limitation as a population-model pass.

**3. Silo refills and video renewal remain player-maintenance assumptions.**
Sleep calculations correctly stop earnings, delivery, and farm-generated fuel
after coverage expires. They assume a refill before bedtime. Awake long waits
assume routine refills, with no check-in, offline-bonus reactivation, or video
renewal overhead. These assumptions are disclosed in the plan's maintenance
text. Starting with partly depleted silos is not modeled. The passive-time
results above validate the stated assumptions rather than proving that an
unattended multi-day wait remains productive.

**4. Small research-price rounding differences.** Of 186,400 combined-discount
comparisons, 20,465 differed numerically. Most were a few floating-point units
at prices above JavaScript's exact-integer range. The 260 differing prices
within that range differed by at most one gem. Worst relative error was
`6.650452420302475e-8`: T2 common Cube, max Lab Upgrade, no colleggtible discount,
sale, Hatchery Expansion level index 9 produced 15,036,570 gems versus the
reference's 15,036,571. Both compute the same mathematical discount; sale is
multiplied before versus after the base price. This is low priority compared
with event timing and population assumptions. Tests record these differences
and limit them to integer/float rounding instead of claiming exact equality.

**5. Remaining verification limits.** Tank capacities match the reference;
entered transfer rates and inventory conservation were checked. The automatic
base tank-output table and auxiliary fuel-flow modifiers were not independently
calibrated against the live game. Current import chooses the base output for
tank capacity; the editable output field must represent any additional flow
bonus. Ship timing tests cover the stated single-launch cases; the existing
sleep regression separately covers returns and interactions. Neither is an
exhaustive proof of every fleet schedule. Future mission rewards or equipment
upgrades are not assumed.

### Reproduction

The optional reference bundle exports the names used in
`tests/reference-math.cjs` from upstream `engine/compute.ts`,
`calculations/commonResearch.ts`, `lib/habs.ts`, `lib/vehicles.ts`,
`lib/artifacts/data.ts`, `lib/truthEggs.ts`, `lib/missions.ts`, and
`stores/silos.ts`, plus shared-library `earning_bonus.ts`, artifact data, and
colleggtible functions. The additional audit requires the four exported
`getNextSaleStart`, `getNextSaleEnd`, `getNextEarningsBoostStart`, and
`getNextEarningsBoostEnd` functions from upstream `lib/events.ts`.

Build an esbuild Node/CommonJS entry that reexports those unmodified modules,
with `@` pointing at upstream ascension-planner `src` and `lib` at upstream
shared `lib`. Generate upstream protobuf modules using its Makefile procedure
and include the symlinked periodicals/eiafx data. Pin `pako` to upstream's 2.1.0
dependency to retain its expected default export. Do not substitute
`src/wasmegg-stage-engine.cjs` for this independent reference.

```bash
WASMEGG_REFERENCE=/absolute/path/to/reference.cjs node tests/reference-math.cjs
WASMEGG_REFERENCE=/absolute/path/to/reference.cjs node tests/game-model-audit.cjs
node tests/sleep-schedule.cjs
```

Both reference-backed runs passed their stated tolerances, with the discrepancies
above retained in the report. Diagnostic JSON is generated under ignored
`tmp/model-audit/`; the findings and reproducible assertions are in source.
The original audit required no build or publication. v0.9.12 rebuilds the app
and worker with the subsequent event fix.

## Pacific weekly-event correction — v0.9.12

The weekly calendar always uses America/Los_Angeles: Monday 09:00 to Tuesday
09:00 doubles earnings, and Friday 09:00 to Saturday 09:00 multiplies research
prices by 0.30. Both follow PST/PDT. The selected timezone continues to control
sleep, timeline dates, Quick Guide dates, and PDF dates. The existing saved
`eventTimezone` field and Automatic setting are retained. The UI now labels
the choice Sleep & Display Timezone and removes the obsolete event-override
notice. Plan Start still accepts the PC's local time.

Non-Pacific plans are recalculated using the corrected event schedule. Strict
replay continues to reject timelines that are no longer funded or valid; this
fix does not preserve an incorrect historic event schedule. Previously valid
Pacific calendar boundaries are unchanged. These changes were first tested locally without changing the published
v0.9.11 release. v0.9.12 packages the corrected calendar and the completed
game-model audit; existing release assets are not replaced.

`npm ci` and `npm run build` passed. All 15 local check suites passed:
timezone choices/calendar boundaries, sleep/affordability, the generated worker,
sleep controls/date rendering in the DOM harness, both independent reference
suites, research-sale plans, route solver, research breakpoints, opening
discounts, exhaustive sleep-search quality, earnings incumbents, silo comfort,
search quality, and investment search. The nine finite sleep-search cases
matched their exhaustive optima exactly after moving the sale fixtures to the
actual Pacific boundaries. Native Windows release checks were not run for this
initial local verification.

The reference event audit passed 192 before/at/after checks across Pacific,
Eastern, UTC, and Kathmandu selections, including spring/fall transition weeks.
October and December event offsets are now zero for all four zones. The built
worker's cash integrals independently confirm Monday double earnings at
16:00 UTC under PDT and 17:00 UTC under PST while UTC is selected. The UI check
confirms selected-zone sleep and displayed shift dates, and older saved farms
retain their timezone values. Other original model-audit tolerances and limits
remain as documented above. Whitespace checks pass; generated bundles remain
ignored. The release version is 0.9.12.


## v0.9.12 release preparation

v0.9.12 contains the fixed Pacific weekly-event calendar, selected-zone sleep
and date display, the clarified timezone label, and the consolidated model
audit. The production solver search strategy and 90-second budget are unchanged
from v0.9.11. Windows release verification now includes the standalone timezone
regression as well as the generated worker's independent PST/PDT cash integrals.

Local preparation reruns the release-state and publish-preparation checks,
timezone regression, build, generated worker, and DOM sleep/date checks. The
previous full local solver/reference verification remains recorded above.
Windows solver, updater, packaging, launch, and anonymous public-feed checks
passed for v0.9.12. The accepted verification is recorded below; published
assets retain the release-preparation audit snapshot.


## Accepted v0.9.12 release verification

Windows run [37855442511](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/37855442511) completed successfully for source commit `af2dd58deb516af8aa4c243b8ebe85008c9b819d`. All solver checks passed, including the fixed Pacific timezone regression, all nine finite exhaustive sleep-search cases, earnings adaptation, and the generated browser worker.

Native Windows checks passed valid installation, seven invalid archive cases, digest/version rejection, rollback and exact backup restore, user JSON/config preservation, hidden CMD launch and repeat reuse from paths with spaces, successful restart, startup-failure recovery, and legacy-worker recovery. The anonymous update-feed lookup, complete ZIP download, and every app-file checksum passed on Windows PowerShell 5.1.26100.33438.

Independent anonymous verification confirmed v0.9.12 as latest, downloaded both complete assets, checked GitHub digests and manifest size/hash, ZIP CRC, all 169 runtime entries and every file checksum, version/branding, one current audit, updater repository configuration, sleep and calendar-departure code, earnings adaptation, the Sleep & Display Timezone label, and removal of the obsolete event-override notice.

The accepted release is [v0.9.12](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/releases/tag/v0.9.12). Existing release assets were not replaced. This is a source-only follow-up; the published ZIP retains the release-preparation audit snapshot.

| Asset | GitHub ID | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Egg-Inc-Virtue-Farm-Optimizer.zip | 623216613 | 8,588,315 | `21a7eb5ec05fa5067a3388768c1f61c006bcb05e1646b4e7066c61e04db48a88` |
| update-manifest.json | 623216612 | 240 | `1b7cb567e65d1c352a11eea8474e0467a168a3659b11558f0071b68bdfc0bcf6` |
