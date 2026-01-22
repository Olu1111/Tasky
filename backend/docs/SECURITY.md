# Security & Infrastructure Documentation

This document outlines the security measures and infrastructure improvements implemented in the Tasky application.

## Security Measures

### 1. Authentication & Authorization

#### Middleware
- **requireAuth**: Validates JWT tokens and attaches user to request
- **requireAdmin**: Ensures user has admin role for sensitive operations

#### Implementation
All routes are protected with appropriate middleware:
- Public routes: `/health`, `/api/auth/register`, `/api/auth/login`
- Protected routes: All other API endpoints require authentication
- Admin-only routes: Board creation/deletion, column management

### 2. Rate Limiting

#### Global Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 300 per IP
- **Purpose**: Prevent abuse and DoS attacks

#### Authentication Rate Limiting
- **Login Endpoint** (`/api/auth/login`)
  - Window: 15 minutes
  - Max Attempts: 5 per IP
  - Purpose: Prevent brute force attacks
  
- **Registration Endpoint** (`/api/auth/register`)
  - Window: 1 hour
  - Max Attempts: 3 per IP
  - Purpose: Prevent spam registrations

### 3. Input Validation

#### Validation Middleware
All authentication endpoints use validation middleware:

- **Email Validation**: Ensures proper email format
- **Password Strength**: Minimum 6 characters required
- **Input Sanitization**: Removes potentially dangerous HTML/script tags
- **Email Normalization**: Converts emails to lowercase and trims whitespace

### 4. Request Logging & Audit Trail

#### Logging Configuration
- **Development**: Simple format showing method, URL, status, and response time
- **Production**: Comprehensive audit format including:
  - Client IP address
  - User ID (if authenticated)
  - Timestamp
  - HTTP method and URL
  - Status code and response size
  - User agent
  - Response time

#### Authentication Event Logging
All authentication events are logged in JSON format with:
- Timestamp
- Event type (LOGIN_SUCCESS, LOGIN_FAILED, REGISTER_SUCCESS, REGISTER_FAILED)
- IP address
- User agent
- User ID
- Additional context (email, failure reason)

Example log entry:
```json
{
  "timestamp": "2026-01-22T21:35:00.000Z",
  "type": "AUTH_EVENT",
  "event": "LOGIN_SUCCESS",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

### 5. Security Headers (Helmet)

The application uses Helmet.js to set secure HTTP headers:
- Content Security Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- X-Download-Options
- X-Permitted-Cross-Domain-Policies

### 6. CORS Configuration

Cross-Origin Resource Sharing is configured to:
- Allow only specified origins (configurable via CORS_ORIGIN env var)
- Support credentials (cookies, authorization headers)
- Default to localhost:5173 for development

## Environment Variables

All environment variables are documented in `.env.example` with:
- Clear descriptions
- Security recommendations
- Default values
- Example formats
- Required vs optional indicators

### Required Variables
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: Secret key for JWT signing (minimum 32 characters recommended)

### Optional Variables
- `NODE_ENV`: Application environment (default: development)
- `PORT`: Server port (default: 4000)
- `JWT_EXPIRES_IN`: Token expiration time (default: 7d)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:5173)

## Best Practices Implemented

1. **Secrets Management**: Sensitive data removed from `.env.example`
2. **Password Security**: Never logged or exposed in responses
3. **Error Handling**: Stack traces only shown in development
4. **Request Size Limits**: JSON payloads limited to 1MB
5. **Token Expiration**: JWTs expire after configurable period
6. **Audit Trail**: Comprehensive logging for security events

## Security Checklist

- [x] Authentication middleware on all protected routes
- [x] Authorization checks for admin operations
- [x] Rate limiting on authentication endpoints
- [x] Input validation for user inputs
- [x] Security headers via Helmet
- [x] CORS properly configured
- [x] Request logging for audit trail
- [x] Environment variables documented
- [x] Sensitive data excluded from logs
- [x] Passwords hashed (via bcrypt in User model)
- [x] JWT tokens with expiration
- [x] Request size limits

## Future Improvements

Consider implementing:
- Two-factor authentication (2FA)
- Account lockout after multiple failed attempts
- Password complexity requirements
- Session management and revocation
- API key authentication for service-to-service
- More granular role-based access control
- Security headers customization per route
- Request signature verification
- IP whitelisting for admin operations
