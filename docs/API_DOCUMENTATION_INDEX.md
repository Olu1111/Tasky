# API Documentation Index

Quick navigation to all Tasky API documentation.

## 📖 Complete API Reference

### [1. Full API Documentation](api/api.md)
Complete endpoint reference with all operations.

**Contents:**
- Authentication (register, login, get user)
- Boards (list, create, get, delete)
- Columns (list, create, update, delete)
- Tickets (list, create, update, move, delete, search)
- Comments (add, delete)
- Activity Logs (timeline, statistics, filtering)
- Error handling and rate limiting
- cURL examples

**Key Sections:**
- 7 endpoint categories
- 20+ REST endpoints
- Request/response examples for each
- Query parameters and filters
- Rate limiting per endpoint

---

## 🔐 Access Control

### [2. RBAC Permissions Matrix](RBAC_PERMISSIONS_MATRIX.md)
Complete role permissions and access control matrix.

**Contents:**
- Role hierarchy (Admin > Member > Viewer)
- Permission matrix by endpoint
- Resource-specific permissions
- Permission evaluation flow
- Role assignment and inheritance
- Testing permissions by role
- Audit trail for permissions

**Key Features:**
- Visual permission tables
- Conditional access (ownership, membership)
- Permission scenarios
- Flow diagrams

---

## 💾 Data Model

### [3. Database Schema Documentation](DATABASE_SCHEMA.md)
Complete database schema with relationships and indexes.

**Contents:**
- Visual schema diagram
- 6 collections (User, Board, Column, Ticket, Comment, ActivityLog)
- Field definitions and constraints
- Relationships and references
- Indexing strategy
- Performance optimization
- Backup & recovery

**Collections Documented:**
- **User** - Authentication and roles
- **Board** - Project workspaces
- **Column** - Workflow stages
- **Ticket** - Tasks and issues
- **Comment** - Discussions
- **ActivityLog** - Audit trail (auto-expires)

---

## ⚠️ Error Handling

### [4. Error Response Documentation](API_ERROR_HANDLING.md)
Complete error handling reference and troubleshooting.

**Contents:**
- Standard response format (success/error)
- HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500)
- Error messages by category
- Rate limit responses
- Common scenarios and solutions
- Client-side error handling patterns
- Debugging tips
- Error logging

**Error Categories:**
- Authentication (401)
- Authorization (403)
- Validation (400)
- Not Found (404)
- Rate Limiting (429)
- Server Errors (500)

---

## 🔍 Other Documentation

### Related Documents
- [Security & Infrastructure](SECURITY_INFRASTRUCTURE.md) - Rate limiting, audit logging, security headers
- [Activity Logging](ACTIVITY_LOGGING.md) - Audit trail, activity endpoints, statistics
- [RBAC Implementation](RBAC.md) - Role system details and implementation notes
- [API Error Handling](API_ERROR_HANDLING.md) - Error codes and debugging

---

## Quick Reference

### Base URL
```
http://localhost:4000/api
```

### Authentication
```
Authorization: Bearer {token}
```

### Rate Limits
| Operation | Limit |
|-----------|-------|
| Login | 5 / 15 min |
| Register | 3 / 1 hour |
| Search | 30 / 1 min |
| Writes | 50 / 5 min |
| General | 300 / 15 min |

### Common Endpoints

**Authentication**
- `POST /auth/register` - Create account
- `POST /auth/login` - Get token
- `GET /auth/me` - Current user

**Boards**
- `GET /boards` - List accessible boards
- `POST /boards` - Create board (members+)
- `GET /boards/:id` - Get board details
- `DELETE /boards/:id` - Delete board (owner only)

**Tickets**
- `GET /tickets` - List tickets with filters
- `POST /tickets` - Create ticket (members+)
- `PATCH /tickets/:id/move` - Move ticket
- `GET /tickets/search` - Search tickets (rate-limited)

**Activity**
- `GET /boards/:id/activity` - List activities
- `GET /boards/:id/activity/stats` - Activity statistics
- `GET /boards/:id/activity/timeline` - Timeline grouped by date

---

## Getting Started

### 1. Review Roles & Permissions
Start with [RBAC Permissions Matrix](RBAC_PERMISSIONS_MATRIX.md) to understand access control.

### 2. Understand Data Model
Review [Database Schema](DATABASE_SCHEMA.md) to see how data is organized.

### 3. Learn API Endpoints
Use [Full API Documentation](api/api.md) to understand all endpoints.

### 4. Handle Errors
Check [Error Handling](API_ERROR_HANDLING.md) for troubleshooting.

---

## API Testing

### Using cURL

**Login**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Create Board**
```bash
curl -X POST http://localhost:4000/api/boards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Board"}'
```

**Get Board Activity**
```bash
curl http://localhost:4000/api/boards/{id}/activity \
  -H "Authorization: Bearer {token}"
```

### Using Postman
1. Import JSON from any endpoint examples
2. Set Authorization header for protected routes
3. Use variables for token and IDs
4. Monitor rate limit headers

---

## Documentation Statistics

| Document | Lines | Topics |
|----------|-------|--------|
| API Documentation | 1015 | All endpoints with examples |
| RBAC Permissions | 322 | 8 endpoint categories, access matrix |
| Database Schema | 467 | 6 collections, relationships, indexes |
| Error Handling | 573 | Error codes, debugging, handling patterns |
| **Total** | **2377** | **Comprehensive API reference** |

---

## Support & Debugging

### Check Server Status
```bash
curl http://localhost:4000/health
```

### View Audit Logs
```bash
tail -f backend/logs/audit.log
```

### Test Authentication
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer {token}"
```

### Monitor Rate Limits
Response headers include:
- `RateLimit-Limit: 50`
- `RateLimit-Remaining: 47`
- `RateLimit-Reset: 1642854900`

---

## Document Versioning

**Last Updated:** January 22, 2026  
**API Version:** 1.0.0  
**Status:** Production Ready

All documentation updated alongside code changes.

---

## Navigation

- [← Back to Docs](.)
- [← Back to Project](../)
- [Backend Documentation](backend/)
- [Frontend Documentation](frontend/)
