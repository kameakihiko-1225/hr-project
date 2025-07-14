# API Endpoints Documentation

This document summarizes the main API endpoints for the HRMS portal backend. All endpoints return JSON responses and most require authentication.

---

## Authentication

### POST `/api/auth/login`
- **Description:** Login with email and password.
- **Body:** `{ email, password }`
- **Response:** `{ success, admin, token }` or `{ success: false, error }`

### POST `/api/auth/register`
- **Description:** Register a new admin account.
- **Body:** `{ email, password, inviteCode? }`
- **Response:** `{ success, admin, token }` or `{ success: false, error }`

### POST `/api/auth/reset-password`
- **Description:** Request password reset.
- **Body:** `{ email }`
- **Response:** `{ success, message }` or `{ success: false, error }`

### GET `/api/auth/verify`
- **Description:** Verify authentication token.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, admin }` or `{ success: false, error }`

---

## Companies

### GET `/api/companies`
- **Description:** Get all companies for the authenticated admin.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, data: Company[] }` or `{ success: false, error }`

### GET `/api/companies/:id`
- **Description:** Get a company by ID.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, data: Company }` or `{ success: false, error }`

### POST `/api/companies`
- **Description:** Create a new company.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ name, ... }`
- **Response:** `{ success, data: Company }` or `{ success: false, error }`

### PUT `/api/companies/:id`
- **Description:** Update a company by ID.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ name?, ... }`
- **Response:** `{ success, data: Company }` or `{ success: false, error }`

### DELETE `/api/companies/:id`
- **Description:** Delete a company by ID.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true }` or `{ success: false, error }`

---

## Database

### GET `/api/db/health`
- **Description:** Check database health.
- **Response:** `{ status: 'healthy'|'unhealthy'|'error', message }`

### GET `/api/db/stats`
- **Description:** Get database statistics (table counts, recent activity, etc).
- **Response:** `{ ...stats }` (see frontend DatabaseStats component)

### GET `/api/db/version`
- **Description:** Get database version.
- **Response:** `{ version }` or `{ status: 'error', message }`

---

## Files

### GET `/api/files/:id`
- **Description:** Download a file by ID.
- **Response:** File data (with appropriate headers) or `{ success: false, error }`

### POST `/api/files`
- **Description:** Upload a file (multipart/form-data).
- **Body:** `file`, `companyId?`
- **Response:** `{ success, data: { id, fileName, fileType, fileSize, fileUrl } }` or `{ success: false, error }`

---

## Dashboard

### GET `/api/dashboard/stats`
- **Description:** Get dashboard statistics.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, data: ... }` or `{ success: false, error }`

---

## SMS Campaigns

### GET `/api/sms/campaigns`
- **Description:** Get all SMS campaigns for the authenticated admin.
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page`, `limit`
- **Response:** `{ success, data: Campaign[], pagination }` or `{ success: false, error }`

### POST `/api/sms/campaigns`
- **Description:** Create a new SMS campaign.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ name, message, ... }`
- **Response:** `{ success, data: Campaign }` or `{ success: false, error }`

### GET `/api/sms/campaigns/:id`
- **Description:** Get a campaign by ID.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success, data: Campaign }` or `{ success: false, error }`

### PUT `/api/sms/campaigns/:id`
- **Description:** Update a campaign by ID.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ ... }`
- **Response:** `{ success, data: Campaign }` or `{ success: false, error }`

### DELETE `/api/sms/campaigns/:id`
- **Description:** Delete a campaign by ID.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, message }` or `{ success: false, error }`

---

## Notes
- All endpoints return JSON unless otherwise specified.
- Most endpoints require authentication via Bearer token.
- Error responses are always in the form `{ success: false, error }`.

---

## How to Extend
- To add new endpoints, document them here and add JSDoc comments in the handler/service files.
- For more details, see the handler files in `src/api/`. 