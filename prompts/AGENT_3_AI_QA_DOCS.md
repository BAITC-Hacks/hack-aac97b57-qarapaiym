# Agent 3 — AI Analyst + QA + Reproducibility Owner

Read:
- CASE.md
- docs/ARCHITECTURE_CONTRACT.md
- ACCEPTANCE_TESTS.md

Do NOT rewrite simulation or main UI.

## Owned files
- `src/app/api/analyze/**`
- `src/lib/ai/**`
- AI/API tests
- `README.md`
- `.env.example`
- secret-related `.gitignore` updates

## AI endpoint
Implement `POST /api/analyze`.

Input: validated `SimulationResult`.

The AI receives:
- budget total/spent/remaining
- selected initiatives
- baseline category values
- projected category values
- baseline/projected score
- useful district deltas

The AI does NOT recalculate AQoL.

Return structured JSON:
```json
{
  "summary": "...",
  "strengths": ["..."],
  "risks": ["..."],
  "tradeoffs": ["..."],
  "recommendations": [
    {
      "title": "...",
      "rationale": "...",
      "category": "transport"
    }
  ]
}
```

## AI rules
- use only supplied scenario facts
- do not invent city facts
- explain trade-offs
- mention weak/strong metrics
- recommendations must fit official categories
- never override score
- validate structured output

Malformed AI output:
- controlled error
- no crash
- no fake fallback analysis

Missing API key:
- clear configuration error

## README
Document:
- task
- solution
- architecture
- deterministic score vs AI explanation
- data/assumptions
- setup
- env vars
- run
- tests
- exact demo steps
- score formula
- limitations

## QA after merges
- overspend
- missing category
- two scenarios -> changed result
- AI failure preserves deterministic result
- production build
- clean-clone instructions

## Optional after MVP
AI improvement recommendation.

## Finish message
AI/REPRO READY
- endpoint:
- env vars:
- test command:
- README status:
- remaining acceptance failures:
