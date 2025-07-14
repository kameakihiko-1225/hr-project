# File Upload System

## Overview
The Aurora HRMS Portal includes a file upload system for handling company logos and other files. The system supports both server-side storage and client-side fallbacks for development.

## Components

### CompanyLogoUpload Component
The `CompanyLogoUpload` component provides a user interface for uploading and displaying company logos:

- Accepts an initial logo URL
- Provides image preview
- Handles file validation and resizing
- Uploads files to the server
- Falls back to local blob URLs when server uploads fail

### File Upload API

The file upload API endpoint is located at `/api/files` and handles:
- File storage in the database
- Association with companies
- File validation
- Secure file handling

## Implementation Details

### Client-Side
1. File selection via input element
2. File validation (size, type)
3. Image resizing for optimization
4. Local preview generation using Blob URLs
5. API request to upload the file
6. Handling of success/failure responses

### Server-Side
1. File reception using Multer middleware
2. Storage in database using the FileStorage model
3. Association with related entities (e.g., companies)
4. Response with file metadata

## Error Handling
- Client-side validation with user feedback
- Local preview fallback when server upload fails
- Proper cleanup of Blob URLs to prevent memory leaks
- Comprehensive error logging

## Development Mode
In development mode:
- Local Blob URLs are used as fallbacks when server uploads fail
- Mock data is provided for file upload responses
- Preview functionality works even without a backend

## Usage Example

```tsx
// Using the CompanyLogoUpload component
<CompanyLogoUpload
  initialLogo={company.logoUrl}
  onLogoChange={(logoUrl) => {
    setCompany({
      ...company,
      logoUrl
    });
  }}
  companyId={company.id}
/>
```

## Best Practices
1. Always validate files on both client and server
2. Resize images before upload to reduce bandwidth
3. Provide immediate feedback with local previews
4. Clean up Blob URLs to prevent memory leaks
5. Handle upload failures gracefully

## API Endpoints

### Upload a File

```
POST /api/files
```

**Request:**
- Content-Type: multipart/form-data
- Body:
  - `file`: The file to upload
  - `companyId` (optional): ID of the company to associate the file with

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "fileName": "filename.jpg",
    "fileUrl": "/api/files/uuid",
    "fileSize": 12345
  }
}
```

### Retrieve a File

```
GET /api/files/:id
```

**Response:**
- The file content with appropriate Content-Type header

## Database Schema

Files are stored in the `file_storage` table with the following schema:

```prisma
model FileStorage {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fileName   String   @map("file_name")
  fileType   String   @map("file_type")
  fileData   Bytes    @map("file_data")
  fileSize   Int      @map("file_size")
  companyId  String?  @map("company_id") @db.Uuid
  uploadedAt DateTime @default(now()) @map("uploaded_at") @db.Timestamp(6)
  company    Company? @relation(fields: [companyId], references: [id])

  @@map("file_storage")
}
```

## Frontend Components

### CompanyLogoUpload

The `CompanyLogoUpload` component provides a user interface for uploading company logos. It includes:

- Image preview
- File selection button
- Automatic image resizing
- Error handling
- Fallback to local preview if upload fails

```tsx
<CompanyLogoUpload 
  initialLogo={company.logoUrl} 
  onLogoChange={(url) => handleLogoChange(url)} 
  companyId={company.id}
/>
```

## Utility Functions

The `fileUpload.ts` module provides utility functions for file handling:

- `validateFile(file, config)`: Validates file type and size
- `createLocalFileUrl(file)`: Creates a temporary URL for preview
- `revokeLocalFileUrl(url)`: Cleans up temporary URLs
- `resizeImageFile(file, maxWidth, maxHeight, quality)`: Resizes images before upload

## Error Handling

The file upload system includes comprehensive error handling:

1. Client-side validation for file type and size
2. Fallback to local preview if server upload fails
3. Graceful degradation with appropriate error messages
4. Automatic cleanup of temporary blob URLs

## Development Mode

In development mode or when the server is unavailable, the system provides mock responses to allow for continued development and testing. 