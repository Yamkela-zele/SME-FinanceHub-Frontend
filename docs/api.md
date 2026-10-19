# API

Base path: `/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | none | Liveness check |
| POST | /auth/login | none | Returns `{ token, user }` |
| POST | /auth/register | none | Creates an active owner account, business, and empty readiness checklist |
| GET | /auth/me | Bearer | Current user and business |
| PATCH | /auth/me | Bearer | Update display name |
| GET/POST | /transactions | owner (GET also accountant, `?reviewed=false`) | List / record income or expense |
| PATCH | /transactions/:id/review | accountant | Mark reviewed (audited) |
| GET/POST | /invoices | owner | List / create (customer found or created) |
| PATCH | /invoices/:id/paid | owner | Mark paid |
| GET/POST | /customers | owner | List with outstanding balances / create |
| GET/POST | /reports | owner (GET all roles) | List / record report metadata |
| GET | /dashboard/summary | owner | KPIs, 6-month series, cash outlook, attention counts |
| GET | /funding/readiness | owner | Score and checklist |
| POST | /funding/readiness/:id/complete | owner | Complete an item, recompute score |
| GET/POST | /applications | owner (own) / funder (all) | List / submit |
| GET | /applications/summary, /applications/portfolio | funder | Pipeline stats / approved facilities |
| PATCH | /applications/:id/decision | funder | Set status (audited) |
| GET | /businesses, /businesses/summary | accountant, admin (summary: accountant) | Client list / practice overview |
| POST | /businesses/:id/signoff, /notify | accountant (notify: admin too) | Sign off report / record a records request or reminder in the audit log |
| GET | /admin/summary, /admin/users, /admin/audit | admin | Platform stats, users, audit log |
| PATCH | /admin/users/:id/status | admin | Approve, suspend or restore (audited) |
| GET | /notifications | Bearer | Role-specific alerts derived from live data |

Roles: `owner`, `accountant`, `funder`, `admin`. Use `requireRole(...)` per route.
