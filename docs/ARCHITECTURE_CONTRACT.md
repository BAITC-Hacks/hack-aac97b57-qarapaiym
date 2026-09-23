# Architecture Contract

## Stack
- Next.js + TypeScript
- Tailwind
- local JSON/CSV data
- OpenAI API for explanation/recommendation
- no DB for MVP unless truly required

## Shared categories

```ts
export type Category =
  | "transport"
  | "greening"
  | "social"
  | "safety"
  | "services";
```

## Shared types

```ts
export interface District {
  id: string;
  name: string;
  population?: number;
  metrics: Record<Category, number>;
}

export interface Impact {
  districtId: string;
  metric: Category;
  delta: number;
}

export interface Initiative {
  id: string;
  category: Category;
  name: string;
  description?: string;
  cost: number;
  impacts: Impact[];
}

export interface CityDataset {
  budget: number;
  districts: District[];
  initiatives: Initiative[];
}

export type ScenarioSelection = Record<Category, string>;

export interface ScoreSnapshot {
  overall: number;
  byCategory: Record<Category, number>;
  districts: Array<{
    districtId: string;
    metrics: Record<Category, number>;
  }>;
}

export interface SimulationResult {
  valid: boolean;
  validationErrors: string[];
  budget: {
    total: number;
    spent: number;
    remaining: number;
    exceeded: boolean;
  };
  selectedInitiatives: Initiative[];
  baseline: ScoreSnapshot;
  projected: ScoreSnapshot;
  delta: number;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendations: Array<{
    title: string;
    rationale: string;
    category?: Category;
  }>;
}
```

## Required simulation function

```ts
simulateScenario(
  dataset: CityDataset,
  selection: ScenarioSelection
): SimulationResult
```

It must:
- require one initiative from each category
- reject unknown IDs
- reject category mismatch
- reject overspend
- apply impacts
- clamp metrics to 0..100
- be deterministic

## AQoL formula
If the provided dataset defines official weights/formula, use that.

Otherwise:
1. category score = population-weighted district average if population exists
2. otherwise equal district weighting
3. AQoL = equal average of the 5 category scores
4. round to 1 decimal

The LLM never calculates the score.

## AI API

`POST /api/analyze`

Input: `SimulationResult`

Output:
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

## File ownership
Agent 1:
- `src/types/city.ts`
- `src/lib/data/**`
- `src/lib/simulation/**`
- `data/**`
- simulation tests

Agent 2:
- `src/app/page.tsx`
- `src/components/**`
- UI styles
- optional localStorage comparison

Agent 3:
- `src/app/api/analyze/**`
- `src/lib/ai/**`
- AI/API tests
- README
- `.env.example`
- reproducibility docs
