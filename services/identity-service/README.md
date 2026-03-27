# identity-service

Baseline authentication/authorization endpoints for sprint-based development.

## Database Configuration (PostgreSQL)
- Required environment variable: `DATABASE_URL`
- Example: `postgresql+psycopg://identity_user:identity_pass@localhost:5432/identity_db`
- For `POST /api/v1/identity/auth/register`, the following catalog data must exist:
  - `ROLE` with `role_name = 'guest'`
  - `JURISDICTION` with the requested `jurisdiction_id`
- Registration creates data in both `USER_ACCOUNT` and `GUEST` within the same transaction.
- Registration payload contract:
  - `first_name`, `last_name`, `email`, `document_id`, `jurisdiction_id`, `password`, `password_confirmation`, `role` (optional)

## Sprint 1
- `POST /api/v1/identity/auth/web/login` (HU001)
- `GET /api/v1/identity/auth/roles/{user_id}` (HU025)
- `POST /api/v1/identity/auth/register` (HU-REG-001)

## Sprint 2
- `POST /api/v1/identity/auth/portal/login` (HU010)

## Sprint 3
- `POST /api/v1/identity/auth/mobile/login` (HU015)
