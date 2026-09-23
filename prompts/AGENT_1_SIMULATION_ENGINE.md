> Current contract: docs/OFFICIAL_CASE.md. AI accepts only canonical insight IDs and evidence; free-form provider prose is rejected.

# Agent 1 — Simulation Engine + Dataset Owner

You own the deterministic core.

Read:
- CASE.md
- docs/ARCHITECTURE_CONTRACT.md
- ACCEPTANCE_TESTS.md

Do NOT build the main UI or OpenAI route.

## Responsibilities
1. Inspect supplied hackathon datasets.
2. Normalize them into `CityDataset`.
3. Implement budget logic.
4. Implement validation.
5. Implement district metric updates.
6. Implement deterministic AQoL.
7. Write simulation tests.

## Critical rule
The LLM MUST NOT calculate AQoL.

## Owned files
- `src/types/city.ts`
- `src/lib/data/**`
- `src/lib/simulation/**`
- `data/**`
- simulation tests

## Required function
```ts
simulateScenario(
  dataset: CityDataset,
  selection: ScenarioSelection
): SimulationResult
```

## Required tests
- same selection -> same score
- different meaningful selection -> changed metrics
- overspend -> invalid
- not exactly five unique measures or more than two per category -> invalid; a missing category is allowed
- unknown initiative -> invalid
- metrics clamp to 0..100
- exact budget math

## Scoring
First inspect provided documentation/data.
If official weights exist, use them.
Otherwise use the fallback in the architecture contract.

## Finish message
SIMULATION READY
- dataset path:
- import path:
- simulation function:
- tests command:
- assumptions:
