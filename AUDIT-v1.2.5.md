# Egg Inc. Virtue Farm Optimizer v1.2.5 — Release Audit

## Automated publication acceptance

All 42 required checks passed across three parallel Windows groups
for source `0cf7d791060ff50d0c633de12d6eb531c0a4cc1f`. [Workflow evidence](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/41148537384).
The exact tested package passed native updater/feed verification, anonymous public
asset/CRC/runtime-digest checks, and real-browser checks against the downloaded ZIP.
The run artifact `release-validation` contains suite timings and complete acceptance
evidence. The immutable release assets retain the prepublication audit.

## Release review — October 30, 2026 (Pacific Time)

The N+1, N and N−1 comparison now shows percentage differences in total time,
maximum laying, maximum shipping and future Soul Egg cost against the specified
N plan. The baseline stays N after manual selection. Faster time, higher capacity
and lower cost are green; opposite changes are red. Direction labels accompany
colors, ties and N itself are neutral, and differences smaller than 0.01% retain
an explicit direction instead of rounding to a misleading zero. Missing N plans
and zero baselines are labeled without producing infinite percentages.

Save Plan, Export Walkthrough and the farm-progress shortcut now appear in the
Compare Plans header. The redundant green summary card and Use Earliest Finish
button are removed. Purchase-check recovery and search diagnostics remain under
Plan details. Older single-plan saves retain the relocated actions and timeline.
Saving remains available during background search while plan selection is locked.
The proposed remaining plan exports from its own comparison; Save Plan retains
the current plan, checked progress and pending proposal until application.

Selection defaults, bounded search, automatic purchase checking, capacity and
Soul Egg formulas, Monday/Friday events and the game model are unchanged. Peaks
remain modeled capacities and may occur at different times; future Soul Egg cost
covers shifts from the starting farm. This update requires no new search to change
an existing saved comparison's presentation.

## Validation

All 40 local model and UI/worker suites passed on the completed implementation.
The existing successful implementation fingerprints are reused for publication;
fresh version/build/package verification checks the v1.2.5 labels and archive.
Percentage tests cover both directions for all four metrics, a fixed N baseline,
ties, tiny differences, unavailable N and zero Soul Egg cost. Generated-app tests
cover legacy single plans, saved selections, progress, remaining-plan preview,
application and saving during search. Chromium verifies actual green/red colors,
keyboard selection, the moved Save Plan/PDF/progress actions, three real Blob
purchase-check workers and layouts at 1440, 1000 and 500 pixels.

Publication is gated on all 42 required suites across three parallel Windows
jobs checking the exact candidate, native updater/feed verification, anonymous
public asset/CRC/runtime-hash checks, and real Chrome against the public ZIP.
The release workflow adds acceptance evidence after those gates pass. Bounded
route search and declared purchase-block checks do not prove global optimality.
