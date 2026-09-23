# Acceptance Tests

Source: `docs/OFFICIAL_CASE.md`, supplied 2026-09-23. AT-02 was corrected from the earlier internal one-per-category assumption to the official detailed rule; this is not a waiver of an official requirement.

## AT-01 Same starting conditions
Every run starts from the same fixed budget and baseline data.

## AT-02 Five decisions
Submission requires exactly five unique measures, at most two per category (at least three categories), valid district targets, and no target for city measures.

## AT-03 Budget control
Overspend is invalid and cannot be submitted.

## AT-04 Deterministic score
Same data + same choices => same score.

## AT-05 Decisions affect outcome
Meaningfully different choices change projected metrics and, when impacts differ, AQoL.

## AT-06 Score is code-driven
AQoL is deterministic code, not LLM output.

## AT-07 AI explanation
Valid scenario returns summary, strengths, risks, trade-offs and recommendations tied to actual result data.

## AT-08 Bad AI output
Malformed/empty provider output is handled without crashing.

## AT-09 Missing key/provider failure
Useful error; deterministic simulation remains intact.

## AT-10 Clean run
Judge can run from README after a fresh clone.

## AT-11 Build
Production build succeeds.

## AT-12 Demo proof
Scenario A and Scenario B produce visibly different outputs when decisions differ.

## AT-13 Official model
Budget100; five official districts and shares; ten indicators; M1–M14 catalog. Baseline52.55768; official cost95 example56.54307 before display rounding.

## AT-14 Effect mechanics
Apply horizon8/lag, all three fixed synergies, all three incompatibilities, clip after accumulation, official weights/weakest-district term/strictly-below40 penalty.

## AT-15 Invalid plan
No projected score or delta for any invalid selection. Exact100 valid;101 invalid. Order does not affect result.
