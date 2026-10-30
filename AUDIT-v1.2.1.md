# Egg Inc. Virtue Farm Optimizer v1.2.1 — Release Audit

## Accepted publication — October 30, 2026 (Pacific Time)

v1.2.1 is published and accepted. Windows run
[41094750316](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/41094750316) passed all 38 required suites for source
commit `f88e8c099f10cf9445728613035cac35a8065a1f` (job `124197502164`).
The native updater/launcher and public update-feed, full archive download and
runtime-hash checks passed.

Independent anonymous downloads verified the latest tag/source commit, both
asset sizes and GitHub SHA-256 digests, ZIP CRC, all 169 archive entries and 167
runtime file hashes, the sole current audit and repository/version metadata.
The public generated app passed the current Deep-default and old-plan tests:
four workers, a shared 180-second deadline, width 32, preserved saved timelines,
new rerun/remaining-plan requests and stop propagation. The removed Planning
section and obsolete compiled visibility hook are absent from the public ZIP.

Published assets:

- Egg-Inc-Virtue-Farm-Optimizer.zip: 8646206 bytes; asset `692795954`; SHA-256 `9c82e108f5bae1bb1d4fb719c950b60728ab9ccf2287327344cdc778f9e21ff6`.
- update-manifest.json: 239 bytes; asset `692795952`; SHA-256 `584001b412051b9fd2a0f9d87532823b359607d6a61f76313a880cd1014c6c75`.

The immutable public ZIP contains the prepublication review below. This
acceptance evidence was added afterward in source; assets are unchanged.
Install through Update App → Update & Restart, then rerun or reoptimize a plan.

## Release review — October 30, 2026 (Pacific Time)

Standalone current-farm search now retains its established route portfolio and
interleaves up to nine compact gear/build families, varying physical farms and
delivery endings. These cover six-shift proposals that previously required a
saved continuation suffix. The combined portfolio is bounded at 23 routes.
Starting on Humility compares a physical revisit after research rather than an
adjacent duplicate Humility visit. Neighborhood refinement can insert a visit
when allowance remains; growth and prior edits share the bounded sampled prefix.
Every proposal still pays for shifts, purchases, gear, fuel and required launches,
and complete winners must independently replay. Manual routes and limits remain
in force. The game model and saved-file format are unchanged.

The Planning pane's Automatic Planning Details section and its obsolete
visibility hook are removed. The search controls, shift tracking and help page
remain available. Loading an older plan retains its saved timeline and historical
search statistics. Rerunning or reoptimizing requests the current installed Deep
profile: four worker requests, width 32 and one shared 180-second budget. Check
Purchase Order checks declared purchase groups rather than a full route search.
The five-percent recommendation policy and retained fastest option are unchanged.

## Controlled search comparison

Both measured searches independently used the same uploaded current farm, fixed
start, target 200 TE, six available shifts, sleep disabled and no requested
missions. Neither received a saved-plan seed. Both used four Deep workers with a
180-second requested budget. The separately uploaded remaining plan retained
sleep/missions and is not an identical-input benchmark.

| Configuration | Recommended result | Fastest found | Actual elapsed seconds |
| --- | --- | --- | ---: |
| v1.2.0 | 5 shifts, 126d 12h 42m 01s | 5 shifts, 126d 12h 42m 01s | 168.4 |
| Corrected | 5 shifts, 124d 19h 07m 00s | 6 shifts, 122d 17h 27m 55s | 185.4 |

The fastest result improves by 3d 19h 14m 06s. The five-shift result itself
improves by 1d 17h 35m 01s, and remains recommended because it is 1.69% slower
than the new six-shift result. All six returned alternatives reached 200 TE and
passed independent replay. One run per configuration was measured sequentially;
no heavy tests ran concurrently. Timing, memory and plan quality can vary with
hardware and farm inputs. Actual elapsed time includes final processing and can
exceed the requested budget. This bounded comparison does not prove optimality
or guarantee identical results between fresh and seeded searches. Private farms,
account identifiers and full plan histories remain outside tracked source.

## Validation gates

The release workflow requires 38 suites, including route coverage across starting
Virtues and shift allowances, an independently paid six-shift completion,
retained manual/continuation routes, sleep/missions, old-plan current-profile
requests, real workers, model/purchase checks, exports and the native Windows
updater/launcher. The scheduler wiring fixture uses a small real one-shift goal
so it does not assume an expensive earlier investment pass leaves adaptive time;
productive research gains retain their separate regression coverage.

Current validation state is recorded in VALIDATION.json. Publication requires
the full Windows workflow and anonymous public feed, ZIP and runtime-hash gates.
Native and public verification are recorded only after they pass.

All 37 locally runnable release/UI suites passed after rebuilding v1.2.1.
Generated-app tests confirm the removed planning section, working strategy
controls, four-worker requests after loading older plans, stop propagation and
remaining-plan requests. Closed-archive and native/public validation follow
the release gates above.
