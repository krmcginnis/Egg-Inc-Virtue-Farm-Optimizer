# Egg Inc. Virtue Farm Optimizer v1.2.6 — Release Audit

## Release review — October 30, 2026 (Pacific Time)

Alternative plan metrics now show signed percentage differences only: a plus
for increases, a minus for decreases and neutral zero for ties. The specified
N column has no comparison labels, and N remains the baseline after selecting
another column. Faster time, higher laying/shipping and lower Soul Egg cost are
green; the opposite changes are red. Undefined percentages are omitted and tiny
nonzero percentages retain numeric precision. The comparison footer and the
entire Plan Details panel, including its manual check control, are removed.
Automatic final-plan purchase checks and saved checkpoints remain in place.

Fuel instructions for tanks of at least 1T round each store/discard amount to the
nearest 1T. An adjustment rounding to zero produces no summary/guide/breakdown
row, fuel-collection break or progress confirmation. Hidden steps do not block
progress or produce an empty purchase group. Substantial fuel waits and amounts
remain visible, and tanks below 1T retain useful sub-trillion instructions.
App summaries, progress and PDF walkthroughs use the same display rules.

The reported 106.303B Resilience and 99.562B Kindness discards and 205.865B
Curiosity fill are covered by a complete synthetic paid fleet plan. All those
adjustments round to zero and disappear from the instructions. Exact recorded
fuel, action indices, collection time, paid replay, finish time and current-farm
reoptimization inputs are preserved. Displayed fuel-duration totals exclude
hidden fills while exact accounting retains their time.

Plan selection, route budgets, purchase economics, rates/prices, ship requirements
and Monday/Friday events are unchanged. Existing saved plans use the updated
presentation without another search. Search remains bounded; purchase checks
exhaust only their declared blocks and do not prove global route optimality.

## Validation

All 40 local model and UI/worker suites passed on the completed implementation.
The completed implementation checks are reused for publication; fresh preflight
verifies the v1.2.6 build, version labels and archive. Tests cover signed deltas,
N baseline/omitted labels, missing/zero/tiny values, removed text/panels, preserved
automatic checks, save/load, remaining-plan preview/application and action buttons.

Fuel tests cover rounding boundaries, mixed discards, small tanks, no empty group
for the reported tiny fill, retained substantial waits, progress skip, immutable
recorded actions and a complete target-reaching paid replay. Browser checks cover
visible guide/breakdown/progress behavior, actual colors, PDF export, responsive
layouts and real Blob check workers. Text extracted from an exported fuel fixture
PDF confirms the reported tiny quantities are absent and whole-T refills remain.

Publication requires all 42 suites across three parallel Windows groups on the
exact candidate, native updater/feed verification, anonymous public asset CRC
and runtime-hash checks, and real Chrome against the downloaded public ZIP.
The workflow records acceptance afterward; this prepublication audit remains
inside the immutable assets.
