# Express Server Integration

This document explains how the Express server is integrated with the Aurora HRMS Portal application.

## Overview

The application now uses an Express server (`server.js`) to handle API requests instead of the built-in Vite API plugin. This provides several advantages:

1. Better separation of concerns between frontend and backend
2. More robust API handling
3. Ability to run the backend independently from the frontend
4. Standard Node.js server practices

## Server Configuration

The Express server is configured in `server.js` and provides the following endpoints:

- `POST /api/auth/login` - Authenticate users
- `GET /api/auth/verify` - Verify JWT tokens

## Running the Application

To run the application, you need to start both the Express server and the Vite development server:

```bash
# Start the Express server
node server.js

# In a separate terminal, start the Vite development server
npm run dev
```

## Environment Variables

The Express server uses the following environment variables:

- `PORT` - The port to run the server on (defaults to 3000)
- `VITE_JWT_SECRET` - The secret key for JWT token signing
- `VITE_JWT_EXPIRES_IN` - The expiration time for JWT tokens

## Authentication Flow

1. The client sends login credentials to `/api/auth/login`
2. The server validates the credentials against the database
3. If valid, the server generates a JWT token and returns it to the client
4. The client stores the token in localStorage
5. For subsequent requests, the client includes the token in the Authorization header
6. The server verifies the token for protected routes

## Vite Configuration

The Vite development server is configured to proxy API requests to the Express server:

```js
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  // ...
});
```

This allows the frontend to make API requests to `/api/*` paths, which are then forwarded to the Express server.

## Security Considerations

- The JWT secret should be a strong, random string
- In production, use HTTPS for all communications
- Consider implementing rate limiting for authentication endpoints
- Implement proper error handling and logging 