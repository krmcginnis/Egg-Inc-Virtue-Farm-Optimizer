# Wasmegg comparison

The game model was compared with independent Wasmegg TypeScript source at
commit `9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67`. The app's game dataset remains
pinned to `a089580df4cc6cce8a2f5a9a7dcf86583a2c216d`. This checks the named source
versions, rather than the latest live website. See the
[current release audit](AUDIT-v1.0.2.md) for verification and model limits.

| Independent check | Historical coverage | Result |
| --- | ---: | --- |
| Habitat, laying, shipping, delivery, egg value, online/offline income | 358 states | Agreement within floating-point and habitat rounding |
| Next-level research prices, regular and Friday sale | 13,980 prices | Match within numerical tolerance |
| Habitat / vehicle / car prices | 228 / 612 / 27 prices | Match within numerical tolerance |
| Tier unlock rules | 20,048 checks | Exact match |
| Colleggtible selections | 240 combinations | Exact match |
| Ship duration, fuel and gem cost | 132 mission/FTL combinations | Exact match |
| TE thresholds / silo formulas / Soul Egg switch costs | All 98 thresholds, all silo prices, 200 switch states | Match |

Those historical samples included a supplied build timeline and 240 seeded farms
with different research, equipment, bonuses, gear, video doubling, and permits.
The largest observed relative rate difference was about `1.7843e-8`, caused by
one chicken of floating-point habitat-ceiling rounding. Standard-permit offline
income includes the 50% factor documented by Wasmegg's Virtue Companion.

The separate model audit also checks compounded research discounts, passive
earnings and delivery, silo exhaustion, daylight saving changes, pending TE,
ship fuel conservation, and event boundaries in several selected timezones.
Compound prices can differ by one gem at integer ceilings or a few floating-point
units at very large prices; the audit records those differences explicitly.

## Current planner behavior

Automatic Planning and User Selected Sequence use the same route-aware, paid
purchase model. The planner compares research, physical upgrades, departures,
owned gear, sale timing, and complete delivery plans within a 90-second budget.
It returns the fastest complete plans found, with strict replay validation.
Replay verifies feasibility under the model and does not prove global optimality.

On Curiosity research visits, earnings-first ordering is compared with existing
orders. Inactive capacity can wait until departure; tier prerequisites and
complementary upgrades can still come earlier. The last Curiosity visit is
delivery-only. Earlier verified plans can seed identical-input searches, and
an earnings-only gear improvement can propose an order that is paid again using
the actual new gear. Other input changes invalidate those retained candidates.

The former fixed-stage routing comparisons are historical development evidence.
They are not benchmarks for the current solver. The current release audit
records the supplied 12-shift setup and its paid, sleep-aware replay.

## Timing and assumptions

Game events are fixed at 09:00 America/Los_Angeles, following PST/PDT:
Monday–Tuesday double earnings and Friday–Saturday common-research cost ×0.30.
The selected timezone controls sleep and displayed dates. Plan Start is entered
in the PC's local time.

Habitats are modeled as full immediately. Chicken growth can make predictions
too optimistic below about 100 claimed TE. Pending TE do not improve earnings
before ascension. Automatic gear uses owned artifacts and stones; future finds,
boosts, drones, running-chicken bonuses, and mission rewards are excluded.

Enabled sleep blocks game interactions. Farm production and income continue
only while silos have coverage, and sleep uses offline earnings. Awake waits
assume routine refills and maintained video doubling. Refill check-ins are not
counted as earning breaks.

Planned missions include costs, fueling, tank capacity, existing flights, and
shared mission slots. Fuel diversion reduces TE delivery and income. All required
missions must launch, but the final return does not delay completion. Ship
duration events and future rewards are not predicted.

Changing dates, lifetime delivery totals, sleep, gear, or missions can change
the resulting plan. Equal settings and strict replay are necessary for useful
comparisons with an independently generated Wasmegg plan.
