# Acceptance Tests

## AT-01 Same starting conditions
Every run starts from the same fixed budget and baseline data.

## AT-02 Five decisions
Submission requires exactly one initiative for each category.

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
