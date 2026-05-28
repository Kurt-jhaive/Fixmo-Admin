# API Reference (generated from src/lib/api.ts)

This document summarizes the client-side API helper functions implemented in `src/lib/api.ts` and maps them to backend endpoints, parameters, and expected responses. Use this as a quick reference for developers and for integrating the Gemini chatbot with actual endpoints.

**Base URL**: Configured from environment: `NEXT_PUBLIC_API_URL` (fallback: `https://fixmo-backend-production.up.railway.app`).

**Authentication**: Most endpoints require a Bearer token sent in the `Authorization` header. The helpers use local storage keys (`token` / `adminToken` / `admin_token`) and the `getAuthHeaders()` helper to attach the header.

---

## Modules

- `authApi` — authentication and session management
- `adminApi` — admin-level operations: users, providers, certificates, dashboard aggregation
- `appointmentsApi` — appointments, backjobs, disputes, and stats
- `exportApi` — CSV/PDF export endpoints
- `penaltyApi` — penalty and violations management

---

## authApi

- `login(credentials: { username, password }) => Promise<LoginResponse>`
  - Endpoint: `POST /api/admin/login`
  - Body: `{ username, password }`
  - Returns: `{ message, token, admin, must_change_password }`

- `changePassword(data: { current_password, new_password }) => Promise<{ message }>`
  - Endpoint: `PUT /api/admin/change-password`
  - Requires `Authorization` header

- `logout() => Promise<void>`
  - Endpoint: `POST /api/admin/logout`
  - Clears local auth state client-side

- `storeAuth(token, user)` / `clearAuth()` / `getStoredToken()` / `isValidAuth()` — client helpers

---

## adminApi (selected methods)

- `getUsers(filters) => Promise<any>`
  - Endpoint: `GET /api/admin/users` (query params: `page`, `limit`, `search`, `verified`, `active`)

- `getUserById(userId) => Promise<any>`
  - Endpoint: `GET /api/admin/users/:id`

- `verifyUser(userId) => Promise<any>`
  - Endpoint: `PUT /api/admin/users/:id/verify`

- `rejectUser(userId, reason) => Promise<any>`
  - Endpoint: `PUT /api/admin/users/:id/reject`

- `activateUser(userId)` / `deactivateUser(userId, reason)` — `PUT /api/admin/users/:id/activate` and `/deactivate`

- `getProviders(filters) => Promise<any>`
  - Endpoint: `GET /api/admin/providers` (same filter set as users)

- `getProviderById(providerId) => Promise<any>`
  - Endpoint: `GET /api/admin/providers/:id`

- `verifyProvider(providerId, verified)`
  - Endpoint: `PUT /api/admin/providers/:id/verify` or `/reject` depending on `verified`

- `updateProviderStatus(providerId, status)`
  - Endpoint: `PUT /api/admin/providers/:id/activate` or `/deactivate`

- Certificate helpers:
  - `getCertificates(filters)` => `GET /api/admin/certificates`
  - `getCertificateById(id)` => `GET /api/admin/certificates/:id`
  - `approveCertificate(id)` => `PUT /api/admin/certificates/:id/approve`
  - `rejectCertificate(id, reason)` => `PUT /api/admin/certificates/:id/reject`

- Dashboard aggregation: `getDashboardStats()` — uses multiple endpoints internally (`/api/admin/users`, `/api/admin/providers`, `/api/admin/certificates`, `/api/appointments?limit=1`) and returns aggregated stats.

- `getRecentActivity()` => `GET /api/admin/recent-activity`

- Admin management: `getAdmins()`, `getAdminById()`, `inviteAdmin()`, `toggleAdminStatus()`, `resetAdminPassword()` — endpoints under `/api/admin/`

---

## appointmentsApi

- `getAll(filters) => Promise<{ success, data: Appointment[], pagination }>`
  - Endpoint: `GET /api/appointments` with query params

- `getById(appointmentId)` => `GET /api/appointments/:id`

- `adminCancel(appointmentId, data)` => `POST /api/appointments/:id/admin-cancel`

- Backjobs / disputes:
  - `getBackjobs(filters)` => `GET /api/appointments/backjobs` (query params)
  - `updateBackjob(backjobId, data)` => `PATCH /api/appointments/backjobs/:id`
  - `approveDispute(backjobId, adminNotes)` => `POST /api/appointments/backjobs/:id/approve-dispute`
  - `rejectDispute(backjobId, adminNotes)` => `POST /api/appointments/backjobs/:id/reject-dispute`

- `getStats()` => `GET /api/appointments/stats`

---

## exportApi

- `exportUsers(filters)` => `GET /api/admin/export/users?` — returns a Blob (CSV/PDF)
- `exportProviders(filters)` => `GET /api/admin/export/providers?`
- `exportCertificates(filters)` => `GET /api/admin/export/certificates?`
- `exportAppointments(filters)` => `GET /api/admin/export/appointments?`

All export endpoints use the `format` query param (e.g., `format=csv` or `format=pdf`).

---

## penaltyApi

- `getViolations(filters)` => `GET /api/penalty/admin/violations`
- `adjustPoints(data)` => `POST /api/penalty/admin/adjust-points`
- `manageSuspension(data)` => `POST /api/penalty/admin/manage-suspension`
- `resetPoints(data)` => `POST /api/penalty/admin/reset-points`
- `getPendingAppeals()` => `GET /api/penalty/admin/pending-appeals`
- `reviewAppeal(violationId, data)` => `POST /api/penalty/admin/review-appeal/:id`
- `dismissViolation(violationId, reason)` => `POST /api/penalty/admin/reverse-violation/:id`
- `getViolationDetails(violationId)` => `GET /api/penalty/admin/violations/:id`
- `getAdjustmentLogs(filters)` => `GET /api/penalty/admin/adjustment-logs?` (pagination)
- `getRestrictedAccounts(filters)` => `GET /api/penalty/admin/restricted-accounts?`
- `getDashboardStats()` => `GET /api/penalty/admin/dashboard`

---

## Common Notes

- All JSON requests include `Content-Type: application/json` and the `Authorization` header when available.
- Helpers use `makeAuthenticatedRequest()` which handles token expiry checks and redirects to `/login` when the token is missing or expired.
- Error handling: most helpers throw an Error with backend message when `response.ok === false`.
- Timeouts: `testBackendConnection()` uses an AbortController with a 10s timeout for connection checks.

---

## Example usage (client-side)

Fetch providers (example):

```js
import { adminApi } from '../src/lib/api';

const providers = await adminApi.getProviders({ page: 1, limit: 20 });
console.log(providers);
```

Example cURL for a protected endpoint (replace TOKEN and BASE_URL):

```bash
curl -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  "${NEXT_PUBLIC_API_URL:-https://fixmo-backend-production.up.railway.app}/api/admin/providers?page=1&limit=10"
```

---

If you'd like, I can:
- generate a more detailed OpenAPI/Swagger spec from this file,
- or create a machine-readable Postman collection.

File source: [src/lib/api.ts](src/lib/api.ts)
