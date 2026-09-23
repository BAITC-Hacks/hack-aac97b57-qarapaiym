# HackAlem Agent Rules

## Objective
Build the smallest complete solution that satisfies the official HackAlem case.

The final deliverable is a public GitHub repository.
Deployment is NOT required.
The repository MUST be runnable from a clean environment.

## Judging Priorities
1. Case compliance and functionality — 20
2. Technical implementation — 25
3. README and technical documentation — 20
4. Reproducibility and run readiness — 20
5. Basic reliability and security — 15

## Priority Order
1. Official case requirements
2. Complete end-to-end core scenario
3. Real technical implementation
4. Acceptance tests
5. Reproducibility
6. Reliability and security
7. README/documentation
8. UI polish
9. Optional features

## Core Rules
- Never fake core functionality.
- Never hardcode expected AI answers.
- Never create fake buttons or simulated success states.
- Prefer deterministic code for deterministic tasks.
- Use AI only where reasoning, interpretation, planning, classification, extraction, or generation is actually required.
- Keep the architecture simple.
- Avoid unnecessary services and dependencies.
- Do not add optional features until the critical path works.
- Make surgical changes instead of broad rewrites.
- Delete wrong implementations instead of leaving dead alternatives.

## Agentic Product Rule
Prefer a small number of meaningful stages:

INPUT
→ ANALYZE
→ DECIDE / PLAN
→ ACT
→ VERIFY

Avoid artificial multi-agent chains that only forward text.

## Data and Persistence
- Use local/demo data unless the case requires external data.
- Prefer SQLite/local persistence if persistence is needed.
- Commit schema, seed scripts, and deterministic demo data.
- Do not commit generated database files.
- Avoid cloud databases unless the case genuinely requires them.

## Secrets
Never commit:
- .env
- .env.local
- API keys
- tokens
- credentials

Use server-side environment variables only.

## Verification
After meaningful changes:
1. run relevant tests
2. run type checking
3. run linting if configured
4. verify the affected user flow

Do not weaken a valid failing test just to make it pass.

## Subagents
The primary agent owns implementation.

Use read-only subagents mainly for:
- case compliance review
- security/reliability review
- simplicity review

Do not allow multiple agents to make overlapping changes to core application files at the same time.

Reviewer findings should include:
- severity
- file/location
- problem
- evidence
- recommended fix

## Feature Freeze
Around 3h15m into the hackathon:
- stop adding features
- focus on bugs
- acceptance tests
- README
- reproducibility
- final GitHub readiness

## Definition of Done
The project is done only when:
- mandatory case requirements work
- primary scenario works end-to-end
- core behavior is real, not mocked
- acceptance tests pass
- obvious invalid inputs are handled
- AI/API failures are handled
- secrets remain server-side
- .env.example exists
- README is accurate
- clean installation instructions exist
- production build succeeds
