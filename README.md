# Аким на 5 часов

A HackAlem city-management simulator: start with a fixed virtual budget and synthetic Astana district metrics, make five decisions, and compare deterministic quality-of-life results. AI explains the result; code calculates the score.

## Run locally

Install Node.js 24 LTS (or Node.js 22.12+) and npm. From a fresh clone:
    
```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell also supports `Copy-Item .env.example .env.local`. Open http://localhost:3000. Set `OPENAI_API_KEY` in `.env.local` to enable real analysis. `OPENAI_MODEL` defaults to `gpt-4.1` and must support Structured Outputs on the Responses API. Restart the server after editing environment settings. The API key is server-only; never prefix it with `NEXT_PUBLIC_`. Without a key the simulator works, and AI analysis reports a configuration error.

Stop the development server with Ctrl+C before the production checks below (or use a separate port).

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

Category scores are population-weighted district averages when every population is present and their sum is positive; otherwise districts have equal weight. AQoL is the equal average of five unrounded category scores, then rounded to one decimal. Displayed category scores are also rounded to one decimal. The baseline and projection share the same formula. The engine owns all calculations before an AI call.

## AI endpoint

`POST /api/analyze` accepts the exact `SimulationResult` from the architecture contract and returns summary, strengths, risks, tradeoffs and categorized recommendations. The server derives selections from initiative IDs, recomputes the result using its local dataset, and rejects tampered or outdated metrics before contacting the model.

The integration uses the [OpenAI Responses Structured Outputs format](https://developers.openai.com/api/docs/guides/structured-outputs), with `text.format`, `json_schema`, and `strict: true`. The request sets `store: false`. Runtime checks reject empty fields, extra fields, invalid categories, refusals, incomplete responses and malformed JSON. A server-only evidence block must match the canonical budget, AQoL, selected IDs, highest/lowest category and largest gain. These checks validate the evidence block, not every claim in free-form prose. The prompt requests Russian explanations grounded in the supplied effects and restricts recommendations to reviewing selected initiatives. Requests abort after 25 seconds; input and output bodies are bounded. No fabricated fallback is presented on failure; deterministic results remain available.

## Judge demo

1. Open the app; note the starting budget and baseline.
2. Attempt submission with a missing category: it must be blocked.
3. Select Scenario A using the visible names in the table below (820 million virtual KZT). Press “Рассчитать сценарий”: AQoL is 64.6, up 11.4 from baseline 53.2. Press “Сохранить как сценарий A”.
4. AI analysis starts automatically when the scenario is calculated. With a configured key, inspect its strengths, risks, trade-offs and recommendations. Without a key, verify the clear error while the calculated score remains visible; “Повторить объяснение” retries analysis.
5. Select Scenario B using the table (650 million). Press “Рассчитать сценарий” again: AQoL is 64.0, up 10.8. The comparison shows lower spending and stronger greening alongside lower scores in other categories. Saved comparisons last only for the current page session.
6. Try an expensive combination: overspend must be blocked. Reload to verify the same initial conditions.

| Direction | Scenario A: visible name (ID) | Scenario B: visible name (ID) |
|---|---|---|
| Транспорт | Выделенные полосы для автобусов (`transport-bus`) | Безопасные перекрёстки (`transport-junctions`) |
| Озеленение | Деревья вдоль улиц (`greening-trees`) | Связная сеть парков (`greening-parks`) |
| Социальная инфраструктура | Районные поликлиники (`social-clinics`) | Мобильная помощь жителям (`social-outreach`) |
| Безопасность | Освещение и безопасные маршруты (`safety-lighting`) | Районные команды безопасности (`safety-community`) |
| Городские сервисы | Обновление водопровода и сетей (`services-water`) | Уборка улиц и переработка (`services-waste`) |

Automated tests cover engine behavior and the API integration boundary using mocked provider responses: structured success, tampered inputs, missing key, bad output and timeout. Live AI success additionally requires a real API key; mock success does not prove provider availability. See `ACCEPTANCE_TESTS.md` for the full checklist.

## Limitations

The model uses additive effects over a single turn. It does not simulate implementation timing, operating costs, interactions, inflation or causal uncertainty. AI prose can still be mistaken despite schema validation; deterministic result tables remain authoritative. A public deployment would additionally need rate limiting and abuse controls to protect provider spend.
