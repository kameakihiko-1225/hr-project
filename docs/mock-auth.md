# Mock Authentication for Development

This document explains how to use the mock authentication feature in development mode.

## Overview

The Aurora HRMS Portal includes a mock authentication system for development purposes. This allows you to test the admin interface without setting up a real Supabase authentication backend.

## Default Credentials

When using mock authentication, the following credentials are pre-filled on the login page:

- **Email**: admin@example.com
- **Password**: admin123

## How It Works

1. In development mode, if Supabase configuration is missing, the system automatically enables mock authentication.
2. When you log in with the mock credentials, the system creates a simulated admin session.
3. The session is stored in localStorage, just like a real session would be.
4. A mock JWT token is generated for API authorization.

## Configuration

### Environment Variables

You can control mock authentication with the following environment variables:

- `VITE_USE_MOCK_AUTH`: Set to "true" to enable mock authentication (default in development mode)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: If these are set, mock authentication is disabled by default

### .env File Example

```
# Enable mock authentication
VITE_USE_MOCK_AUTH=true

# Or use real Supabase authentication
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Visual Indicators

When using mock authentication, you'll see:

1. A notice on the login page with pre-filled credentials
2. A warning banner at the top of the admin dashboard
3. Log messages in the browser console indicating mock authentication is active

## Switching to Real Authentication

To use real authentication:

1. Set up a Supabase project
2. Add your Supabase URL and anon key to your `.env` file
3. Set `VITE_USE_MOCK_AUTH=false` in your `.env` file

## Security Considerations

- Mock authentication is **only for development purposes**
- It is automatically disabled in production mode
- Never deploy to production with mock authentication enabled
- The mock admin has superadmin privileges by default 