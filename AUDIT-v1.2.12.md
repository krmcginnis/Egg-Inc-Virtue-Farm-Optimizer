# Egg Inc. Virtue Farm Optimizer v1.2.12 — Release Audit

## Copper Egg colleggtible

The game catalog adds Copper with habitat cost multipliers of 0.95, 0.90,
0.85 and 0.80 at 10 million, 100 million, 1 billion and 10 billion chickens.
The existing habitat discount calculation multiplies Copper with other eligible
bonuses. The account importer recognizes Copper from the active contract or the
archived `copper-new-2026` identifier. No existing egg or contract mapping changed.

The catalog and contract data are pinned to the source revisions recorded with
the asset and mapping. The bundled 1024×1024 PNG matches the SHA-256 checksum in
the game catalog.

## Validation

Local checks verified the artwork checksum, catalog isolation, all four tiers
from active and archived records, habitat discount stacking, and the displayed
tier labels and artwork in the compiled app. The account import and compiled
plan comparison suites passed. Refresh from account after updating to pick up
Copper progress in an existing saved farm.

Automatic Planning compares Curiosity → Integrity → Kindness (habitats first)
and Curiosity → Kindness → Integrity (vehicles first). Both the opening recipe
and paid simulation use the imported habitat discount. Both orders reached
200 Truth Eggs in a controlled 160 TE case with Copper at tier 4, and the
habitat-first candidate finished about 35 seconds sooner in that case.

Release preflight verifies the version labels, archive CRC and runtime manifest.
Publication is gated on all 42 required checks on the exact candidate, followed
by updater verification, public asset integrity and real-browser acceptance.
The release runner authenticates GitHub API metadata requests to avoid shared
rate limits. Both update assets are still downloaded anonymously and verified.
