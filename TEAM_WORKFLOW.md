# HackAlem implementation workflow

The active case is “Аким на 5 часов”. Read `CASE.md`, `docs/ARCHITECTURE_CONTRACT.md`, and `ACCEPTANCE_TESTS.md` together. The numbered legacy lead documents describe the original generic planning process; the case-specific prompts below define current ownership.

| Branch | Role | Owned files |
| --- | --- | --- |
| `simulation` | Agent 1: deterministic engine | `src/types/city.ts`, `src/lib/data/`, `src/lib/simulation/`, `data/`, simulation tests |
| `ui` | Agent 2: interface and visualizations | `src/app/page.tsx`, `src/app/globals.css`, `src/components/`, UI hooks |
| `ai-docs` | Agent 3: AI and reproducibility | `src/app/api/analyze/`, `src/lib/ai/`, AI tests, `README.md`, `.env.example` |

Each agent works in its own Git worktree. Shared scaffold and dependency changes belong to the integration lead. See the matching `prompts/AGENT_*.md` and `MERGE_FLOW.md`.

Merge the engine first, sync the AI and UI branches with main, then merge AI followed by UI. Run `npm test`, `npm run typecheck`, and `npm run build`, and exercise the complete interface. Never replace computed scores with model output or leave UI fixtures in the simulation path.
