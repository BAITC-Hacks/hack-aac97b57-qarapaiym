# CASE — «Аким на 5 часов»

## Goal
Build an AI city-management simulator where all users start with the same fixed budget and same synthetic district data, make 5 decisions, and receive an Astana Quality of Life Score plus AI analysis.

## Mandatory categories
- transport
- greening
- social infrastructure
- safety
- city services

## Must-have
- fixed virtual budget
- one decision in each of 5 categories
- budget overrun prevention
- AI analysis
- deterministic Astana Quality of Life Score
- strengths, risks, trade-offs and consequences
- changing decisions changes the result

## Core rule
The score is calculated by deterministic code, NOT by the LLM.
AI only explains the already-calculated scenario.

## Main judge scenario
1. Open app and see fixed budget + baseline.
2. Select one initiative per category.
3. Budget updates live.
4. Overspend is blocked.
5. Submit valid scenario.
6. Simulation calculates before/after metrics and AQoL.
7. AI explains strengths, risks, trade-offs and recommendations.
8. Change a decision and rerun.
9. Score/metrics change.

## Out of scope until MVP is complete
- auth
- cloud DB
- multiplayer
- real-time external APIs
- complex maps
- slide generation
