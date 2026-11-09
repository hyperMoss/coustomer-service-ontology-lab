# AI Customer Service Ontology Resources

## Knowledge

- [OntoCare dataset adapter](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/dataset.py)
  Authoritative source for the S1 Pro product ambiguity example, normalized PN and product types.
- [OntoCare knowledge retrieval](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/qa_workflows.py)
  Inspect `cached_answer` and `retrieve` to see PN scope and evidence filtering.
- [OntoCare business routing](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/app.py)
  Application entrypoint and explicit model-vs-decision responsibilities; inspect KBIndex and runtime.
- [OntoCare ontology adapter](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/ontology_catalog.py)
  Shows data import and identity de-duplication rather than formal OWL reasoning.
- [OntoCare architecture overview](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/docs/architecture/system-overview.md)
  Distinguishes implemented Python/JSON rules and business attributions from aspirational diagrams.
- [haike session graph](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/sessions/graph.py)
  The stateful orchestration entrypoint, issue tracking, and pending user actions.
- [haike authorization gate](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/gate.py)
  Five checks on sensitive actions and human fallback.
- [haike independent review](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/review.py)
  A separate evidence-reading judgment before business submission.
- [W3C OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
  Formal ontology fundamentals: classes, individuals, properties, and reasoning; use to distinguish formal semantics from pragmatic JSON rules.
- [mattpocock teach skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/teach/SKILL.md)
  Source for incremental practice, retention, and lesson design.

## Gaps
- No independent production-grade customer-service trial for these two demonstration projects has been checked as part of this course.

## Lesson 02 code-reading anchors

- [OntoCare `resolve_product()`](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/app.py#L159-L193)
  Resolves the S1 Pro ambiguity using explicit choice, SKU, PN, and category cues; returns `CONFLICTED` if it cannot resolve.
- [OntoCare `lookup_order()` and `match_dealer()`](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/app.py#L206-L241)
  Demonstrates order-line identity, date-based warranty decisions and seller+country lookup.
- [OntoCare `allowed_actions()`](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/app.py#L244-L287)
  Central deterministic mapping of state into candidate allowed/forbidden actions and reasons. The program does not execute real refunds.
- [OntoCare `policies.json`](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/data/policies.json)
  Declarative demo settings and risk-level notes; distinguish this policy data from the executed `allowed_actions()` logic.
- [OntoCare customer-reported status handling](https://github.com/hyperMoss/anker-OntoCare/blob/main/OntoCare/app.py#L730-L733)
  On customer expressions of failure, sets `USER_REPORTED_FAILED`, distinct from the `FAILED` branch in `allowed_actions()`.
- [haike authorization registry](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/registry.py)
  Checks sensitive action metadata, required gate checks, and idempotency configuration before execution.

## Lesson 03 code-reading anchors

- [haike `FactCandidate`](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/conversation/interpret.py#L66-L79)
  Structured candidate facts with source quotes, subject, polarity, and timing.
- [haike fact reducer](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/conversation/reduce.py#L257-L405)
  Validates quotes against user input, records supersession and corrections, and excludes negated symptoms from the active symptom list.
- [haike `build_graph()`](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/sessions/graph.py#L3314-L3451)
  Actual LangGraph nodes and conditional routes. Each turn goes from START to END; pending cards are persisted in issue state.
- [haike `AuthorizationGate.check()`](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/gate.py)
  Eligibility, evidence and user confirmation, safety, idempotency, and review must pass before service-order submission.
- [haike `review()`](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/review.py#L104-L255)
  Independent reviewer sees customer messages and order lines only, while checking proposed remedy consistency; note the disabled-model and human-approved branches.
- [haike `ActionExecutor`](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/executor.py)
  Execution authorization, idempotency key, checking prior result before retry, and unknown-outcome handling.
- [haike execution store](https://github.com/hyperMoss/anker-haike/blob/main/orchestrator/app/actions/store.py)
  Identical idempotency keys cannot be reused with changed parameters; Postgres store uses transactional locking.
