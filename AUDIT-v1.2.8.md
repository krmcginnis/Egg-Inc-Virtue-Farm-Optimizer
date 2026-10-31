# Egg Inc. Virtue Farm Optimizer v1.2.8 — Release Audit

## Release review — October 30, 2026 (Pacific Time)

Plan percentage differences now display one decimal place. Positive differences
have a plus sign and negative differences a minus sign. Differences rounding to
zero display neutral 0.0% without a negative-zero sign. Faster time, higher laying
and shipping capacity, and lower Soul Egg cost retain their favorable green color;
opposite displayed differences remain red. The specified N plan remains the
comparison baseline regardless of selection and has no comparison labels.
Exact reconstructed metrics and saved plan values are preserved.

The Specified shifts / +1 / −1 subtitles are removed from the plan column headers.
Accessible button names still distinguish their roles. Completed Purchase order
checked labels are removed, while incomplete/error check status remains available.
Headers are more compact and keep the Selected badge. Automatic final-plan
purchase checks, per-plan checkpoints, manual selection, save/load, remaining-plan
preview/application and the relocated Save/Export/Progress actions are unchanged.

The game model, search budgets, purchase economics, fuel presentation and replay
rules are unchanged. Saved comparisons use the new presentation without another
search. Route search remains bounded and declared purchase-block checks do not
prove global optimality.

## Validation

Targeted development checks passed for percentage formatting/reconstructed rates,
compiled plan selection and remaining-plan preview/application, progress and saved
checkpoints, and real Chromium. Tests cover one-decimal positive/negative values,
neutral rounded zero, unchanged N anchoring, removed visible subtitles and completed
labels, preserved accessible names, real automatic check workers, Save/PDF/Progress
actions, fuel-rounding regressions and widths of 1440, 1000 and 500 pixels.

These completed development checks are reused; fresh preflight verifies v1.2.8
labels, packaging, CRC and the closed runtime manifest. Publication is gated on
all 42 required suites across three parallel Windows groups on the exact candidate,
native updater/feed verification, anonymous public asset/runtime-hash checks and
real Chrome against the downloaded ZIP. Automated acceptance is added after those
gates pass; immutable assets retain this prepublication review.
