# Feature Specification: Personal Budget API

**Feature Branch**: `001-budget-api`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: User description: "I want to build an API for a personal budget tracker"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage transactions (Priority: P1)
Users can create, read, update and delete personal financial transactions (income and expense) and assign them to categories and accounts.

**Why this priority**: Core value — tracking transactions is the essential capability of a budget tracker and is required for all downstream reports and budgets.

**Independent Test**: Make authenticated API calls to create, list, update and delete transactions for a user; verify persistence, validation and per-user isolation.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an empty account, **When** they submit a valid transaction (date, amount, category), **Then** the API returns 201 and the transaction appears in the user's transaction list.
2. **Given** an existing transaction, **When** the user updates the amount or category, **Then** the API returns 200 and subsequent GET returns the updated values.
3. **Given** a user A and a user B, **When** user B requests user A's transactions, **Then** the API returns 403/empty (data isolation enforced).

---

### User Story 2 - Monthly summary & budgets (Priority: P2)
Users can request monthly summaries (total spent, total income, net balance) and set monthly budget targets per category; the API reports progress vs. budget.

**Why this priority**: Summaries provide actionable insights and are the main interface for budgeting decisions.

**Independent Test**: Insert transactions across categories and a monthly budget; call the summary endpoint and verify totals, category breakdown, and budget progress percentages.

**Acceptance Scenarios**:

1. **Given** a set of transactions in March, **When** the user requests March summary, **Then** the API returns totals grouped by category and an overall net balance.
2. **Given** a monthly budget set for "Groceries", **When** the user requests the budget progress mid‑month, **Then** the API returns the percent used and an indicator if the budget is exceeded.

---

### User Story 3 - Categories, recurring transactions & export (Priority: P3)
Users can manage categories, create recurring transactions, and export transaction lists for a date range.

**Why this priority**: Improves usability and enables common budgeting workflows (recurring bills, category management, offline analysis).

**Independent Test**: Create categories and a recurring transaction; verify recurrence metadata and export endpoint returns CSV/JSON payload for the requested range.

**Acceptance Scenarios**:

1. **Given** a recurring rent transaction, **When** the user requests transactions for the next 3 months, **Then** recurring occurrences appear as scheduled (or are materialized by the client) with correct dates and amounts.
2. **Given** a list of transactions and a date range, **When** the user calls export, **Then** the response returns a downloadable file containing only that user's transactions for the range.

---

### Edge Cases
- Duplicate transaction submissions (idempotency): client may retry — API should detect duplicates by client-generated idempotency key or exact match on (timestamp, amount, account, description).
- Negative amounts or zero-value transactions — validation rules must be explicit and documented.
- Deleted category used by historical transactions — historical records must retain original category label even if category is removed.
- Large date-range summaries — endpoints must limit processing or paginate results to avoid timeouts.

## Requirements *(mandatory)*

> Constitution compliance: every feature spec MUST include acceptance criteria and tests that demonstrate compliance with the constitution's principles (code quality, testing, security, UX consistency, performance). If a principle is intentionally NOT APPLICABLE, the spec MUST justify and document the exception.

### Functional Requirements
- **FR-001**: The API MUST allow authenticated users to create, read, update and delete transactions with fields: amount, currency, date, category, account, description, and optional metadata.
- **FR-002**: The API MUST provide CRUD endpoints for categories and budgets; budgets support monthly target and per-category association.
- **FR-003**: The API MUST provide a monthly summary endpoint that returns totals, per-category breakdown, and budget progress for the requested interval.
- **FR-004**: The API MUST enforce per-user data isolation (users cannot access other users' data).
- **FR-005**: The API MUST validate inputs and return clear, consistent error objects for client errors (400), unauthorized (401/403), and server errors (5xx).
- **FR-006**: The API MUST support idempotent transaction creation to handle retries (prefer `Idempotency-Key` header or optional `idempotencyKey` in body). Server MUST reject conflicting duplicate requests and return the original resource when a previously-seen idempotency key is reused.
- **FR-007**: The API MUST support export of transactions for a date range in `application/json` and `text/csv` formats.

- **FR-008**: Authentication and user model: The API WILL require authentication using email/password with JWTs. Passwords MUST be stored as bcrypt hashes; provide register, login (JWT issuance), and token-refresh endpoints. All user-scoped endpoints MUST enforce per-user isolation and return 401/403 appropriately.

### Key Entities *(include if feature involves data)*
- **User**: owner of accounts, budgets and transactions (attributes: user_id, email, display_name — authentication details are intentionally omitted here).
- **Account**: user-owned ledger (e.g., "Checking", "Cash") with starting balance and optional currency.
- **Transaction**: atomic financial record (id, account_id, user_id, date, amount, currency, category_id, description, metadata).
- **Category**: user-defined label for grouping transactions (id, user_id, name, type[expense|income], parent_id optional).
- **Budget**: monthly limit per category (id, user_id, category_id, month, amount).
- **Summary/Report**: aggregated view for a time window (totals, per-category breakdown, budget progress).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Core transaction CRUD path: 95th percentile response time ≤ 2s under light load (single-user/local testing conditions).
- **SC-002**: Summary endpoint for a month with up to 1,000 transactions returns within 1s (p95) in the environment used for acceptance testing.
- **SC-003**: Data isolation: 100% of API requests return only the authenticated user's data (verified by automated tests).
- **SC-004**: Test coverage: all functional requirements (FR-001..FR-007) have corresponding automated tests (unit + integration) that run in CI and pass.
- **SC-005**: Usability: A user can add a transaction and see it in the monthly summary within 2 steps (measured via acceptance test flow).

## Clarifications

### Session 2026-02-12
- Q: Authentication & multi-user scope → A: Email/password + JWT (server-side auth; register/login endpoints; per-user isolation enforced).
- Q: Transaction delete policy → A: Soft‑delete with audit fields (`isDeleted`, `deletedAt`, `deletedBy`). Deleted transactions are excluded from standard listings but retained for audit and reporting.

## Assumptions
- Default scope is a multi-user, authenticated API (email/password + JWT). If single-user/local only is desired, scope and auth requirements will shrink accordingly.
- Currency handling: initial scope supports a primary currency per account; multi‑currency support is out of scope for MVP.
- Persistence, scaling and monitoring are handled by the platform/environment and will be specified in the implementation plan.

## Acceptance Tests (examples)
- Unit tests for validation rules (negative amounts, required fields).
- Integration tests for transaction lifecycle (create → update → delete (soft-delete) → list) asserting response codes, that `DELETE` marks `isDeleted` and deleted transactions are excluded from normal lists unless explicitly requested.
- Contract tests for public endpoints: request/response shapes and error formats.
- Performance smoke test: insert 1,000 transactions and verify monthly summary response time ≤ 1s (p95).

---

### Open questions / [NEEDS CLARIFICATION]
- **Q1 — Authentication & multi-user scope**: Should the API require authentication and support multiple users (default), or should we start with a single-user/local API (no auth)? If auth is required, which method should be used (email/password with tokens, or third‑party OAuth)?


---

**Ready for planning**: yes (spec contains user stories, requirements, success criteria, and tests).
