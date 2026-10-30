# Egg Inc. Virtue Farm Optimizer v1.2.2 — Release Audit

## Accepted publication — October 30, 2026 (Pacific Time)

v1.2.2 is published and accepted. Windows run
[41106289094](https://github.com/krmcginnis/Egg-Inc-Virtue-Farm-Optimizer/actions/runs/41106289094) passed all 39 required suites for source
commit `9cfbf920c4db677f6fac1764155c632a1d71d1f8` (job `124236871853`).
The native updater/launcher, complete-asset publication and public update-feed,
full archive download and runtime-hash checks passed.

Independent anonymous downloads verified the latest tag/source, both asset sizes
and GitHub SHA-256 digests, ZIP CRC, all 169 archive entries and
167 runtime file hashes, the sole current audit and repository/version metadata.
The public compiled app passed Deep-default/old-plan and plan-choice tests,
including preview selection before applying, saves and reloads. Real Chromium
against the public ZIP verified the reported multi-day tradeoff, direct earliest
selection, keyboard operation, saved JSON and layouts from 1440 to 500 pixels.
The public worker matches the accepted v1.2.1 worker exactly.

Published assets:

- Egg-Inc-Virtue-Farm-Optimizer.zip: 8646959 bytes; asset `693018191`; SHA-256 `a94c952f615a2f4853af71216ad69db2d87c8c360dac14e461f4cc2bb8eb6cef`.
- update-manifest.json: 239 bytes; asset `693018195`; SHA-256 `ca30a9c1f1fc293ebda541abd29c7123d8890f8141679813c650e2a9c5a767a8`.

The immutable public ZIP contains the prepublication review below. This
acceptance evidence was added afterward in source; assets are unchanged.
Install through Update App → Update & Restart, then load an existing plan to
see the clearer choices. Another search is not required for this interface update.

## Release review — October 30, 2026 (Pacific Time)

Plan choices now appear above the timeline. A prominent selected finish shows
its extra duration, percentage and shift difference relative to the fastest
complete alternative. Independent labels identify the selected timeline,
Recommended · fewer shifts, and Earliest Finish Found. A direct Use Earliest
Finish action selects the faster option. The existing rule remains: prefer the
fewest shifts within five percent of the fastest elapsed duration found.

Remaining-plan proposals have the same chooser before application. Selecting a
proposal alternative leaves the original timeline intact until Use Selected
Remaining Plan; its selected result survives saving, loading and application.
The comparison includes the earliest finish found as well as the selected plan.
Manual choices continue through the summary, walkthrough and saved JSON.
Choices are locked while a search or account import uses the source plan.
The contradictory finish-time-first summary sentence has been removed.

This is an interface update. Game math, route coverage, worker configuration,
search budget and saved-file format are unchanged. The generated worker SHA-256
remains `944eb879c10e846025ee54735c88d760cc421dc1ea69171e4871894266140757`,
the accepted v1.2.1 worker. Existing saved alternatives show the new interface
without another search. A bounded search still does not prove global optimality.

## Validation gates

The new generated-app suite covers a multi-day 4.59% tradeoff, independent labels,
fastest selection, summary/JSON agreement, manual selection and reload, proposal
isolation, proposal save/load and application, busy locks, single and tied plans,
manual choices outside the preference, and 24-hour times. It runs in the Windows
release workflow. Existing navigation, account, search, progress, paid replay and
updater checks remain required.

Real Chromium checks used the reported saved plan to verify the visible 4.59%
tradeoff, the March 1 earlier finish, keyboard selection and saved JSON, with no
JavaScript errors or horizontal overflow at 1440, 1000, 760 and 500 pixels.
Desktop and narrow screenshots were visually reviewed. Private farm inputs,
full plan histories, screenshots and account data remain outside tracked source.

Current validation state is recorded in VALIDATION.json. Publication requires
the full Windows workflow and anonymous public update-feed, archive and runtime
hash verification. Native/public acceptance is recorded only after those gates
pass; the public release assets are never replaced.

All 38 locally runnable release/UI suites passed after building v1.2.2. The
release workflow requires 39 suites, including the native Windows updater and
launcher. The generated app's browser check and closed local archive also passed;
Windows and public acceptance remain separate publication gates.
