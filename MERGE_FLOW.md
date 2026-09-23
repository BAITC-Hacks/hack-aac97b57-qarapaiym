# Merge / Execution Flow

## 0–10 min
All three read:
- CASE.md
- Architecture Contract
- Acceptance Tests

Do not redesign interfaces separately.

## Branches
- Agent 1: `simulation`
- Agent 2: `ui`
- Agent 3: `ai-docs`

## Merge order
1. Agent 1 -> main
2. Agent 2 and Agent 3 sync/rebase from main
3. Agent 3 -> main
4. Agent 2 -> main
5. run integration tests/build

Agent 1 merges first because it supplies shared types/data/simulation.

If Agent 2 needs temporary fixtures before Agent 1 is ready, keep them isolated and REMOVE them when integrating the real engine.

## Feature freeze
Once must-haves work:
- no architecture changes
- no new external services
- only low-risk additions

## Optional feature order
1. AI improvement recommendation
2. scenario A/B comparison
3. district metric visualization
4. unexpected event simulation
5. auto-generated presentation

## Final proof
- same scenario twice -> same score
- changed scenario -> changed metrics/score
- overspend -> blocked
- all five decisions required
- AI explanation tied to real calculated values
- missing AI key -> graceful error
- clean install/start
- production build
