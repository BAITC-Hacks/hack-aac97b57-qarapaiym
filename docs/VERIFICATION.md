# Verification record

## Release audit after documentation and model-default update

The earlier results below describe a separate clean checkout before the current documentation and model-default changes. In the current workspace, `npm test`, `npm run typecheck`, and `npm run build` could not start because `npm` and Node.js are unavailable on `PATH` or in the standard Windows installation locations. The current revision therefore has no fresh test, typecheck, build, or clean-clone pass. Run the three commands from the README on a machine with Node.js before marking this release verified. The OpenAI model change has not been verified with a live provider response.

Verified on 2026-09-23 with Windows, Node.js 24.12.0, npm 11.6.2.

## Fresh checkout

A separate local clone passed `npm ci`, all 20 tests, `npm run typecheck`, and `npm run build`. The install reported zero known dependency vulnerabilities. Production routes are `/` and `/api/analyze`.

## Browser checks against production server

- Empty plan: 1,000 million KZT available, AQoL 53.2, submit disabled.
- Scenario A from README: 820 spent, 180 remaining, score 64.6, delta +11.4.
- Scenario B from README: 650 spent, 350 remaining, score 64.0, delta +10.8.
- Saved A/B comparison displays score difference -0.6 and spending difference -170.
- Changing an initiative clears the old result and AI explanation.
- An expensive replacement is disabled with “Over budget”; the valid 910-million plan remains intact.
- Missing API key returns a clear configuration error while preserving computed results.
- Reset restores empty choices, full budget, and disabled submission. Reload restores the fixed starting state.
- At a 375-pixel viewport, choices stack and the document has no horizontal overflow. Normal viewport restored after testing.

## Engine and API evidence

The permanent tests cover repeatability, data immutability, all five required categories, unknown and mismatched IDs, exact money arithmetic, overspend, clamping, population weighting, final-score rounding, malformed datasets, tampered API results, structured provider success, malformed/refused/incomplete outputs, missing credentials, and timeout.

An additional exhaustive inspection of the bundled data checked all 243 possible plans: 199 are feasible and 44 exceed budget. Feasible AQoL ranges from 60.4 to 67.0.

## Unverified / limitations

No real OpenAI API key was configured. Provider success was verified with mocked responses, not a live paid call. Synthetic data is explicitly labeled throughout; replacing it with official supplied datasets remains future work because no such datasets were included. AI recommendations are advisory and are not automatically applied. A public deployment needs rate limiting before exposing the paid endpoint.
