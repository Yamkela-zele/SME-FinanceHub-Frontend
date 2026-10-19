# SME FinanceHub

## Project structure

- Frontend: Vite + React + TypeScript in this directory.
- Backend: Express + Prisma in `../backend`.
- Database: MySQL.
- Shared types: `shared/types`.

## Branding and responsive layout

The shared brand mark and browser favicon use
`public/SME FinanceHub Growth Icon.png`. Public and authenticated pages use
responsive layouts that adapt navigation, forms, content grids and tables for
small screens as well as desktop browsers. Wide data tables scroll within
their own containers on narrow screens.

## Backend setup

1. Create a MySQL database and configure `backend/.env` from
   `backend/.env.example`.
2. Set a strong `JWT_SECRET`, a 64-character hex
   `EMAIL_OUTBOX_ENCRYPTION_KEY`, a Resend API key, and a verified
   `EMAIL_FROM` address.
3. Run the backend from `../backend`:

   ```bash
   corepack pnpm@9.15.4 install
   corepack pnpm@9.15.4 prisma:generate
   corepack pnpm@9.15.4 prisma:migrate
   corepack pnpm@9.15.4 admin:create
   corepack pnpm@9.15.4 dev
   ```

   The one-time `admin:create` command requires `BOOTSTRAP_ADMIN_EMAIL`,
   `BOOTSTRAP_ADMIN_NAME`, and `BOOTSTRAP_ADMIN_PASSWORD` in the backend
   environment. Remove those bootstrap variables after the administrator is
   created. Do not expose bootstrap credentials in a production deployment.

4. Start the frontend from this directory with
   `corepack pnpm@9.15.4 install` and `corepack pnpm@9.15.4 dev`.
   It runs on `http://localhost:8443` and proxies `/api` to
   `http://localhost:4000` by default.

## Onboarding and email configuration

Only Business Owners can submit public registration. Email verification and
password setup are required before they can sign in. Accountant applications
must be submitted by a Business Owner and approved by an administrator.
Funding Partner accounts are administrator-created and activate through a
single-use invitation. Business financial information is shared with a Funding
Partner only after a Business Owner explicitly grants a time-limited or
ongoing permission. Business Owners can sign in after email verification, but
funding applications and information sharing remain unavailable until an
administrator verifies the business profile. Administrators can verify or
review each case from Business verifications. Administrators must inspect
separate business-registration and representative-authority evidence before
recording a manual decision. Revoked, rejected or expired verification also
revokes active Funding Partner shares.

Email messages are queued in the database with an encrypted payload and are
retried by the backend worker. The token tables store SHA-256 hashes rather
than usable raw verification or invitation token values. Configure the outbox
encryption key before sending email and keep it stable so queued messages can
be retried. The Resend adapter records provider acceptance, not confirmed
mailbox delivery.

## Business verification operations

The verification flow is manual-review-only until SME FinanceHub has confirmed
authorisation, credentials and the current documented request/response
contract for a CIPC/APIVerse integration. The application does not scrape
BizPortal, invent provider endpoints, or mark an application automatically
verified. Registered businesses require registration evidence and separate
representative-authority evidence. Unregistered businesses use an alternative
evidence route and are explicitly labelled `VERIFIED_WITH_LIMITATIONS`.

Set `EVIDENCE_ENCRYPTION_KEY` to a dedicated 64-character hex key, different
from the email outbox key, before accepting evidence uploads. Evidence accepts
PDF, PNG and JPEG files up to 10 MB, verifies file signatures, encrypts file
contents before writing to `PRIVATE_EVIDENCE_DIR`, and only serves downloads
through authenticated owner/admin routes. Keep the private directory backed
up securely and outside the public web root. Configure malware scanning and
managed private object storage before scaling beyond a single server.
Generate each encryption key independently with a cryptographically secure
random generator (for example, `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`).
The example environment leaves these keys blank so the application can start;
email delivery and evidence uploads remain unavailable until the keys are set.

Completed verification expires after `BUSINESS_VERIFICATION_RECHECK_DAYS`
(default 365); the daily backend job expires the decision, removes active
Funding Partner access, and queues owner notices. A separate provider adapter
must be implemented against an authorised CIPC specification before automated
checks can be enabled. Evidence is purged after
`VERIFICATION_EVIDENCE_RETENTION_DAYS` (default 365), so retain only documents
that are genuinely needed for the configured review policy.

Important backend settings:

- `DATABASE_URL`: MySQL connection string.
- `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`: Resend provider settings.
- `EMAIL_OUTBOX_ENCRYPTION_KEY`: 32-byte AES key encoded as 64 hex characters.
- `EVIDENCE_ENCRYPTION_KEY`: separate 32-byte AES key for verification files.
- `PRIVATE_EVIDENCE_DIR`: private storage path for encrypted evidence.
- `BUSINESS_VERIFICATION_RECHECK_DAYS`,
  `VERIFICATION_EVIDENCE_RETENTION_DAYS`: decision-expiry and evidence-retention periods.
- `FRONTEND_URL`, `BACKEND_URL`: application URLs used in links and deployment.
- `INVITATION_TOKEN_TTL_MINUTES`, `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`,
  `PASSWORD_SETUP_TOKEN_TTL_MINUTES`, `PASSWORD_RESET_TOKEN_TTL_MINUTES`.
- `OWNER_REGISTRATION_REQUIRES_REVIEW`: defaults to `false`.

This project previously used PostgreSQL. Switching the Prisma provider and
migrations to MySQL does not transfer existing PostgreSQL data. Export and
transform existing records separately before directing production traffic at a
new MySQL database; the new baseline migration is intended for a fresh MySQL
database.

## Validation

Run backend tests with `corepack pnpm@9.15.4 test`, and build with
`corepack pnpm@9.15.4 build`. Run the frontend TypeScript check with
`corepack pnpm@9.15.4 exec tsc --noEmit -p tsconfig.json`, then
`corepack pnpm@9.15.4 build`.
