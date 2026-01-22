# Security & Infrastructure Polish

## Overview

This document outlines the security enhancements and infrastructure improvements made to the Tasky backend.

## 1. Rate Limiting Implementation ✅

### Rate Limiting Middleware (`src/middleware/rateLimiter.js`)

Comprehensive rate limiting with endpoint-specific limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication (login) | 5 attempts | 15 minutes |
| Registration | 3 attempts | 60 minutes |
| General API | 300 requests | 15 minutes |
| Search | 30 requests | 1 minute |
| Write operations | 50 requests | 5 minutes |

**Features:**
- IP-based rate limiting with fallback to username/email for auth
- Custom error messages for rate limit violations
- Smart skipping (e.g., health checks exempt)
- HTTP 429 responses with `Retry-After` headers

**Applied to:**
- `/api/auth/login` - Strict limit to prevent brute force
- `/api/auth/register` - Prevents spam account creation
- `/api/tickets/search` - Prevents search DoS
- All write operations (POST, PUT, PATCH, DELETE)

## 2. Audit Logging (`src/app.js`)

### Request Logging with Audit Trail

Comprehensive logging using Morgan with custom tokens:

```
Format: [IP] [User] [Timestamp] "METHOD URL" STATUS SIZE "Referrer" "User-Agent" user=USER_ID role=ROLE response_time=Xms
```

**Features:**
- Logs to `logs/audit.log` file for persistent audit trail
- Custom tokens: `user-id`, `user-role`, response time
- Development console logging
- Non-blocking async file I/O
- Automatic logs directory creation

**Captured Data:**
- Request method, URL, HTTP version
- Response status code and content length
- Client IP address and user agent
- Authenticated user ID and role
- Response time in milliseconds

## 3. Security Middleware Review ✅

### Route-by-Route Security Audit

**Authentication Routes** (`/api/auth`)
- ✅ Login: Rate-limited (5 attempts/15m)
- ✅ Register: Rate-limited (3 attempts/1h)
- ✅ Get Me: Requires authentication
- ✅ List Users: Requires authentication

**Board Routes** (`/api/boards`)
- ✅ GET: Requires authentication
- ✅ GET by ID: Requires authentication
- ✅ POST (create): Requires authentication + member role
- ✅ DELETE: Requires authentication + member role + ownership check
- ✅ Column sub-routes: Properly protected

**Ticket Routes** (`/api/tickets`)
- ✅ All endpoints: Require authentication
- ✅ GET operations: Allow all authenticated users
- ✅ Write operations: Require member role
- ✅ Comments: Require member role for add/delete

**Column Routes** (`/api/columns`)
- ✅ PATCH/DELETE: Require authentication + admin role

**Activity Routes** (`/api/boards/:id/activity`)
- ✅ All endpoints: Require authentication
- ✅ Scoped to accessible boards

**Additional Protections:**
- ✅ Request body size limited to 1MB
- ✅ CORS configured with specific origins
- ✅ Helmet.js security headers enabled
- ✅ JSON body parser with size limits

## 4. Environment Variables Documentation ✅

### Configuration File (`backend/.env.example`)

Comprehensive documentation with 4 categories:

**Core Configuration:**
- MONGODB_URI - Database connection
- JWT_SECRET - Authentication key
- JWT_EXPIRES_IN - Token expiration
- PORT - Server port
- NODE_ENV - Environment mode

**Security Settings:**
- CORS_ORIGIN - Allowed origins
- MAX_REQUEST_SIZE - Body size limit
- SESSION_TIMEOUT - Session duration

**Rate Limiting:**
- RATE_LIMIT_GENERAL_MAX - API rate limit
- RATE_LIMIT_AUTH_MAX - Login attempts
- RATE_LIMIT_REGISTER_MAX - Registration attempts
- RATE_LIMIT_SEARCH_MAX - Search requests
- RATE_LIMIT_WRITE_MAX - Write operations

**Optional/Future:**
- Email configuration (SMTP)
- File storage (S3, GCP)
- Analytics tracking

## Security Best Practices Implemented

✅ **Authentication**
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- Role-based access control (RBAC)

✅ **Authorization**
- Middleware-based access control
- Resource ownership verification
- Role hierarchy enforcement

✅ **Rate Limiting**
- Brute force protection
- DoS prevention
- API abuse mitigation

✅ **Data Protection**
- CORS origin validation
- Request body size limits
- Input validation via middleware

✅ **Audit Trail**
- Comprehensive request logging
- User and role tracking
- Activity logging (via ActivityLog model)
- Response time monitoring

✅ **Security Headers**
- Helmet.js for HTTP headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

## Monitoring & Troubleshooting

### View Audit Logs
```bash
tail -f backend/logs/audit.log
```

### Check Rate Limit Status
Rate limit information is included in response headers:
```
RateLimit-Limit: 5
RateLimit-Remaining: 2
RateLimit-Reset: 1642854900
```

### Debug Mode
Set `NODE_ENV=development` for console logging in addition to audit trail.

## Production Checklist

- [ ] Update JWT_SECRET in .env (generate new random key)
- [ ] Update CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB for production
- [ ] Enable HTTPS/TLS
- [ ] Set up log rotation for audit.log
- [ ] Configure firewall rules
- [ ] Review and adjust rate limiting thresholds
- [ ] Enable CSRF protection if needed
- [ ] Set up monitoring/alerting on rate limits
- [ ] Review and rotate JWT_SECRET periodically

## Files Modified/Created

### Created
- `src/middleware/rateLimiter.js` - Rate limiting configuration

### Modified
- `src/app.js` - Added comprehensive logging and rate limiting
- `src/routes/auth.routes.js` - Applied rate limiters to auth endpoints
- `.env.example` - Complete environment variable documentation

## Future Enhancements

1. **IP Whitelist/Blacklist** - Allow/block specific IPs
2. **Rate Limit Persistence** - Use Redis for distributed rate limiting
3. **Request Validation** - Detailed request schema validation
4. **Security Headers Customization** - Adjust Helmet.js policies
5. **DDoS Protection** - Integrate with third-party services
6. **Intrusion Detection** - Flag suspicious patterns
7. **Security Alerts** - Real-time notifications on security events
8. **WAF Integration** - Web Application Firewall
