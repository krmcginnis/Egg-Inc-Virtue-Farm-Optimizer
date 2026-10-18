# Search efficiency research and implementation

## Adopted in v1.1.0

| Research or method | Application | Limits |
| --- | --- | --- |
| [Beam-stack search, Zhou and Hansen, ICAPS 2005](https://cdn.aaai.org/ICAPS/2005/ICAPS05-010.pdf) | Preserve a bounded reserve of paid states discarded by the beam and revisit promising branches. | This finite reserve is not the complete beam-stack algorithm and carries no completeness or optimality guarantee. |
| [ARA*, Likhachev, Gordon and Thrun, 2003](https://www.cs.cmu.edu/~maxim/files/ara_nips03.pdf) | Retain verified incumbents and separate optimistic mathematical bounds from heuristic ranking. | The optimizer is not ARA*. Its bounded routes and purchases do not satisfy the full algorithm's guarantee assumptions. |
| [Large Neighborhood Search, Pisinger and Ropke, 2010](https://backend.orbit.dtu.dk/ws/portalfiles/portal/5293785/Pisinger.pdf) | Reconsider purchase families and dependent chains together; delete, swap or move nearby route visits. Allocate further comparisons using measured improvement and elapsed time. | Dependency checks and full paid replay remain authoritative. A sampled neighborhood can miss a better combination. |
| [Memory-efficient beam search comparison, Chen and Beck, CP 2026](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.CP.2026.12) | Benchmark limited backtracking rather than assuming that a wider beam is always best. | Published performance comparisons are workload dependent; this app's gains are measured separately. |
| [Web Workers standard](https://html.spec.whatwg.org/multipage/workers.html) | Independent search islands use distinct timing/order priorities and share complete independently replayed candidates. | Two workers by default when at least four logical cores are reported, otherwise one; the coordinator supports a maximum of four and falls back when resources are unavailable. |
| [V8 profiling](https://v8.dev/docs/profile) | Sample the actual search, then reduce research multiplier calculation, calendar polling, string keys and allocation overhead. | Faster calculation is measured separately from overall search time and plan quality. |

Research-only multipliers are memoized per prepared farm. Every cache hit checks
the complete research vector, including after a cloned vector is mutated. Cash,
gear, event multipliers, calibration and physical capacity remain live inputs.
The TE goal allocator uses exact dense dynamic programming with the original
tie decisions; it does not assume that milestone costs are convex.

The production lower bound grants instant free legal upgrades, independently
strongest available gear, uninterrupted production and no fuel diversion. It
relaxes milestone dependencies when computing the minimum remaining egg demand.
Only a bound that cannot improve retained alternatives can prune a branch;
missing shift-count alternatives remain eligible. This is separate from the
less conservative heuristic used to rank candidates.

Departure refinements subdivide long funding waits and retain sale/calendar
boundaries. Sleep, earnings mode, silo coverage, purchases and the remaining
route are simulated again. They do not treat discontinuous sale prices as a
smooth optimization objective. Route edits reuse validated configured/recorded
artifact setups instead of repeatedly optimizing an entire inventory.

Worker islands have separate mutable state and caches and a common deadline.
They share only complete candidates that pass independent paid replay for the
same farm and planning rules. Final merging also replays candidates and retains
up to three distinct shift counts. Cancellation keeps verified winners; a failed
sibling does not discard another worker's valid plan.

## Considered without replacing the solver

[CP-SAT](https://developers.google.com/optimization/cp/cp_solver) uses integer
constraints. Encoding the entire simulation would require careful integer
scaling of enormous game prices, continuous time, sleep windows and discrete
upgrade dependencies. It is a possible small-neighborhood experiment, not a
justified whole-solver replacement from the present evidence.

[Brent's method](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.brentq.html)
requires a continuous bracketed function. Funding across sale boundaries and
discrete purchases is discontinuous. The simulator already computes affordable
times analytically inside constant-rate calendar segments; replacing those
calculations with iterative root finding would add work and risk invalid roots.

## Validation

The release audit and `VALIDATION.json` record paired measurements against the
published v1.0.10 worker, fixed-work calculation measurements and replay checks.
Private farm inputs remain outside source. `tests/search-efficiency.cjs` compares
cached/uncached calculations, a polled reference calendar, exhaustive small TE
allocations and optimistic bounds. `tests/search-pool.cjs` executes real worker
threads as well as deterministic failure, cancellation and candidate checks.
The Windows release workflow runs both suites and the standalone bundled worker.

These changes improve a bounded search. They do not certify a globally optimal
purchase order, route or completion time.
