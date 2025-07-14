# Custom Authentication and File Storage

This document explains the custom authentication and file storage implementation in the Aurora HRMS Portal.

## Custom Authentication

We've implemented a custom authentication system that uses JWT tokens and stores user credentials in the database. This replaces the previous Supabase authentication.

### How It Works

1. **User Registration and Login**:
   - Users register with email and password
   - Passwords are hashed using bcrypt before storage
   - Upon successful authentication, a JWT token is generated and returned

2. **Token Management**:
   - JWT tokens are signed with a secret key
   - Tokens include user ID, email, and admin status
   - Tokens are verified on protected API routes

3. **API Authentication**:
   - The `authMiddleware` verifies tokens on protected routes
   - The `withSuperAdmin` middleware ensures only super admins can access certain routes

### Usage

To authenticate a user:

```typescript
// Login
const result = await authService.signInWithEmail(email, password);

if (result.success) {
  // Store token
  localStorage.setItem('authToken', result.token);
  // Use token for authenticated requests
}
```

To make authenticated API requests:

```typescript
// Set token in API client
api.setToken(token);

// Make authenticated request
const response = await api.get('/companies');
```

## Database File Storage

Instead of using Supabase storage, files are now stored directly in the PostgreSQL database using the `FileStorage` model.

### How It Works

1. **File Upload**:
   - Files are converted to binary data
   - File metadata and binary data are stored in the database
   - A URL path is returned to access the file

2. **File Retrieval**:
   - Files are accessed via the `/api/files/:id` endpoint
   - The endpoint returns the file with appropriate content type headers

### Usage

To upload a file:

```typescript
// Upload a file
const fileUrl = await uploadFile(file, companyId);

// fileUrl will be something like '/api/files/1234-5678-90ab-cdef'
```

To display an uploaded image:

```jsx
<img src={company.logoUrl} alt={company.name} />
```

## Database Schema

The database schema includes the following models for authentication and file storage:

### Admin Model

```prisma
model Admin {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String     @unique
  passwordHash String     @map("password_hash")
  isSuperAdmin Boolean    @default(false) @map("is_superadmin")
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamp()
  companies    Company[]
  bots         Bot[]

  @@map("admins")
}
```

### FileStorage Model

```prisma
model FileStorage {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fileName    String    @map("file_name")
  fileType    String    @map("file_type")
  fileData    Bytes     @map("file_data") // Binary data stored directly in the database
  fileSize    Int       @map("file_size")
  companyId   String?   @map("company_id") @db.Uuid
  uploadedAt  DateTime  @default(now()) @map("uploaded_at") @db.Timestamp()
  company     Company?  @relation(fields: [companyId], references: [id])

  @@map("file_storage")
}
```

## Default Admin Account

A default admin account is created during database seeding:

- **Email**: admin@example.com
- **Password**: password
- **Super Admin**: Yes

You can use this account to log in to the admin panel.

## Environment Variables

The following environment variables are used for authentication and database connection:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT
VITE_JWT_SECRET=your-secret-key
VITE_JWT_EXPIRES_IN=7d
```

Make sure these are properly configured in your `.env` file. 