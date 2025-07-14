# Authentication System

This document explains the authentication system used in the Aurora HRMS Portal.

## Overview

The authentication system is built on Supabase Auth with custom JWT tokens for API authorization. It supports:

- Email/password authentication
- Session persistence
- Role-based access control
- API authorization via JWT tokens

## Architecture

The authentication system consists of several key components:

### 1. Supabase Auth

Supabase Auth handles the primary authentication:
- User registration
- Login/logout
- Password reset
- Session management

### 2. Custom JWT

We generate our own JWT tokens for API authorization:
- Contains admin ID, email, and role information
- Used for authorizing API requests
- Verified by middleware

### 3. Admin Database

We maintain our own admin table in the database:
- Links Supabase users to admin roles
- Stores additional admin information
- Controls access levels (admin vs. super admin)

### 4. Auth Context

A React context provides authentication state throughout the application:
- Current admin information
- Authentication status
- Login/logout methods

## Authentication Flow

1. User enters credentials on login page
2. Credentials are verified with Supabase Auth
3. If valid, we check our admin database for the corresponding admin
4. If found, we generate a custom JWT token
5. Admin information and token are stored in the auth context and localStorage
6. Protected routes check authentication status before rendering
7. API requests include the JWT token in the Authorization header

## Development Mode

In development mode, you can use mock authentication without setting up Supabase:
- Default credentials: admin@example.com / admin123
- Enabled by default when Supabase configuration is missing
- See [Mock Authentication Documentation](./mock-auth.md) for details

## API Authorization

API endpoints are protected by the authMiddleware:
- Extracts JWT token from Authorization header
- Verifies token signature and expiration
- Adds admin information to request object
- Returns 401 Unauthorized for invalid tokens

## Key Files

- `src/lib/supabaseAuth.ts` - Supabase authentication service
- `src/lib/authContext.tsx` - React authentication context
- `src/lib/jwt.ts` - JWT token generation and verification
- `src/api/middleware/authMiddleware.ts` - API authorization middleware
- `src/pages/admin/login.tsx` - Login page

## Security Considerations

- JWT tokens expire after a configurable period (default: 7 days)
- Passwords are managed by Supabase, not stored in our database
- API endpoints validate admin roles for sensitive operations
- Super admin operations require the isSuperAdmin flag

## Example Usage

### Protected Component

```tsx
import { useAuth } from '@/lib/authContext';

function ProtectedComponent() {
  const { isAuthenticated, admin } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {admin?.email}</h1>
      {admin?.isSuperAdmin && (
        <div>Super Admin Controls</div>
      )}
    </div>
  );
}
```

### API Authorization

```typescript
import { authMiddleware } from '@/api/middleware/authMiddleware';

// Protect an API route
app.get('/api/protected', authMiddleware, (req, res) => {
  // req.admin contains the authenticated admin information
  res.json({ message: `Hello, ${req.admin.email}` });
});

// Protect a super admin route
app.post('/api/admin/create', authMiddleware, (req, res) => {
  if (!req.admin.isSuperAdmin) {
    return res.status(403).json({ error: 'Requires super admin privileges' });
  }
  
  // Handle super admin operation
});
``` 