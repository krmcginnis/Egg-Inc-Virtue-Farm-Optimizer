# Wasmegg comparison — v1.5

The v1.5 simulator was checked against the independent Wasmegg TypeScript source at commit `9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67`. The app's game dataset remains pinned to `a089580df4cc6cce8a2f5a9a7dcf86583a2c216d`; the inspected prices and effects agree with the reference source. This is a source comparison, not a claim that the live website's latest build was audited. See [current release audit](AUDIT-v1.5.12.md) for the complete assumptions and release checks.

| Independent check | Coverage | Result |
| --- | ---: | --- |
| Habitat, laying, shipping, delivery, egg value, online/offline income | 358 states | Agreement within floating-point rounding |
| Next-level research prices, regular and Friday sale | 13,980 prices | Match within numerical tolerance |
| Habitat / vehicle / car prices | 228 / 612 / 27 prices | Match within numerical tolerance |
| Tier unlock rules | 20,048 checks | Exact match |
| Colleggtible selections | 240 combinations | Exact match |
| Ship duration, fuel and gem cost | 132 mission/FTL combinations | Exact match |
| TE thresholds / silo formulas / Soul Egg switch costs | All 98 thresholds, all silo prices, 200 switch states | Match |

The sampled states include a real build timeline and 240 seeded farms with different research, habitats, fleets, Epic Research, claimed TE, colleggtibles, loadouts, video doubler states and permits. The largest observed relative rate difference was `1.7843056e-8` (about **0.0000018%**). One state differed by one chicken after a floating-point ceiling; its downstream laying/earnings differences were within that rounding allowance. Standard-permit offline income includes the 50% factor documented by Wasmegg's Virtue Companion, which the raw Ascension Planner snapshot omits.

## Controlled route comparison

Starting farm: 160 claimed TE (32 per Virtue), zero common research, free Coop/Trike/one silo, Pro permit, supplied gear and max Epic Research/colleggtibles. Start: October 13, 2026, 18:00 Pacific. Target: 200 TE, 160-day limit, 12 new switches, C1/K1 limits 30 minutes, up to three research sales. The user's exact exported 140-day plan was not available; the comparison reconstructs equivalent inputs from the saved farm.

| Same app inputs | Wasmegg staged strategy | Copied fixed route with Free Routing | Automatic Free Routing |
| --- | ---: | ---: | ---: |
| No ships | 141.142006333 days | 141.142006333 days | 141.142006333 days |
| H1 and H2 each: 7 extended Henerprises + 2 extended Cornish-Hens | 142.463663699 days | 142.463663699 days | 142.463663699 days |

Those three app strategy comparisons use the shared staged candidate engine; they confirm routing parity, not independent proof of optimality. The independent reference calculation above supplies the separate math check. The previously translated Wasmegg three-sale route in `Matched-Wasmegg-Plan.json` replays at about 141.143 days. The app adds switch interaction time and compares online/offline batches with a one-minute minimum; the reference auto-planner uses offline save estimates and zero switch overhead. Differences of minutes do not establish a math error. A different lifetime delivery total, date, gear, event schedule or mission list can change the answer.

## Assumptions and differences

Both planners assume full habitats, fixed artifacts and no sleep schedule. Our app enforces Virtue purchase permissions, lower-tier unlock counts, actual purchase costs, Soul Egg costs, switch limits and C1/K1 deadlines, then replays every result. Pending TE do not improve earnings before ascension.

Our app additionally models entered-order H1/H2 launches, gem costs, fueling, occupied slots across visits, residual tank stock and eggs diverted away from TE delivery. It leaves Humility after the final launch, without waiting for the final return. Neither tool predicts ship duration events, mission rewards or future artifacts.

Silos start at one. Long waits presume regular refills and maintained video doubling. Refill check-ins are not enumerated or counted as earning breaks. A minimum offline break longer than silo coverage is flagged as requiring refills; it cannot be one literal uninterrupted away session with those silos. Full-hab timing remains optimistic below roughly 100 claimed TE.

The complete staged opening grid retains all smaller 30-minute budget choices. The additional free-routing search is time-limited and heuristic, so enlarging limits does not guarantee that its independently found winner will be retained. Saved plans never seed a fresh search. These are fastest plans found, not guaranteed global optima.
