# Quickstart — Personal Budget API (local development)

Prerequisites
- Node.js 20.x
- MongoDB (local) or use MongoDB Atlas

Setup
1. Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET`, and `PORT`.
2. Install dependencies: `npm install`
3. Run tests: `npm test` (Jest + Supertest run unit & integration tests)
4. Start server: `npm start` (starts Express on configured `PORT`)

Local dev notes
- Use Postman or the generated OpenAPI file at `specs/001-budget-api/contracts/openapi.yaml` to explore endpoints.
- Auth flow: POST `/api/v1/auth/register` → POST `/api/v1/auth/login` to get Bearer token.
- Run integration tests with an in-memory MongoDB in CI; see `tests/integration` for examples.

Deployment
- Dockerize the app and provide `MONGO_URI` and `JWT_SECRET` via environment variables or secrets manager.
- Ensure CI runs lint, tests, and dependency scans before merging.
