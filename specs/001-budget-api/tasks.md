---
description: "Detailed task breakdown for Personal Budget API (001-budget-api)"
---

# Tasks: Personal Budget API

**Input**: Design docs from `specs/001-budget-api/` (spec.md, plan.md, data-model.md, contracts)
**Prerequisites**: Phase 1 and Phase 2 foundation tasks must complete before user-story work begins

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize repo structure and package manifest (`package.json`, `index.js`, `.env.example`) — create project bootstrap files
  - Files: `package.json`, `index.js`, `.env.example`
- [x] T002 [P] Add linting and formatting configs (`.eslintrc.json`, `.prettierrc`)
  - Files: `.eslintrc.json`, `.prettierrc`
- [x] T003 [P] Configure test runner and test projects (Jest + config)
  - Files: `jest.config.cjs`, `tests/`
- [x] T004 [P] Add CI workflow for lint + tests (`.github/workflows/ci.yml`)
  - Files: `.github/workflows/ci.yml`
- [x] T005 Add logger utility and basic bootstrap (`src/lib/logger.js`, `index.js`)
  - Files: `src/lib/logger.js`, `index.js`

---

## Phase 2: Foundational (Blocking prerequisites)

- [x] T006 Create `User` model and schema (Mongoose)
  - Files: `src/models/user.js`
- [x] T007 Create `Transaction` model with idempotency & soft-delete fields
  - Files: `src/models/transaction.js`
- [x] T008 [P] Implement `authService` (register/login with bcrypt + JWT)
  - Files: `src/services/authService.js`
- [x] T009 Implement auth routes and session endpoints (register/login)
  - Files: `src/routes/auth.js`
- [x] T010 Implement authentication middleware (per-request user resolution)
  - Files: `src/middleware/auth.js`
- [x] T011 [P] Implement `transactionService` (create w/ idempotency, list, soft-delete)
  - Files: `src/services/transactionService.js`
- [x] T012 Implement transactions routes (create, list, delete)
  - Files: `src/routes/transactions.js`
- [x] T013 Add integration tests for auth and transactions (Jest + Supertest + mongodb-memory-server)
  - Files: `tests/integration/auth.test.js`, `tests/integration/transactions.test.js`
- [ ] T014 Add unit tests for core services (authService, transactionService)
  - Files: `tests/unit/services/authService.test.js`, `tests/unit/services/transactionService.test.js`
- [ ] T015 Implement centralized request validation (Joi) and error-handling middleware
  - Files: `src/middleware/validation.js`, `src/middleware/errorHandler.js`, update `src/routes/*`
- [ ] T016 Implement token refresh and logout endpoints + tests (session lifecycle)
  - Files: `src/routes/auth.js`, `tests/integration/auth.test.js`
- [ ] T017 Add OpenAPI contract and keep in sync with implemented routes
  - Files: `specs/001-budget-api/contracts/openapi.yaml`
- [ ] T018 Add contract tests for implemented endpoints (transactions, auth)
  - Files: `tests/contract/test_transactions_contract.js`, `tests/contract/test_auth_contract.js`

**Checkpoint**: Foundation must pass CI (lint + unit + integration + contract tests) before starting User Story work.

---

## Phase 3: User Story 1 — Manage transactions (P1) 🎯
Goal: full transaction lifecycle, idempotency, validations, and contract coverage.

- [x] T019 [US1] Create transaction endpoint (idempotent) — implemented
  - Files: `src/routes/transactions.js`, `src/services/transactionService.js`, `src/models/transaction.js`
- [x] T020 [US1] List transactions (paginated basic) — implemented
  - Files: `src/routes/transactions.js`, `src/services/transactionService.js`
- [ ] T021 [US1] Implement update transaction endpoint + tests
  - Files: `src/routes/transactions.js`, `tests/integration/transactions.test.js`
- [ ] T022 [P] [US1] Add Joi validation schemas for transactions and standardize error responses
  - Files: `src/middleware/validation.js`, `src/routes/transactions.js`
- [x] T023 [US1] Soft‑delete behavior (DELETE marks `isDeleted`) — implemented & tested
  - Files: `src/models/transaction.js`, `src/services/transactionService.js`, `tests/integration/transactions.test.js`
- [x] T024 [US1] Idempotency handling for transaction creation — implemented & tested
  - Files: `src/services/transactionService.js`, `tests/integration/transactions.test.js`
- [ ] T025 [US1] Contract tests for `/transactions` (OpenAPI conformance)
  - Files: `tests/contract/test_transactions_contract.js`, `specs/001-budget-api/contracts/openapi.yaml`
