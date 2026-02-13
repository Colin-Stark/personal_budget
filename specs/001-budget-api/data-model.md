# data-model.md — Personal Budget API

## Entities

### User
- id: ObjectId
- email: string (unique, indexed)
- displayName: string
- passwordHash: string (bcrypt)
- createdAt, updatedAt

### Account
- id: ObjectId
- userId: ObjectId (index)
- name: string
- currency: string (ISO 4217)
- startingBalance: number
- createdAt, updatedAt

### Category
- id: ObjectId
- userId: ObjectId (index)
- name: string
- type: enum ["expense", "income"]
- parentId?: ObjectId (nullable)
- createdAt, updatedAt

### Transaction
- id: ObjectId
- userId: ObjectId (index)
- accountId: ObjectId (index)
- date: ISODate
- amount: number (signed or positive with type field)
- currency: string
- categoryId?: ObjectId
- description?: string
- metadata?: object
- idempotencyKey?: string (optional, indexed)
- isDeleted?: boolean (default: false)
- deletedAt?: ISODate
- deletedBy?: ObjectId
- createdAt, updatedAt

Indexes & constraints
- Compound index: (userId, accountId, date) for querying transactions by account and date
- Unique index: (userId, idempotencyKey) where idempotencyKey exists

## Validation rules (high level)
- amount: required, numeric, non-zero (business to decide if zero allowed)
- date: required, valid ISO date, not in the future (configurable)
- category: must belong to the same user
- account: must belong to the same user

## State transitions
- Transaction: created → (updated | soft-deleted) — deletion is implemented as soft-delete (set `isDeleted`, `deletedAt`, `deletedBy`) and deleted records are retained for audit and reporting. Deleted transactions are excluded from normal query results unless explicitly requested.

## Notes
- Keep models small and lean; business logic (budget calculations, summaries) implemented in `services/` so it can be unit tested.
