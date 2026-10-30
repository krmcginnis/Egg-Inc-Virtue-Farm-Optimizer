# Current-farm route coverage correction

v1.2.1 release review — October 30, 2026 (Pacific Time).

The initial automatic portfolio could contain no six-shift proposals with six
shifts allowed. Reoptimization could retain such a route from a saved plan,
while a standalone current-farm search lacked it. Local route edits could only
remove/reorder visits, so additional workers could not introduce the missing
upgrade cycle through that neighborhood.

The correction retains all established initial proposals and interleaves up to
nine compact gear/build families. Physical farm and delivery ending vary, with
six-shift proposals checked for all five starting Virtues. A farm already on
Humility compares another physical visit after research instead of adding an
adjacent duplicate Humility visit. The combined portfolio is bounded at 23.
Local edits can insert visits when allowance remains; insertion families and
old edits are interleaved within the bounded sampled prefix. Every proposed
route is prepared, paid, completed and independently replayed. Manual routes,
shift limits, mission requirements, sleep and the five-percent preference remain
in force. The game model and saved-file format are unchanged.

## Controlled current-farm comparison

Both searches independently used the same uploaded farm configuration, fixed
start, target 200 TE and six available shifts. Sleep was disabled and no missions
were requested. No old plan or winner was supplied as a seed. Both requested
Deep search with four workers, width 32 and a shared 180-second budget. These
settings differ from the separately uploaded remaining-plan example, which
retains sleep and missions; its duration is not an identical-input benchmark.

| Configuration | Recommended plan | Fastest plan found | Actual search seconds |
| --- | --- | --- | ---: |
| Published v1.2.0 | 5 shifts, 126d 12h 42m 01s | 5 shifts, 126d 12h 42m 01s | 168.4 |
| Corrected candidate | 5 shifts, 124d 19h 07m 00s | 6 shifts, 122d 17h 27m 55s | 185.4 |

The fastest option improves by **3d 19h 14m 06s**.
The five-shift option itself improves by **1d 17h 35m 01s**.
It remains recommended because it is 1.69% slower than
the six-shift option, within the requested 5% allowance. All six returned
comparison plans reached 200 TE and passed independent replay.

Baseline worker SHA-256: `6e61c22ecf55ca9c6c6780cacfb6463fff6eaccd9d26cf4a8c0ca8f5cd46993b`.

Corrected worker SHA-256: `944eb879c10e846025ee54735c88d760cc421dc1ea69171e4871894266140757`.

One run per configuration was measured sequentially on the same host. Actual
elapsed time includes final processing and can exceed the requested budget.
No heavy test suites ran concurrently with either measured search. This is a
bounded-search observation, not a guarantee of global optimality or identical
results between fresh and seeded reoptimization searches. Private farms and
plan histories remain outside tracked source.

## Old plans and the current search engine

Loading an older plan replays and displays its saved timeline and historical
search statistics. It does not launch a search. Find Best Plan and Reoptimize
Remaining Plan request the current installed Deep profile, including four worker
requests and a shared three-minute deadline. Compatible saved plans are passed
as incumbents. Check Purchase Order is a separate bounded purchase-group check,
not a full route search. Generated-app regression coverage exercises loading an
older two-worker result, rerunning it, and reoptimizing a checked saved plan.

## Validation status

All 37 locally runnable release/UI suites passed, including the new route
coverage suite, paid/replayed completion, five-percent recommendation checks,
real Deep workers, continuation/sleep/mission rules and old-plan UI requests.
The scheduler wiring test uses a small, real one-shift completion so it does not
assume an expensive earlier investment pass leaves budget for adaptive work;
productive-research gains remain covered by their dedicated suite.
The release workflow includes the new route-coverage regression. Publication requires the Windows release and anonymous public-feed gates;
acceptance evidence is recorded in the current release audit and VALIDATION.json.