- [ ] T026 [US1] Add update and partial-update validations + unit tests for service layer
  - Files: `src/services/transactionService.js`, `tests/unit/services/transactionService.test.js`

Independent test criteria: create → list → update → soft-delete should succeed for authenticated user; idempotent create returns same resource for repeated idempotency key; deleted transactions excluded from list.

---

## Phase 4: User Story 2 — Monthly summary & budgets (P2)
Goal: budgets per category and monthly aggregation with performance targets.

- [ ] T030 [US2] Create `Budget` model (Mongoose) and migration note
  - Files: `src/models/budget.js`, `specs/001-budget-api/data-model.md`
- [ ] T031 [US2] Implement Budget CRUD endpoints + tests
  - Files: `src/routes/budgets.js`, `src/services/budgetService.js`, `tests/integration/budgets.test.js`
- [ ] T032 [US2] Implement `/summaries/monthly` aggregation endpoint and tests (respecting p95 performance requirement)
  - Files: `src/routes/summaries.js`, `src/services/summaryService.js`, `tests/integration/summaries.test.js`, `tests/perf/summary_smoke.test.js`
- [ ] T033 [US2] Add budget progress calculation and unit tests
  - Files: `src/services/summaryService.js`, `tests/unit/services/summaryService.test.js`
- [ ] T034 [US2] Contract tests for summary & budget endpoints
  - Files: `tests/contract/test_summaries_contract.js`, `specs/001-budget-api/contracts/openapi.yaml`

Independent test criteria: monthly summary returns totals and category breakdown; budget progress computed accurately against transactions.

---

## Phase 5: User Story 3 — Categories, recurring transactions & export (P3)
Goal: category management, recurring flows, and export capability.

- [ ] T040 [US3] Create `Category` model + CRUD endpoints and tests
  - Files: `src/models/category.js`, `src/routes/categories.js`, `tests/integration/categories.test.js`
- [ ] T041 [US3] Design & implement recurring transaction model/metadata and recurrence handling (unit tests)
  - Files: `src/models/recurring.js`, `src/services/recurringService.js`, `tests/unit/services/recurringService.test.js`
- [ ] T042 [US3] Implement export endpoint (JSON/CSV) + tests and contract tests
  - Files: `src/routes/export.js`, `src/services/exportService.js`, `tests/integration/export.test.js`, `tests/contract/test_export_contract.js`
- [ ] T043 [US3] Ensure historical category labels preserved when categories deleted (data migration/logic)
  - Files: `src/services/transactionService.js`, `tests/integration/transactions.test.js`

Independent test criteria: category CRUD works; recurring transactions surface correctly; export returns only user's transactions in requested format.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T050 Security hardening: add rate limiting for auth endpoints; add dependency/secret scanning in CI
  - Files: `.github/workflows/ci.yml`, `src/middleware/rateLimit.js`
- [ ] T051 Observability: add basic request metrics and latency histograms + expose `/metrics`
  - Files: `src/lib/metrics.js`, `src/index.js`
- [ ] T052 Documentation: auto-generate OpenAPI docs and add usage examples to `README.md`
  - Files: `specs/001-budget-api/contracts/openapi.yaml`, `README.md`
- [ ] T053 Testing: increase unit test coverage and add contract tests for all public endpoints
  - Files: `tests/unit/`, `tests/contract/`
- [ ] T054 Release: prepare CHANGELOG entry and open PR for `001-budget-api` → `main`
  - Files: `CHANGELOG.md`, GitHub PR

---

## Dependencies & Execution Order
1. Phase 1 (Setup) → Phase 2 (Foundational) are blocking.
2. User Story phases (Phase 3+) depend on completion of Foundational tasks — once foundation passes CI, stories can proceed in parallel by different contributors.
3. Contract tests and performance smoke tests must pass before merge.

## Parallel execution examples
- Team A: `T014 T016` (unit tests + validation middleware) in parallel
- Team B: `T030 T040` (Budget and Category models/endpoints) in parallel

## Implementation strategy
1. MVP (deliver US1 fully): finish Phase 1 + Phase 2 + US1 (T001–T026). Stop and validate.
2. Incrementally add US2 then US3 with contract tests and performance checks.

---

## Status summary (current)
- Foundation (auth + transactions): implemented & integration-tested ✅
- Pending high-priority: token refresh/logout (T016), validation middleware (T015), unit tests (T014), contract tests (T018/T025)

---

If you want, I can start implementing the highest-priority remaining tasks (token refresh + unit tests) next — tell me to proceed (A) or pick a different task.
