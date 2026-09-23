# Prompt — Final Submission Audit

Use near the end.

```text
STOP FEATURE DEVELOPMENT.

Perform a final HackAlem submission audit.

The project is scored on:

1. Case compliance/functionality — 20
2. Technical implementation — 25
3. README/documentation — 20
4. Reproducibility/run readiness — 20
5. Reliability/basic security — 15

Do not add features.

Inspect only for point-losing problems.

Verify:
- every mandatory CASE.md requirement
- every ACCEPTANCE_TESTS.md requirement
- core scenario end-to-end
- no mocked core behavior
- no hardcoded expected result
- state-changing actions genuinely change state
- invalid input handling
- API error handling
- structured model response validation
- server-side secrets
- .env.example
- .gitignore
- deterministic demo data
- database setup/reset if applicable
- README correctness
- install command
- tests
- production build

Return:

CRITICAL ISSUES
HIGH ISSUES
SAFE TO SUBMIT

Fix only CRITICAL and HIGH issues.

Do not refactor functioning code.
```
