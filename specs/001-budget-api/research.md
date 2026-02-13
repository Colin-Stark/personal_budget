# research.md — Personal Budget API (Phase 0)

**Feature**: Personal Budget API
**Date**: 2026-02-12

## Summary of resolved clarifications
- Authentication: Email/password + JWT selected.
- Testing stack: Jest + Supertest; use mongodb-memory-server for CI integration tests.
- DB access: Mongoose ODM for schema validation and queries.
- Validation: Joi for request validation and input sanitization.
- Idempotency: Support client-provided idempotency key for create-transaction endpoint.
- Observability: Winston structured logging + basic Prometheus-style metrics (request counts, latency histograms).

---

## Decision log

### Decision: Authentication — Email/password + JWT
- Rationale: Simple to implement and test; keeps full control of auth flow for early MVP; aligns with per-user isolation requirement.
- Alternatives considered: OAuth (delegates credential handling — more complex/integration work); single-user/no-auth (too limited for multi-user product).

### Decision: DB & ODM — MongoDB + Mongoose
- Rationale: Repo already lists `mongoose` as dependency; flexible document model suits transactions, categories, and budgets; Mongoose offers schema validation and middleware useful for soft deletes and audit fields.
- Alternatives considered: SQL (Postgres) — stronger relational guarantees but higher migration cost given current dependency choices.

### Decision: Testing — Jest + Supertest + mongodb-memory-server
- Rationale: Widely used in Node ecosystem; Supertest simplifies API integration tests; in-memory MongoDB keeps CI fast and deterministic.
- Alternatives considered: Mocha/Chai (similar but Jest preferred for built-in assertions & runner).

### Decision: Validation & Security — Joi + input sanitization
- Rationale: Explicit validation reduces security surface and ensures consistent error payloads.

### Decision: Idempotency for Transaction Creation
- Rationale: Avoid duplicate transactions when clients retry; implement via optional client-provided idempotency-key stored with transaction or dedupe based on (timestamp, amount, account, description) when no key present.

### Decision: API Contract — OpenAPI (YAML)
- Rationale: Provides a machine-readable contract for clients; supports contract tests and auto-generated API docs.

---

## Research tasks produced
- Task: "Auth: implement and test email/password + JWT flows (register, login, refresh, logout)"  
- Task: "DB model design: transactions, accounts, categories, budgets — propose fields and indexes"  
- Task: "Testing: create Jest + Supertest scaffold with mongodb-memory-server in CI"  
- Task: "API contracts: author OpenAPI document for CRUD, summaries, export endpoints"  
- Task: "Security: design input validation rules, rate-limiting for auth endpoints"  

---

## Alternatives & trade-offs (short)
- OAuth would reduce password handling but increases external dependencies and test complexity; postpone to later phase.
- SQL would improve complex reporting queries; however document model simplifies early prototyping and maps naturally to transaction documents.

---

## Conclusion / Recommendation
Proceed with Node.js + Express + Mongoose stack, using email/password + JWT for authentication. Implement TDD with Jest + Supertest and add OpenAPI contracts before implementation. Ensure CI enforces lint, tests, and dependency/security scans.
