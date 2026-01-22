# API Error Handling & Response Format

Comprehensive documentation of all error responses, HTTP status codes, and error handling patterns used in Tasky API.

## Standard Response Format

### Success Response

```json
{
  "ok": true,
  "data": {
    "key": "value"
  }
}
```

### Error Response

```json
{
  "ok": false,
  "error": "Error message describing what went wrong"
}
```

---

## HTTP Status Codes

| Code | Name | Use Case | Example |
|------|------|----------|---------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE | Request completed successfully |
| 201 | Created | Successful POST creating resource | Board/Ticket created |
| 400 | Bad Request | Invalid input, validation failure | Missing required field, invalid email |
| 401 | Unauthorized | Authentication failure | Missing/invalid token, login failed |
| 403 | Forbidden | Valid auth but insufficient permissions | User can't delete board they don't own |
| 404 | Not Found | Resource doesn't exist | Ticket ID not found |
| 429 | Too Many Requests | Rate limit exceeded | Too many login attempts |
| 500 | Internal Server Error | Server-side failure | Database connection error |

---

## Authentication Errors (4xx)

### 401 Unauthorized

**Missing Token**
```json
{
  "ok": false,
  "error": "Missing token"
}
```
**Cause:** No Authorization header or token parameter
**Fix:** Include `Authorization: Bearer {token}` header

---

**Invalid Token**
```json
{
  "ok": false,
  "error": "Invalid token"
}
```
**Cause:** Token malformed, expired, or tampered with
**Fix:** Get new token via login endpoint

---

**User Not Found**
```json
{
  "ok": false,
  "error": "User not found"
}
```
**Cause:** Token references deleted user
**Fix:** User needs to re-authenticate

---

**Invalid Credentials**
```json
{
  "ok": false,
  "error": "Invalid email or password"
}
```
**Cause:** Login failed - wrong email/password
**Fix:** Check credentials and try again

---

### 403 Forbidden

**Insufficient Role**
```json
{
  "ok": false,
  "error": "Only members and admins can create boards"
}
```
**Cause:** Viewer trying to create board
**Fix:** User needs member role or higher

---

**Board Access Denied**
```json
{
  "ok": false,
  "error": "You don't have access to this board"
}
```
**Cause:** User not owner or member of board
**Fix:** Request board owner add user as member

---

**Ticket Permission Denied**
```json
{
  "ok": false,
  "error": "You don't have access to this ticket"
}
```
**Cause:** User can't access parent board
**Fix:** Gain access to board first

---

**Comment Authorization**
```json
{
  "ok": false,
  "error": "Not authorized to delete this comment"
}
```
**Cause:** User trying to delete someone else's comment (not author/admin)
**Fix:** Only comment author or admin can delete

---

**Board Deletion Permission**
```json
{
  "ok": false,
  "error": "You do not have permission to delete this board"
}
```
**Cause:** Member trying to delete board they don't own
**Fix:** Only owner or admin can delete

---

### 400 Bad Request

**Validation Failure**
```json
{
  "ok": false,
  "error": "Title is required"
}
```
**Cause:** Missing required field
**Fix:** Include required fields in request

---

**Invalid Input**
```json
{
  "ok": false,
  "error": "Email must be a valid email address"
}
```
**Cause:** Field format invalid
**Fix:** Check input format and try again

---

**Duplicate Email**
```json
{
  "ok": false,
  "error": "Email already exists"
}
```
**Cause:** Email already registered
**Fix:** Use different email or login with existing account

---

**Invalid Column**
```json
{
  "ok": false,
  "error": "Invalid column for this board"
}
```
**Cause:** Ticket created with column from different board
**Fix:** Use correct column ID for board

---

**Missing Parameters**
```json
{
  "ok": false,
  "error": "columnId and index are required"
}
```
**Cause:** Required query/body parameters missing
**Fix:** Include all required fields

---

### 404 Not Found

**Board Not Found**
```json
{
  "ok": false,
  "error": "Board not found"
}
```
**Cause:** Board ID doesn't exist
**Fix:** Check board ID and try again

---

**Ticket Not Found**
```json
{
  "ok": false,
  "error": "Ticket not found"
}
```
**Cause:** Ticket ID doesn't exist
**Fix:** Check ticket ID and try again

---

**Comment Not Found**
```json
{
  "ok": false,
  "error": "Comment not found"
}
```
**Cause:** Comment ID doesn't exist
**Fix:** Check comment ID and try again

---

### 429 Too Many Requests

**Login Rate Limit**
```json
{
  "ok": false,
  "error": "Too many login attempts. Please try again after 15 minutes."
}
```
**Cause:** Exceeded 5 login attempts per 15 minutes
**Fix:** Wait 15 minutes before retrying

---

**Registration Rate Limit**
```json
{
  "ok": false,
  "error": "Too many account creation attempts. Please try again later."
}
```
**Cause:** Exceeded 3 registrations per hour
**Fix:** Wait 1 hour before creating another account

---

**Search Rate Limit**
```json
{
  "ok": false,
  "error": "Too many search requests. Please try again in a minute."
}
```
**Cause:** Exceeded 30 searches per minute
**Fix:** Wait 1 minute before searching again

---

**Write Operations Rate Limit**
```json
{
  "ok": false,
  "error": "Too many write operations. Please try again later."
}
```
**Cause:** Exceeded 50 write operations per 5 minutes
**Fix:** Wait 5 minutes before more modifications

