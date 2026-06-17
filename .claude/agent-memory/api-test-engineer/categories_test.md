---
name: categories-test
description: Integration tests for categories CRUD API endpoints
metadata:
  type: project
---

Created comprehensive integration tests for the new categories API endpoints at `/api/v1/categories`.

**Test Coverage:**
- **POST /api/v1/categories** - Create category (verify _id returned, defaults work, validation)
  - Happy path with all fields
  - Minimal payload (defaults for color, icon, isDefault, order)
  - Duplicate name rejection (409)
  - Missing required name field (400)
  - Invalid color format (400)
  - Name exceeding max length 50 (400)

- **GET /api/v1/categories** - List categories
  - Verify created categories appear in list
  - Authentication required (401)

- **GET /api/v1/categories/:id** - Get single category
  - Happy path
  - 404 for non-existent
  - 404 for category belonging to another user (isolation)

- **PATCH /api/v1/categories/:id** - Update category
  - Update name and color
  - Update only icon
  - Update isDefault and order
  - Reject empty payload (400)
  - Reject duplicate name update (409)
  - 404 for non-existent

- **DELETE /api/v1/categories/:id** - Delete category
  - 409 when category in use by budget
  - 409 when category in use by transaction
  - 204 successful deletion
  - 404 for non-existent
  - Authentication required (401)

**Key Implementation Notes:**
1. Fixed missing `validateParams` middleware in `src/middleware/validation.js` (was used in categories.js but not exported)
2. Tests follow existing patterns in the codebase (supertest, mongo helper, jwt auth)
3. Clean up in reverse dependency order (transactions → budgets → categories → user)
4. Uses unique emails for multi-user tests to avoid conflicts

**Files Changed:**
- `tests/integration/categories.test.js` - New test file (24 tests)
- `src/middleware/validation.js` - Added `validateParams` export

**All tests pass:** 24/24 categories tests + 41/41 full suite tests