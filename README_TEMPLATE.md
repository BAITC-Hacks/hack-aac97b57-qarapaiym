# Feature Backlog

Brainstorm freely here while the main Codex agent builds.

Do NOT interrupt the primary build with every idea.

## Candidate Template

### Feature
[Name]

### User Value
What problem does it solve?

### Demo Value
What will judges visibly see?

### Case Relevance
Which official requirement does it strengthen?

### Implementation
What is the smallest implementation?

### Estimated Codex Time
10 / 20 / 30 / 60+ min

### Risk
Low / Medium / High

### Dependencies
- new API?
- new package?
- DB change?
- external service?

### Score Impact
Potentially improves:
- Functionality
- Technical implementation
- README/reproducibility
- Reliability

### Decision
BACKLOG / BUILD / REJECT

---

## Feature Selection Rule

Prefer features that:
- directly strengthen the official case
- are demo-visible
- take <= 30 minutes
- reuse the current architecture
- require no new infrastructure
- create a real action/state change
- are technically verifiable

Reject features that:
- only add visual polish
- require large architecture changes
- require unavailable data
- introduce new cloud services
- risk breaking the working core flow
