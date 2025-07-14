# Company Page Implementation

This document explains the company page implementation in the Aurora HRMS Portal.

## Overview

The company page allows administrators to manage their companies in the system. The implementation includes:

1. Viewing a list of companies
2. Creating new companies
3. Editing existing companies
4. Deleting companies
5. Uploading and managing company logos

## Components

### CompanyCard (`src/components/CompanyCard.tsx`)

This component displays a company in a card format:

- Shows the company logo or initials if no logo is available
- Displays basic company information
- Provides actions for editing and deleting
- Includes a detailed view dialog

### CompanyLogoUpload (`src/components/CompanyLogoUpload.tsx`)

This component handles logo uploads for companies:

- Displays the current logo or a placeholder
- Provides an upload button
- Handles validation, resizing, and uploading
- Reports success or errors to the user

### Companies Page (`src/pages/admin/companies/index.tsx`)

This page provides the main interface for company management:

- Lists all companies for the current admin
- Provides filtering and sorting options
- Includes a dialog for adding/editing companies
- Handles company deletion with confirmation

## Data Flow

1. The Companies page loads companies from the API
2. Users can filter and sort the list
3. When adding/editing a company:
   - The form collects company details
   - Logo uploads are handled by CompanyLogoUpload
   - Form data is submitted to the API
4. When deleting a company:
   - Confirmation is requested
   - The API is called to delete the company
   - The list is updated

## API Integration

The company page interacts with the following API endpoints:

- `GET /api/companies`: Fetch all companies
- `POST /api/companies`: Create a new company
- `PUT /api/companies/:id`: Update an existing company
- `DELETE /api/companies/:id`: Delete a company

## Database Schema

Companies are stored in the database with the following schema:

```prisma
model Company {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  logoUrl     String?       @map("logo_url")
  color       String?
  address     String?
  phone       String?
  email       String?
  city        String?
  country     String?
  description String?
  adminId     String        @map("admin_id") @db.Uuid
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamp()
  admin       Admin         @relation(fields: [adminId], references: [id])
  departments Department[]
  bots        Bot[]
  documents   Document[]
  bitrixMaps  BitrixMapping[]

  @@map("companies")
}
```

## Future Improvements

Potential improvements to consider:

1. Add pagination for large company lists
2. Implement more advanced filtering options
3. Add company analytics and insights
4. Support for company branches/locations
5. Integration with external company databases
6. Bulk import/export functionality 