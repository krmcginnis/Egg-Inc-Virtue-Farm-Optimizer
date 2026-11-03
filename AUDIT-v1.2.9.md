# Egg Inc. Virtue Farm Optimizer v1.2.9 — Release Audit

## Automated publication acceptance

All 42 required checks passed across three parallel Windows groups
for source `f1ae549ce0a28f65d294a4fd1a22ff1253513cd5`. [Workflow evidence](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/41549274713).
The exact tested package passed native updater/feed verification, anonymous public
asset/CRC/runtime-digest checks, and real-browser checks against the downloaded ZIP.
The run artifact `release-validation` contains suite timings and complete acceptance
evidence. The immutable release assets retain the prepublication audit.

## Release review — November 2, 2026 (Pacific Time)

Virtue launches are counted from active and archived mission records, using mission
identities, the current reset and the saved plan start. Returned missions are counted;
fueling and ready missions remain unlaunched. Automatic counts need no confirmation.
Optional overrides apply immediately and account refresh uses the latest records.
Incomplete or undated history is identified; counts do not invent missing launches.

Fully fueled waiting ships are imported separately from tank stock and active flights.
A matching remaining mission launches only after a physical slot is free, with its
already-paid purchase and fuel credited once. The credit survives save/load and is
not reused by later visits. Partially fueled ships are identified; finish fueling and
refresh to resume their paid recipe. Older farm exports omit this data and require
account refresh. Missing stored fuel now produces specific progress guidance.

Shift summaries include ship artwork, grouped mission counts and expandable launch,
slot and return schedules. Beginning and departure loadouts include artifact and
stone artwork on every shift. Both Quick Guide and Full Breakdown retain launch
schedules. Large schedules render their rows on expansion.

Humility search seeds use current-fleet stones during ship waits and equip projected
fleet gear at departure. Remaining search also compares the original saved route
with retimed ship-visit gear, preserving the faster fully funded and replayed result.
The supplied private farm reproduced a valid five-shift continuation with three
Henerprises launched and one fully fueled. Its gear-timing comparison improved the
complete replay by about 1 hour 45 minutes. Private farms and identifiers are not
included in source or packages; synthetic regressions cover these cases.

## Validation

All 40 Linux development checks passed: 29 model suites and 11 UI/worker/browser
suites on the current implementation. Coverage includes protobuf imports, archived
and active launch deduplication, reset/time boundaries, ready ships excluded from
launch counts, one-time paid fuel/cost, active-slot waits, later-visit credit isolation,
Tank Maximum, automatic progress without confirmation, legacy launch counts,
current/departure stones, retained saved-route improvements and independent replay.
A four-worker run on the supplied farm retained a valid five-shift result with no
rejected shared candidates. Real Chromium checks and visual review passed at 1440
and 1000 pixels; the standard browser suite also covers 500 pixels.

Completed development checks are reused. Fresh release preflight verifies v1.2.9
labels, package CRC and closed runtime manifest. Publication is gated on all 42
required checks across three parallel Windows groups on the exact candidate, native
updater/feed checks, anonymous public download/runtime digests and real Chrome
against the public ZIP. Automated acceptance is recorded after all gates pass;
immutable assets retain this prepublication audit. Search remains bounded and does
not prove global optimality. Search budgets and plan comparison policy are unchanged.
