# Agent 2 — Simulator UI + Visualization Owner

Read:
- CASE.md
- docs/ARCHITECTURE_CONTRACT.md
- ACCEPTANCE_TESTS.md

Do NOT rewrite the score engine.
Do NOT implement the OpenAI backend.

## Owned files
- `src/app/page.tsx`
- `src/components/**`
- UI-specific styles
- optional `src/hooks/**`

## Main flow
Build a single clear simulator experience:

1. Header
   - title
   - fixed budget
   - spent
   - remaining

2. Baseline
   - baseline AQoL
   - five category indicators

3. Five decision sections
   - Transport
   - Greening
   - Social
   - Safety
   - Services

Each initiative shows:
- name
- short description
- cost
- select action

Exactly five unique measures; at most two per category. District measures require a district; city measures have no district. Follow docs/OFFICIAL_CASE.md.

4. Budget behavior
   - live spent/remaining
   - prevent/clearly block overspend

5. Simulate
   - call deterministic `simulateScenario`
   - show deterministic result immediately
   - call `/api/analyze` after valid result

6. Results
   - large AQoL score
   - delta from baseline
   - before/after five-category values
   - district changes if easy
   - AI strengths
   - risks
   - trade-offs
   - recommendations

## UX priority
Judge understands the product in under 60 seconds.

Prefer:
- budget progress
- five category cards
- simple before/after bars
- clear positive/negative deltas

Avoid:
- auth
- settings
- complex navigation
- risky animations
- maps without real geometry

## Required states
- missing selection
- overspend
- validation error
- AI loading
- AI failure while keeping deterministic result
- reset scenario

## Optional only after MVP
Scenario A/B comparison via localStorage/local state.

## Finish message
UI READY
- route:
- main scenario:
- result components:
- known issues:
