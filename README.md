# Аким на 5 часов

A HackAlem city-management simulator: start with a fixed virtual budget and synthetic Astana district metrics, make five decisions, and compare deterministic quality-of-life results. AI explains the result; code calculates the score.

## Run locally

Install Node.js 22 LTS and npm. From a fresh clone:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell also supports `Copy-Item .env.example .env.local`. Open http://localhost:3000. Set `OPENAI_API_KEY` in `.env.local` to enable real analysis. `OPENAI_MODEL` defaults to `gpt-4o-mini` and must support Structured Outputs on the Responses API. The API key is server-only; never prefix it with `NEXT_PUBLIC_`. Without a key the simulator works, and AI analysis reports a configuration error.

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build. No database, seed command or external data service is needed. AI requires server access to `api.openai.com` and a funded API account.

## Architecture and assumptions

- `src/types/city.ts`: shared types and categories.
- `data/` and `src/lib/data/`: fixed local synthetic dataset.
- `src/lib/simulation/`: pure validation, budget, impacts and score arithmetic.
- `src/app/page.tsx` and `src/components/`: decision and comparison interface.
- `src/app/api/analyze/route.ts`: server-side canonical scenario validation.
- `src/lib/ai/`: Responses request, structured-output checks and controlled errors.

No official dataset was supplied. Baselines, populations, costs and effects are invented demonstration values, not official Astana statistics or procurement estimates. The budget is 1,000 million virtual KZT. District names provide context only. The index is an illustrative teaching model, not a real-world prediction.

## Deterministic score

Exactly one initiative is required for each category: transport, greening, social, safety and services. Unknown IDs, category mismatch, missing choices and overspend are invalid. Costs are summed against the fixed budget. Effects are added to district metrics and clamped to 0–100.

Category scores are population-weighted district averages when all district populations are usable; otherwise districts have equal weight. AQoL is the equal average of five category scores, rounded to one decimal. The baseline and projection share the same formula. The engine owns all calculations before an AI call.

## AI endpoint

`POST /api/analyze` accepts the exact `SimulationResult` from the architecture contract and returns summary, strengths, risks, tradeoffs and categorized recommendations. The server derives selections from initiative IDs, recomputes the result using its local dataset, and rejects tampered or outdated metrics before contacting the model.

The integration uses the [OpenAI Responses Structured Outputs format](https://developers.openai.com/api/docs/guides/structured-outputs), with `text.format`, `json_schema`, and `strict: true`. The request sets `store: false`. Runtime checks reject empty fields, extra fields, invalid categories, refusals, incomplete responses and malformed JSON. Requests abort after 25 seconds; input and output bodies are bounded. No fabricated fallback is presented on failure; deterministic results remain available.

## Judge demo

1. Open the app; note the starting budget and baseline.
2. Attempt submission with a missing category: it must be blocked.
3. Scenario A: choose `transport-bus`, `greening-trees`, `social-clinics`, `safety-lighting`, `services-water` (820 million virtual KZT). Run and record score/category metrics.
4. Request AI analysis with a configured key. Without a key verify the clear error while the calculated score remains visible.
5. Scenario B: choose `transport-junctions`, `greening-parks`, `social-outreach`, `safety-community`, `services-waste` (650 million). Rerun and compare different scores and metrics.
6. Try an expensive combination: overspend must be blocked. Reload to verify the same initial conditions.

Automated tests cover engine behavior and the API integration boundary using mocked provider responses: structured success, tampered inputs, missing key, bad output and timeout. Live AI success additionally requires a real API key; mock success does not prove provider availability. See `ACCEPTANCE_TESTS.md` for the full checklist.

## Limitations

The model uses additive effects over a single turn. It does not simulate implementation timing, operating costs, interactions, inflation or causal uncertainty. AI prose can still be mistaken despite schema validation; deterministic result tables remain authoritative. A public deployment would additionally need rate limiting and abuse controls to protect provider spend.
