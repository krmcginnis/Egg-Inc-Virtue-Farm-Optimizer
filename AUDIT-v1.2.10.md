# Egg Inc. Virtue Farm Optimizer v1.2.10 — Release Audit

## Automated publication acceptance

All 42 required checks passed across three parallel Windows groups
for source `c79f58071009bd84bfd53640f5c6dfbe0b44f398`. [Workflow evidence](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/41554357774).
The exact tested package passed native updater/feed verification, anonymous public
asset/CRC/runtime-digest checks, and real-browser checks against the downloaded ZIP.
The run artifact `release-validation` contains suite timings and complete acceptance
evidence. The immutable release assets retain the prepublication audit.

## Release review — November 2, 2026 (Pacific Time)

Queued-ship credit now uses the actual per-egg loaded amounts rather than relying
on the Prepare to Launch status. A fully filled ship still marked Fueling is
recognized. Current Virtue-only fueling-pad context supplies type and reset scope
when unlaunched mission fields are omitted or retain defaults. Live mission records
also inherit missing current scope; explicit global and archive reset checks remain.
Empty pad placeholders are ignored. Loaded amounts and original reported status
are retained in farm data for reproducible backend accounting.

Partially fueled ships retain their paid purchase and actual loaded fuel. Remaining
fuel can load while existing missions are still flying. Launching still waits for a
physical slot and awake interactions. Credit is consumed once and is not available
to later ships or Humility visits. Tank Maximum handles partial credit and duplicate
mission groups without granting extra fuel or reusing the prepared ship.

Beginning and departure artifact/stone strips are shown only on Humility summaries.
A single initial earning setup appears before the timeline of a new plan starting
away from Humility. Other Virtue summaries no longer repeat artifact strips. The
Ships Launched panel, count inputs, historical totals and queued-ship status text
are removed. Automatic backend counting remains, together with upcoming launch
schedules, ship artwork, saved progress and current/departure gear timing.

## Validation

All 40 development checks passed: 29 model suites and 11 UI/worker/browser suites
on the exact current implementation. Synthetic protobuf cases cover Fueling with a
complete recipe, missing/default pending type/reset metadata, partial recipes,
named/numeric fuel eggs, old global resets and empty fueling-pad placeholders.
Paid replay verifies one-time purchase/fuel credit, overlapping fuel and return
waits, correct slot handling, later-visit isolation, Tank Maximum, automatic counts,
save/load and compiled-worker behavior. DOM checks verify hidden launch-count UI,
Humility-only loadouts and the separate initial setup.

A four-worker replay of the supplied farm plus the reported fully fueled ship
found a valid five-shift continuation using the Fueling/default-metadata case.
Private farms and account identifiers are not included in source or packages.
Real Chromium and visual checks passed at 1440 and 1000 pixels; the standard
browser suite also covers 500 pixels. Current account refresh is required because
older farm exports omitted the queued mission's actual fuel amounts.

Completed development checks are reused. Fresh release preflight verifies v1.2.10
labels, package CRC and closed runtime manifest. Publication remains gated on all
42 required checks across three parallel Windows groups on the exact candidate,
native updater/feed checks, anonymous public download/runtime digests and real
Chrome against the public ZIP. Automated acceptance is recorded only after all
gates pass; immutable assets retain this prepublication audit. Bounded search and
purchase-group checks do not prove global optimality. Search budgets, plan choices
and purchase economics are unchanged.
