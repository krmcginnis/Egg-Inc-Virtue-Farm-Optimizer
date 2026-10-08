# Egg Inc. Virtue Farm Optimizer v0.9.8 — Release Audit

## Scope

Optional daily sleep windows now constrain the planner, simulator, ship scheduler,
strict replay, saved inputs, timeline, Quick Guide, and PDF. Sleep uses the existing
Event Schedule Timezone beside Plan Start; obsolete independent sleep timezone
metadata is ignored. Automatic resolves the PC timezone. Plan Start remains PC
local time. The compact menu has 27 standard choices, adds the PC zone if needed,
and retains uncommon saved regional or fixed-offset selections.

Purchases, shifts, fueling setup, ship launches, and collections must fit awake.
Sleep applies offline earnings even with Online Only selected. Silo coverage is
real elapsed time: when it expires, earnings, delivered eggs, and farm-produced
fuel pause until wake. Stored fuel transfers and ship travel continue. The model
assumes refilling silos before bed and routine refills while awake. The entered
video doubler and full habitats remain maintained assumptions. Passive completion
during covered sleep is allowed; pending TE can be claimed when awake.

Sleep-enabled Resilience seeds fund enough silos for the longest remaining night
within the planning horizon, including daylight saving changes and permit caps.
A bounded final comparison considers paid comfort upgrades up to eight silos on
existing Resilience visits, including later visits. Completion time ranks first,
shifts second, then coverage up to eight. Candidates are fully reexecuted with
actual cash, interactions, sleep, sales, fuel, missions, and delivery. No added
completion time or shifts are accepted. Existing coverage above eight is kept;
standard permits cap purchases at two. The 90-second search remains unchanged;
final comfort comparison is capped at 4.5 seconds at that budget.

## Local validation

- Sleep tests cover repeated-night cash/delivery, Lunar bonuses, both permits,
  exhausted silos, retained cash, early/late R visits, funding deferred to wake,
  paid prices, production stopping after exhaustion, and coverage after shifts.
- Calendar tests cover spring/fall daylight saving, nine-hour nights, half- and
  quarter-hour zones, shared-zone precedence, saved uncommon choices, and
  excluding nights beyond the horizon.
- Comfort tests cover paid full/partial purchases, rejecting delays, permit caps,
  cancellation, preserving owned coverage, existing R visits only, purchases
  straddling bedtime, overnight completion, late R after delivery waits, solver
  finalization, and JSON/strict replay.
- Generated browser worker tests cover sleep, shared-zone precedence, and paid
  later-R comfort. DOM tests cover saved controls, Automatic, shared-zone changes,
  rare selections, validation, and historical files. DOM checks are synthetic;
  visual browser screenshot QA was not performed for this batch.
- Synthetic PDF text confirms shared timezone usage. Sleep-disabled old-source
  and current-source replay match exactly. Route, investment, search-quality,
  research-breakpoint, worker, release-state, and publish-preparation checks pass.

The private 160→200 TE baseline used owned gear, a 90-second search, up to 12
shifts, one starting silo with maxed Epic coverage, and 23:00–07:00 Pacific sleep.
A full generated-worker run with verified incumbents retained these finishes:

| Shifts | Completion seconds | Completion days | Final silos |
| --- | ---: | ---: | ---: |
| 12 | 11,923,251.511547804 | 138.000596 | 8 |
| 11 | 12,406,885.128358603 | 143.598208 | 8 |
| 10 | 14,096,612.441129446 | 163.155237 | 3 |

The 12-shift route increased from three to eight silos on its existing first R
visit without changing its finish or adding empty-silo time. The 11-shift route
already had eight. No qualifying comfort upgrade was found for the 10-shift
route. Total elapsed time including preparation, final comparisons, and replay
was about 94.12 seconds. All three final plans strictly replayed after the shared
timezone update. A separate cold search returned only 12/11 shifts; bounded
search does not guarantee every shift count or a globally optimal result.
Private inputs and diagnostic outputs remain outside tracked source.

## Release verification

Release preparation passed npm ci, the v0.9.8 build, release-state and
prepare-publish tests, subscription import, research-sale plans, route solver,
search quality, investment search, research breakpoints, sleep, silo comfort,
timezone, generated worker, DOM controls, packaging, and whitespace checks.
Native updater tests could not run locally because PowerShell is unavailable;
they are required on the Windows release runner before publication is accepted.

The Windows release workflow includes the new sleep and silo-comfort checks,
builds both generated bundles, packages one current audit and runtime files only,
and checks native updater/launch behavior. Publication requires both complete
assets and an anonymous public-feed/download checksum check. Release workflow
and public-feed results will be recorded after the v0.9.8 run completes.
