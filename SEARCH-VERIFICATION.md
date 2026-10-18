# v1.1.1 search and verification improvements

This document describes the v1.1.1 changes on top of v1.1.0. Publication and
release validation are recorded in the current audit and VALIDATION.json.

## Behavior

Normal worker searches use any remaining budget for up to five seconds of
exact purchase-block comparisons, on worker zero only. The existing 90-second
budget remains in effect. Search can end sooner when its declared work is done.
A separate **Purchase Order Check** section in the plan summary continues
unfinished comparisons, with up to five minutes per run and visible guidance
when the check is unavailable. The existing best time stays visible while it runs.
**Stop & Keep Best** retains its frontier, and **Save plan** includes that
checkpoint. Loading the same plan restores it. Changed farm/plan inputs or an
invalid checkpoint start fresh comparisons.

Blocks contain up to five existing purchases. Every legal ordering and subset
is considered using the simulator's earliest-affordable execution, followed by
the source route/suffix with preserved and retimed calendar policies. Research,
habs, engines, cars, and silos use real prices, prerequisites, interaction time,
sleep, fuel, and launches. A winning plan always passes full independent replay.
When a pass improves completion, another pass checks blocks of the improved
plan. Other shift-count alternatives remain available.

This is exhaustive for those declared finite blocks and completion policies.
It does not exhaust new upgrades outside the blocks, joint changes spanning
multiple blocks, arbitrary routes, arbitrary intentional waits, all TE/ship
schedules, or continuous departure times. The UI never calls it a global proof.

## Lower bounds and deadline checks

Let U be a replayed plan's duration and L a lower bound covering every plan
allowed by the entered model. The displayed maximum possible improvement is
U - L. This is a bound, not an estimate of the improvement likely to be found.
It concerns finish time; it does not certify the secondary tie-breaking rules.

The lower bound starts at the original farm, so it covers alternatives omitted
by the beam, finite reserve, route proposals, and sampled departure times.
Automatic routing allows all eggs still accessible under the shift allowance;
fixed routing uses the entered remaining route. The retained beam's minimum
score is never presented as a global bound.

An exact multiple-choice dynamic program finds the minimum remaining delivery
needed for the TE target and per-egg floors. It respects milestone prefixes,
existing lifetime delivery, and inaccessible eggs. Its exact-key tables are
bounded to 128 entries per context. Production receives optimistic free physical
upgrades and compatible owned/configured delivery gear. Fuel diversion and
production downtime are relaxed. Independent time bounds are combined with
maximum, not summed when they can overlap.

For a candidate finish T, funding bounds begin with all legal research granted
for free and an overestimate of attainable income. They grant uninterrupted
2x earnings, the strongest independent gear effects for income, a best possible
research discount, and sale prices throughout. Even under those assumptions,
new levels in one research family cannot cumulatively cost more than initial
cash plus all possible earnings before T/the research deadline. Impossible
levels and tiers are removed, then the income bound is recomputed. Each of up
to 32 monotone rounds remains optimistic; stopping before a fixed point merely
leaves a looser bound. The final delivery ceiling uses compatible gear.

A monotone deadline-feasibility test brackets an earlier finish. Only the
ruled-out side is used as a lower bound; no smoothness assumption is made at
sale or research-level discontinuities. Conservative price/rate/budget margins,
a 0.25-second bracket, and a 0.02-second reporting margin are recorded. This
uses floating-point model arithmetic, not an exact-arithmetic proof certificate.
The remaining relaxation can still leave a wide gap.

## Timing and parallel work

Calculated candidates supplement the existing departure samples. They include
milestone production times, alternative affordability thresholds, and both
legal sides of sale/sleep boundaries after allowing switch duration. Production
and funding use the existing analytic simulator integrations. Added points
receive bounded comparison slices; this is not a completeness claim about
continuous time.

Workers claim distinct adaptive refinement jobs using exact semantic source
identities. Completed work is skipped, busy work is retried, and unfinished
claims are released after a sibling fails. Fast initial search islands still
use different portfolios. The single-worker fallback and replay validation
remain intact. Task completion means the bounded refinement attempt finished;
it is not a proof that its entire neighborhood was enumerated.

Equivalent orders are merged only after their paid resource states, time,
remaining multiset, and offline-break objective match exactly. No rounded cash,
time, or research totals are used. This avoids assuming that the other ordering
survived an earlier bounded beam.

## Measurements

Fresh paired runs use the same private files as the v1.1 release review,
two actual generated worker threads, width 16, a 90-second budget, and an
advancing historical clock. Each returned alternative is independently replayed;
sleep, target/floors, and all 351 launches are preserved. Input files are unchanged.

| Case | v1.1 search | Updated search | Fastest-plan improvement |
| --- | ---: | ---: | ---: |
| Original | 20,821 ms | 26,957 ms | Best six-shift finish preserved |
| Follow-up | 29,744 ms | 26,407 ms | 25,041.98 s (6 h 57 min 22 s) earlier |

The follow-up five-shift alternative also improved by 302,955.55 seconds
(3.506 days). These are paired observations, not a universal speedup claim.
Extra verification increased elapsed time in the original case; both cases
remain within the unchanged default budget.

A separate complete block check exhausted eight blocks / 573 paid states in
about 4.96 seconds on the original plan, retaining its finish. It exhausted
eight blocks / 854 states over two passes in about 7.36 seconds on the follow-up,
finding the same 6 h 57 min improvement. The automatic short check can retain
unfinished work for the next purchase-check run.

In a controlled five-purchase case, exact-state merging expanded 32 states
instead of 326 independently enumerated order/subset nodes, with the same
optimum. This fixed-work comparison is distinct from whole-search wall time.

## Validation and limits

- Independent recursive oracles compare all small purchase subsets/orderings
  across earnings modes, interaction times, habs, engines/cars, and silos.
- One hundred randomized milestone problems match exhaustive allocation.
- Cancellation between nodes and during evaluation preserves the frontier;
  JSON checkpoint resume obtains the same exhaustive winner.
- Four paid real/synthetic plans supply 234 prefixes and 13,104 comparisons
  confirming that funding ceilings retain every actually purchased level.
  The deadline checks never reject their known feasible completions.
- Real generated-worker tests cover sharing, claims, duplicate avoidance,
  resource fallback, sibling failure, cancellation, and continuation identity.
- DOM integration executes the generated app and real workers, checking bound
  display, busy controls, pause, actual Save Plan serialization, load/resume,
  scoped completion, and final replay. It also exercises the visible account
  loading button and Enter shortcut, saved shift-plan selection, navigation
  and scroll restoration, next-step focus, changed-input and checked-progress
  guidance, purchase-check startup/worker failures, and next ascension.
- A real-browser test is provided separately. This environment could not run
  Chromium (local socket restrictions); the remote browser could not reach the
  local app. Visual layout remains unverified here.
- Native updater/launcher checks remain for Windows release validation.
  PowerShell was unavailable, and the downloaded official binary could not be
  executed in this environment. No updater/launcher production code changed.

All reported bounds are relative to the entered game model. No global-optimal
label, statistical confidence percentage, or global proof certificate is issued.
