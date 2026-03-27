# identity-service

Baseline authentication/authorization endpoints for sprint-based development.

## Database Configuration (PostgreSQL)
- Required environment variable: `DATABASE_URL`
- Example: `postgresql+psycopg://identity_user:identity_pass@localhost:5432/identity_db`
- For `POST /api/v1/identity/auth/register`, the following catalog data must exist:
  - `ROLE` with `role_name = 'GUEST'`
  - `JURISDICTION` with the requested `jurisdiction_id`
- Registration creates data in both `USER_ACCOUNT` and `GUEST` within the same transaction.
- Registration payload contract:
  - `first_name`, `last_name`, `email`, `document_id`, `jurisdiction_id`, `password`, `password_confirmation`, `role` (optional)
  - `role` values supported by current registration flow: `GUEST`, `ADMIN`, `STAFF`

## Sprint 1
- `POST /api/v1/identity/auth/web/login` (HU001)
- `GET /api/v1/identity/auth/roles/{user_id}` (HU025)
- `POST /api/v1/identity/auth/register` (HU-REG-001)

## Web Login Behavior
- Endpoint: `POST /api/v1/identity/auth/web/login`
- On success:
  - Validates credentials
  - Updates `USER_ACCOUNT.last_login`
  - Stores `GRANTED` event in `ACCESS_AUDIT_LOG`
  - Returns authenticated user data, role permissions, and session metadata
  - Includes `session_ttl_seconds = 900` and `session_expires_at` (UTC)
- On rejected credentials for an existing user:
  - Stores `REJECTED` event in `ACCESS_AUDIT_LOG`

## Sprint 2
- `POST /api/v1/identity/auth/portal/login` (HU010)

## Sprint 3
- `POST /api/v1/identity/auth/mobile/login` (HU015)
