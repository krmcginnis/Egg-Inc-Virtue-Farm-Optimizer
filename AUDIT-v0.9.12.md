# Egg Inc. Virtue Farm Optimizer v0.9.12 — Release Audit

## v0.9.12 scope

Weekly game events now use 09:00 America/Los_Angeles, following PST/PDT,
independently of the selected sleep/display timezone. The release includes
the clarified timezone label, event regressions, and consolidated game-model
audit. Optional sleep and silo handling remain available from v0.9.11; enable
Sleep Hours when generating the next benchmark. The search strategy and normal
90-second budget are unchanged. The earlier solver/release evidence is retained
below, followed by the v0.9.12 correction and release verification.

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
must pass before v0.9.12 is accepted. Their results will be recorded after the
release workflow completes.
