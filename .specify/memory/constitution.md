<!--
Sync Impact Report
- Version change: template → 1.0.0
- Modified principles: (new, see sections below)
- Added sections: Constraints & Development Workflow (clarified)
- Templates updated: .specify/templates/plan-template.md ✅ updated, .specify/templates/tasks-template.md ✅ updated, .specify/templates/spec-template.md ✅ updated
- Follow-ups / TODOs: none
-->

# Personal Budget API Constitution

## Core Principles

### I. Code Quality & Maintainability
- The codebase MUST be readable, modular, and self-documented. Every public module or route
  MUST include a short usage comment and unit tests. Pull requests MUST be small and focused
  (preferably < 400 lines changed) and include an explicit rationale for complexity increases.
- Enforced rules: linting, formatter, and static analysis run in CI; critical modules MUST be
  accompanied by API examples and in-line documentation.

### II. Test-First & Quality Gates (NON-NEGOTIABLE)
- Tests are required before behavior is implemented (TDD encouraged). For any change that
  affects business logic or public APIs, the PR MUST include unit tests and appropriate
  integration or contract tests. CI MUST run and pass the test suite before merging.
- Minimum expectations: unit tests for core logic; integration tests for API endpoints;
  smoke tests for production-critical flows. Coverage targets and exceptions are defined
  in the implementation plan for each feature.

### III. UX Consistency & API Contracts
- The API MUST maintain consistent JSON schemas, status codes, and error formats across
  endpoints. Changes to public contracts require a documented migration strategy and semantic
  version bump. Responses MUST include predictable pagination, error fields, and timestamps
  where applicable.
- Design decisions that affect user/developer experience (naming, field shapes, default
  behaviors) are governed by this constitution and must be recorded in the feature spec.

### IV. Security-First
- Secure-by-default: validate and sanitize all inputs, enforce authentication/authorization,
  and never store secrets in source. Security checks (dependency scanning, secret-scan)
  MUST run in CI. Any vulnerability with CVSS ≥ 7.0 MUST be triaged within 72 hours.
- Sensitive operations MUST be logged with redaction and monitored; auth failures MUST be
  rate-limited and audited.

### V. Performance, Scalability & Observability
- Performance goals MUST be explicit in each feature plan (e.g., target latency, throughput,
  resource budgets). New code MUST be profiled for obvious regressions; regressions that
  increase p95 latency beyond the plan's budget are NOT permitted without mitigation.
- Instrumentation: structured logs, basic metrics (request counts, latency histograms), and
  error reporting MUST be present for all API routes.

## Constraints & Non-Functional Requirements
- Public API: JSON over HTTP (REST-style) is the default; all endpoints MUST return JSON and
  use semantic versioning for breaking changes. Secrets and credentials MUST be supplied via
  environment variables or a secrets manager; no secrets in code or config files.
- Codebase conventions: follow project linter/formatter rules; prefer small focused modules;
  prefer explicit errors over magic values.

## Development Workflow & Quality Gates
- PR requirements (all PRs): passing CI (lint + tests), at least one approving review from a
  maintainer, an entry in CHANGELOG for public-facing changes, and a linked spec/plan if the
  change is non-trivial.
- Release policy: semantic versioning (MAJOR.MINOR.PATCH). Backwards-incompatible API
  changes MUST be gated by migration notes and an integration/conformance test suite.
- Compliance: periodic (quarterly) reviews of high-risk areas (security, performance,
  compliance) are REQUIRED.

## Governance
- Amendments: propose changes via PR against `.specify/memory/constitution.md`; amendments
  MUST include a rationale, impact analysis, and migration plan for any required code or
  process changes. A constitution amendment requires approval from a majority of active
  maintainers (as listed in repository metadata) and MUST be reflected as a version bump.
- Versioning rules for the constitution:
  - MAJOR — redefines or removes principles or governance rules (breaking governance changes).
  - MINOR — adds new principle(s) or materially expands guidance.
  - PATCH — editorial fixes, clarifications, or non-semantic wording changes.
- Enforcement: CI checks and code reviews enforce the constitution; exceptions require
  explicit approval and a recorded justification.

**Version**: 1.0.0 | **Ratified**: 2026-02-12 | **Last Amended**: 2026-02-12

