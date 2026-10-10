# Egg Inc. Virtue Farm Optimizer v1.0.1 — Release Audit

## Release candidate status

v1.0.1 adds native desktop hover tooltips to the shared research icon renderer.
Each tooltip shows the research name and its game effect description. This
covers Summary, Quick Guide, Full Breakdown, and research input pages. Existing
text labels and decorative artwork accessibility are retained. The solver,
research data, saved-plan schema, purchase grouping, and timing are unchanged.

`npm ci` and the v1.0.1 app/worker build passed. The research-artwork browser
suite passed across replayed Summary, Quick Guide, and Full Breakdown views,
research inputs, saved-farm roundtrips, desktop layouts, offline use, and missing
artwork. The built app contains the research name/effect tooltip assignment.
Release-state and publish-preparation guards also passed.
The Windows release workflow must still pass its solver, updater, launcher,
packaging, and anonymous public-feed checks before publication is accepted.
The current release status is recorded in `VALIDATION.json`.

The runtime ZIP contains 169 files; ZIP CRC, the archive manifest size/digest,
and every runtime file checksum passed. The curated source ZIP contains 281
files, including all 18 suites used by its release workflow and their
dependencies. Version metadata, current audit links, and the compiled tooltip
assignment match v1.0.1. Private review inputs are excluded from both archives.

## Inherited v1.0.0 release evidence

The following checks and publication results belong to v1.0.0. They are retained
as baseline evidence; they are not a claim that v1.0.1 has already passed its
release gates. The solver and model are unchanged by v1.0.1.

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
