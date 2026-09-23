# Аким на 5 часов

## Hackathon Case

HackAlem asks for a city management simulator with a common starting budget and district data, five decisions, a deterministic Astana Quality of Life (AQoL) score, and AI commentary. See [CASE.md](CASE.md) and [ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md).

## Solution

Select one initiative in each of transport, greening, social infrastructure, safety, and city services. The app shows spending, prevents over budget choices, calculates district and city scores, and can request an AI explanation. All values are illustrative.

## Main Demo Scenario

Scenario A selects `transport-bus`, `greening-trees`, `social-clinics`, `safety-lighting`, and `services-water`. It spends 820 million virtual KZT and yields AQoL 64.6, compared with the 53.2 baseline. Save it as scenario A, then use the alternate choices in [DEMO.md](DEMO.md) to compare results. The walkthrough takes about 60–90 seconds.

## Architecture

The Next.js client calls the local simulation engine before showing results. `POST /api/analyze` accepts a `SimulationResult`, rebuilds it from the bundled dataset, rejects any mismatch, and sends only the canonical result to OpenAI. The API key is read on the server. No database or external data service is needed.

## Simulation Model

The bundled [dataset](data/city-demo.json) contains five districts, 15 initiatives, a fixed 1,000 million virtual KZT budget, and district metric effects. Each initiative has a cost and explicit impacts. The simulation adds selected impacts to each district metric, then clamps each metric to 0–100. Cross category effects can be negative. A valid run requires exactly one known initiative per category and total cost at or below the budget. Invalid plans apply no impacts. Budget arithmetic uses integer tenge before returning million KZT values.

## AQoL Formula

The baseline metrics come from `data/city-demo.json`. When every district has a population and the population sum is positive, a category score is `sum(district metric × population) / sum(population)`. Otherwise, each district has equal weight. Overall AQoL is the equal average of the five **unrounded** category scores, rounded once to one decimal. Displayed category scores are rounded separately to one decimal. AQoL change is the difference between rounded projected and baseline overall scores, rounded to one decimal. The same formula scores baseline and projected metrics; identical data and choices produce identical results.

## AI Role

AI explains the calculated scenario: summary, strengths, risks, trade offs, and recommendations. AI does not calculate budget, district metrics, category scores, or AQoL, and cannot change the deterministic result. `POST /api/analyze` uses OpenAI Responses Structured Outputs and checks the returned fields. A missing key, rejected key, provider error, timeout, or malformed response displays an error while the score remains visible. Invalid or outdated scenario input is rejected before a provider request.

## Data

No official hackathon dataset or scoring weights were supplied. **Source:** values authored for this demo. **Normalization:** metric baselines were placed on a 0–100 scale; populations, costs, and initiative effects were chosen as synthetic model assumptions. **Application data:** `data/city-demo.json`, loaded directly by `src/lib/data/index.ts`. No local Downloads folder, import, seed, or generated database is required. District names provide context; populations, baseline metrics, costs, and impacts are not official Astana statistics or forecasts. See [data/README.md](data/README.md).

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, and local JSON data. OpenAI is used only for optional explanation.

## Installation

Install Node.js 24 LTS or Node.js 22.12+ and npm. From a clean machine:

```sh
git clone https://github.com/BAITC-Hacks/hack-aac97b57-qarapaiym.git
cd hack-aac97b57-qarapaiym
npm ci
cp .env.example .env.local
```

PowerShell equivalent: `Copy-Item .env.example .env.local`. `npm install` also works, but `npm ci` uses the committed lockfile for a reproducible install. No database setup is needed.

## Environment Variables

`.env.example` contains variable names and a model ID, never a key. Set `OPENAI_API_KEY` in `.env.local` to enable AI analysis. Obtain an API key from the [OpenAI API dashboard](https://platform.openai.com/api-keys); API billing or credits may be required. `OPENAI_MODEL` defaults to `gpt-5.4-mini` and can be changed to a model that supports Responses Structured Outputs. Without a key, deterministic simulation still runs and AI reports a configuration error. `.env.local` is ignored by Git. Never use a `NEXT_PUBLIC_` prefix for the key. Restart the server after changing environment variables.

## Run

```sh
npm run dev
```

Open <http://localhost:3000>. If port 3000 is occupied, use the URL printed by Next.js. For a production build, run `npm run build` followed by `npm start`.

## Tests

```sh
npm test
npm run typecheck
npm run build
```

All three commands exist in `package.json`. There is no lint script configured. Tests use mocked provider responses for successful output, missing credentials, provider failure, malformed output, and timeout; they do not prove live OpenAI connectivity. A live check requires a valid key, provider access, and a successful AI response in the app.

## Demo Reproduction

Follow [DEMO.md](DEMO.md) for exact choices, expected scores and spending, an over budget example, and the AI failure path. Reload to restore the same initial conditions. Saved A/B comparison lasts for the current page session.

## Project Structure

- `data/` — bundled synthetic dataset and assumptions.
- `src/lib/data/` — dataset loading and validation.
- `src/lib/simulation/` — validation, budget, impacts, and AQoL.
- `src/app/page.tsx` — simulator and comparison interface.
- `src/app/api/analyze/` and `src/lib/ai/` — canonical input check and optional AI explanation.
- `src/**/*.test.ts` — simulation and API boundary tests.
- `docs/ARCHITECTURE_CONTRACT.md` — shared data and API contract.

## Known Limitations

The model uses additive effects for one planning period. It does not model timing, operating costs, interactions, inflation, or causal uncertainty. AI text can be mistaken despite structural validation. The deterministic result tables remain authoritative. A public deployment needs rate limiting and abuse controls before exposing a paid provider endpoint.
