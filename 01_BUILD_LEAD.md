# Prompt — Parallel Read-Only Reviewers

Run after the critical path works.

```text
Spawn three independent read-only reviewers in parallel.

Do not let them edit application files.

Reviewer 1 — Case Compliance

Read CASE.md and ACCEPTANCE_TESTS.md.
Inspect the current implementation.
Assume the project fails the requirements.
Find concrete requirements that are missing, incomplete, mocked, hardcoded, or not connected end-to-end.

Reviewer 2 — Reliability and Security

Assume the application contains reliability/security problems.

Check:
- malformed input
- API failure handling
- model-output validation
- exposed secrets
- unsafe server/client boundaries
- crashes
- missing states
- persistence errors

Reviewer 3 — Simplicity

Assume the implementation is unnecessarily complex.

Find:
- unused dependencies
- unnecessary abstractions
- duplicated logic
- dead code
- unnecessary services
- features outside CASE.md
- anything that creates failure risk without improving the scored scenario

All reviewers must return:
- severity
- file/location
- problem
- evidence
- recommended fix

Wait for all three.

Merge the findings into one prioritized list.

Fix only confirmed findings that improve:
- case compliance
- reliability
- reproducibility
- maintainability

Do not begin a major rewrite.
```
