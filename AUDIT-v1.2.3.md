# Egg Inc. Virtue Farm Optimizer v1.2.3 — Release Audit

## Release review — October 30, 2026 (Pacific Time)

Final choices are the fastest paid completion found and the fastest paid plan
using exactly one fewer shift. New searches select the fastest by default.
Recommendations and the five-percent preference are removed. If the adjacent
lower shift count is unavailable, a different count is not substituted. Search
and worker pooling still keep per-count winners internally. Older three-choice
saves are fully replayed and retain their selected timeline and checked progress;
the interface exposes the current pair and identifies an older selected option.

After route-search islands finish and their results are merged, both final
choices automatically run the existing scoped purchase-order check. Search keeps
four worker requests and a shared three-minute budget. Check workers run afterward,
up to two concurrently, sharing five additional minutes; a single-worker fallback
reserves time for the other choice. Later replacement choices get remaining time
with a minimum cancellable slice. Setup, final replay and these final slices can
slightly exceed the requested budgets. The former short check on one search
island is disabled for this combined workflow.

Each check compares subsets and legal orders in declared groups of up to five
purchases. Only complete paid results that replay, reach the target, retain the
shift count and do not worsen the prior plan are accepted. If checking changes
the fastest shift count, its new exact-one-fewer choice is checked too. Broader
per-count search winners remain available during this reranking. Stopping before
the check phase skips additional work; stopping during it returns valid plans
and resumable checkpoints. Worker startup, transport or replay failure preserves
the original paid plan and reports the unfinished check. Completed checks require
no separate button; older and unfinished plans retain the manual fallback.

The interface shows per-choice check status and automatic-phase progress.
Saving/loading and selecting another plan retain each plan's checkpoint. The
remaining-plan source identity, original comparison, target and shift accounting
remain intact. The shared worker Blob URL stays alive until later check workers
finish, then is released. Game rules, weekly events, purchase math and the
underlying declared-block verifier are unchanged. The bounded route search and
scoped purchase checks do not prove global optimality.

## Validation gates

Updated selection tests cover the exact lower count, arbitrary extra duration,
missing/zero/tied counts, manual save/load, old three-entry timelines and progress,
all stored-plan replay, and multi-worker reranking without dropping hidden counts.
The new evaluated-search suite covers paid improvements to both choices, separate
search/check deadlines, parallel checks, one-worker fallback, cancellation before
and during checks, invalid-result rejection, changed-pair rechecking, real
compiled check workers and continuation identity. The generated-app tests exercise
both checks before presenting a remaining proposal and applying/saving it.

Real Chromium checks use live Blob workers after deterministic search completion
to verify automatic checks, both statuses, hidden completed-check buttons,
per-plan selection and saved checkpoints. Desktop/narrow screenshots are reviewed.
The existing reported plan is also checked for two choices, absent recommendation
labels, 24-hour dates, direct earliest selection, keyboard selection and export.
Private farms, histories, screenshots and account identifiers stay untracked.

Current validation state is recorded in VALIDATION.json. Publication requires the
full Windows workflow and independent anonymous tag/source, asset-digest, ZIP,
closed-manifest and runtime-hash verification. Acceptance is recorded after those
gates pass. Public release assets are never replaced.

All 39 locally runnable release/UI suites passed after building v1.2.3. The
Windows workflow requires 40 suites, including the native updater and launcher.
Both real-browser checks passed. The compiled worker SHA-256 is `a13266f07ee099ef834c9f47be945d9254f0cb1e092a7a0d40dcf4c8777f9538`.
Windows and independent public acceptance remain separate publication gates.