---

### 500 Internal Server Error

**Database Error**
```json
{
  "ok": false,
  "error": "Failed to create ticket"
}
```
**Cause:** Server-side error (database, validation, etc.)
**Fix:** Check server logs, retry after delay

---

## Error Response Headers

**Rate Limit Headers:**
```
RateLimit-Limit: 50
RateLimit-Remaining: 42
RateLimit-Reset: 1642854900
```

**Authentication Headers:**
```
WWW-Authenticate: Bearer realm="Tasky API"
```

---

## Common Error Scenarios & Solutions

### Scenario 1: User Gets 401 on Board Endpoint

**Request:**
```bash
curl http://localhost:4000/api/boards/BOARD_ID \
  -H "Authorization: Bearer invalid_token"
```

**Response:**
```json
{
  "ok": false,
  "error": "Invalid token"
}
```

**Solution:**
1. Check token validity: `jwt.verify(token)`
2. If expired, login again to get new token
3. Ensure token format is correct: `Bearer {token}`

---

### Scenario 2: User Gets 403 Creating Board

**Request:**
```bash
curl -X POST http://localhost:4000/api/boards \
  -H "Authorization: Bearer viewer_token" \
  -d '{"title":"New Board"}'
```

**Response:**
```json
{
  "ok": false,
  "error": "Only members and admins can create boards"
}
```

**Solution:**
1. Check user role: `GET /auth/me`
2. User is "viewer" - not allowed
3. Admin must upgrade user to "member" role
4. User re-logins and retries

---

### Scenario 3: User Gets 429 on Login

**Request:**
```bash
# 6th login attempt within 15 minutes
curl -X POST http://localhost:4000/api/auth/login \
  -d '{"email":"user@example.com","password":"password"}'
```

**Response:**
```json
{
  "ok": false,
  "error": "Too many login attempts. Please try again after 15 minutes."
}
```

**Headers:**
```
RateLimit-Reset: 1642854900
```

**Solution:**
1. Wait 15 minutes before retrying
2. Check RateLimit-Reset header for exact time
3. Consider 2FA for account security

---

### Scenario 4: Validation Error on Ticket Creation

**Request:**
```bash
curl -X POST http://localhost:4000/api/tickets \
  -H "Authorization: Bearer token" \
  -d '{"priority":"High","boardId":"123"}'
  # Missing required: title, columnId
```

**Response:**
```json
{
  "ok": false,
  "error": "Title, boardId, and columnId are required"
}
```

**Solution:**
1. Check API documentation for required fields
2. Include all required fields in request
3. Validate input before sending

---

## Error Handling Best Practices

### Client-Side Error Handling

```javascript
try {
  const response = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title: 'New Board' })
  });

  if (!response.ok) {
    // Handle HTTP error
    const error = await response.json();
    if (response.status === 401) {
      // Re-authenticate
      redirectToLogin();
    } else if (response.status === 403) {
      // Show permission error
      showError('Insufficient permissions');
    } else if (response.status === 429) {
      // Show rate limit message
      showError('Too many requests, please wait');
    } else {
      showError(error.error);
    }
    return;
  }

  const data = await response.json();
  if (!data.ok) {
    // Handle API error
    showError(data.error);
    return;
  }

  // Success
  handleSuccess(data.data);
} catch (err) {
  showError('Network error: ' + err.message);
}
```

### Server-Side Error Logging

All errors logged to audit trail:
```bash
tail -f backend/logs/audit.log | grep "error"
```

Example audit entry:
```
::1 - user123 [22/Jan/2026:20:52:32 +0000] "POST /api/boards HTTP/1.1" 403 45 "..." user=user123 role=viewer N/A ms
```

---

## Debugging Tips

### Check Token Validity
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer {token}"
```

### Check Rate Limit Status
Look at response headers:
```bash
curl -v http://localhost:4000/api/auth/login \
  -d '{"email":"test@example.com","password":"test"}'
# Check RateLimit-* headers
```

### Test Different User Roles
1. Create users with different roles
2. Login as each role
3. Test endpoints with each token
4. Verify expected 403 errors

### Monitor Error Logs
```bash
# Watch audit log for errors
tail -f backend/logs/audit.log

# Filter by status code
grep " 403 " backend/logs/audit.log
grep " 401 " backend/logs/audit.log
grep " 429 " backend/logs/audit.log
```

---

## Error Response Consistency

### Always Include:
- ✅ `ok: false` flag
- ✅ Human-readable `error` message
- ✅ Appropriate HTTP status code
- ✅ Standard JSON format

### Never Include:
- ❌ Stack traces in production
- ❌ Internal database errors
- ❌ System file paths
- ❌ Raw exception messages

### Example Consistent Response:
```json
{
  "ok": false,
  "error": "You don't have access to this board"
}
```
**Not:**
```json
{
  "status": "error",
  "message": "Forbidden",
  "details": "User 507f1f77bcf86cd799439011 not in board members array"
}
```

---

## Future Error Enhancements

1. **Error Codes** - Machine-readable error codes (ERR_001, etc.)
2. **Detailed Errors** - Validation error details for forms
3. **Recovery Hints** - Automatic suggestions for fixes
4. **Localization** - Multi-language error messages
5. **Analytics** - Track error patterns and frequencies
