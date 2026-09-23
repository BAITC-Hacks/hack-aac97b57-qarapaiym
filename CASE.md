# HackAlem Acceptance Tests

These tests define what "done" means.

## AT-01 — Main End-to-End Scenario
GIVEN:
[exact initial state]

WHEN:
[exact user action]

THEN:
[exact expected result]

AND:
[required state change]

---

## AT-02 — Core Logic Is Real
Change an important input value.

The application output must change accordingly.

The expected result must not be hardcoded or pre-generated.

---

## AT-03 — AI Integration
GIVEN valid input

WHEN the AI step executes

THEN a real provider call is performed

AND its response is parsed and validated

AND the result affects the application workflow.

---

## AT-04 — State Change
WHEN the user approves/confirms the generated action

THEN application state must actually change

AND the updated state must be visible.

---

## AT-05 — Invalid Input
GIVEN obviously invalid input

WHEN submitted

THEN the application shows a useful error

AND does not crash.

---

## AT-06 — API Failure
GIVEN the AI provider returns an error or invalid response

THEN the application handles the problem gracefully

AND shows a useful message.

---

## AT-07 — Missing Environment
If required environment variables are missing,
the application must report what is missing clearly.

---

## AT-08 — Build
The production build must succeed.

---

## AT-09 — Clean Start
Following only README.md from a fresh clone must be sufficient to start the project.
