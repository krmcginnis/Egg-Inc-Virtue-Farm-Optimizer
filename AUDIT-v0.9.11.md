# Egg Inc. Virtue Farm Optimizer v0.9.11 — Release Audit

## Scope and search budget


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


## Release verification

Release preparation builds v0.9.11 and runs the new exhaustive sleep-search and earnings-reexecution regressions, existing solver and worker checks, release-state checks, publish-preparation checks, and packaging. Windows native updater/launch checks and anonymous public-feed/download verification must pass before this release is accepted. Verification results will be recorded in a source-only follow-up; published assets retain the pre-publication audit snapshot.

The initial Windows release run stopped before publication because the 1.2-second finite-quality test allowance did not reach its expected optimum on that runner. Quality checks now allow eight seconds while retaining exact-optimum and strict-replay assertions. The application default remains 90 seconds. The corrected source must pass a new Windows release run.

The second attempt (v0.9.10, source 9f40a486fc3dd9ed930484205da41a429d5a330b, Windows run 37840961939) passed all solver, native updater, packaging, and launch checks. Independent anonymous verification passed both complete downloads, GitHub/manifest digests, ZIP CRC, and all 169 runtime entries. The Windows anonymous feed check then received HTTP 403 after retries, and the workflow hid that release. It is not an accepted public release. v0.9.11 retries on a fresh runner with clearer HTTP/rate-limit diagnostics; the solver is unchanged.
