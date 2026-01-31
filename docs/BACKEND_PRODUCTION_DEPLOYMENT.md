# Production Deployment Configuration for Tasky Backend

## Quick Start

### 1. Environment Variables

First, set up your production environment variables. Create a `.env` file in the `backend/` directory:

```bash
# Server
NODE_ENV=production
PORT=4000

# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tasky?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-very-strong-random-secret-key-32-characters-minimum
JWT_EXPIRES_IN=24h

# CORS - Your frontend domain
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=warn
```

### 2. Generate a Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`.

---

## Deployment Platforms

### Option A: Render.com (Recommended - Free Tier Available)

**Steps:**

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Connect Repository**
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Choose the main branch

3. **Configure Service**
   - Name: `tasky-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free (or Starter)

4. **Set Environment Variables**
   - In Render dashboard, go to Environment
   - Add from your `.env`:
     ```
     NODE_ENV = production
     PORT = 4000
     MONGODB_URI = mongodb+srv://...
     JWT_SECRET = <your-secret>
     CORS_ORIGIN = https://your-domain.com
     LOG_LEVEL = warn
     ```

5. **Deploy**
   - Click Deploy
   - Wait for build and deployment to complete
   - Your URL: `https://tasky-backend-xxxx.onrender.com`

**Pros:**
- Free tier available
- GitHub integration
- Auto-redeploy on push
- Easy environment variables
- Built-in logs and monitoring

**Cons:**
- Free tier spins down after 15 minutes of inactivity
- Slower cold starts

---

### Option B: Railway.app (Simple & Fast)

**Steps:**

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - New Project → Deploy from GitHub Repo
   - Select Tasky repository
   - Railway auto-detects Node.js

3. **Add Variables**
   - Project → Variables
   - Add from your `.env`:
     ```
     NODE_ENV = production
     MONGODB_URI = mongodb+srv://...
     JWT_SECRET = <your-secret>
     CORS_ORIGIN = https://your-domain.com
     ```

4. **Deploy**
   - Click Deploy
   - Get your URL from Railway dashboard
   - Your URL: `https://tasky-backend-xxxx.up.railway.app`

**Pros:**
- Fast deployments
- Good free tier
- Simple setup
- Good documentation

**Cons:**
- Limited free tier resources
- May need paid plan for production

---

### Option C: Vercel (Serverless Functions)

**Note:** Requires refactoring to serverless functions. Not recommended for this project unless you need edge computing.

---

## Database Setup: MongoDB Atlas

### Create Free MongoDB Cluster

1. **Sign Up**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create account (free)

2. **Create Organization & Project**
   - Create Organization
   - Create Project (e.g., "Tasky")

3. **Build a Database**
   - Click "Build a Database"
   - Choose "Shared Clusters" (Free)
   - Select cloud provider (AWS/Google Cloud/Azure)
   - Select region closest to you
   - Click "Create Cluster"

4. **Create Database User**
   - In Security → Database Access
   - Add new database user
   - Username: `tasky_user`
   - Password: Generate strong password
   - Click "Add User"

5. **Add IP Address to Whitelist**
   - Security → Network Access
   - Add IP Address
   - Choose: "Allow access from anywhere" (0.0.0.0/0)
   - For production, add specific IP of your deployment server

6. **Get Connection String**
   - Cluster → Connect
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<username>` and `<password>` with your credentials
   - Example: `mongodb+srv://tasky_user:password@cluster.mongodb.net/tasky?retryWrites=true&w=majority`

7. **Use in Production**
   - Add to `MONGODB_URI` environment variable

---

## Production Backend Features

Your backend is configured for production with:

### Security
- ✅ Helmet.js security headers
- ✅ CORS validation against whitelist
- ✅ JWT authentication
- ✅ Rate limiting on all endpoints
- ✅ SQL injection prevention (MongoDB)

### Reliability
- ✅ Graceful shutdown handling
- ✅ Database connection pooling (5-10 connections)
- ✅ Error handling and logging
- ✅ Uncaught exception handlers
- ✅ Promise rejection handlers

### Monitoring
- ✅ Morgan logging (all requests)
- ✅ Error logging with stack traces (dev only)
- ✅ Connection status monitoring
- ✅ Performance metrics

### Performance
- ✅ Connection pooling
- ✅ Request body size limits (1MB)
- ✅ Rate limiting
- ✅ Optimized MongoDB queries

---

## After Deployment

### 1. Test Your Backend

```bash
# Health check
curl https://your-backend-domain.com/api/health

# Expected response:
# {"ok":true,"status":"healthy"}

# Test login
curl -X POST https://your-backend-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tasky.com","password":"Password123"}'

# Expected response:
# {"ok":true,"data":{"user":{...},"token":"..."}}
```

### 2. Update Frontend Configuration

Update your frontend to use the production backend URL:

**In `frontend/.env` or `frontend/.env.production`:**
```
VITE_API_URL=https://your-backend-domain.com/api
```

**Or in `frontend/src/utils/apiClient.js`:**
```javascript
const API_URL = process.env.VITE_API_URL || 'https://your-backend-domain.com/api';
```

### 3. Monitor Logs

**Render.com:**
- Go to your service
- Logs tab
- Monitor for errors

**Railway.app:**
- Go to your project
- Logs tab
- Check deployment status

### 4. Set Up Error Tracking (Optional)

Consider adding Sentry for error tracking:

```bash
npm install @sentry/node
```

---

## Environment Variables Reference

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWT tokens

### Important
- `NODE_ENV` - Set to `production`
- `CORS_ORIGIN` - Your frontend domain(s)

### Optional
- `PORT` - Default: 4000
- `JWT_EXPIRES_IN` - Token expiry. Default: 24h (production), 7d (dev)
- `LOG_LEVEL` - debug, info, warn, error. Default: warn (production), debug (dev)

---

## Troubleshooting

### "CORS error when connecting from frontend"
- Check `CORS_ORIGIN` matches your frontend domain exactly
- Include https:// and exact domain
- For multiple domains: `https://app.com,https://www.app.com`

### "Cannot connect to MongoDB"
- Verify connection string is correct
- Check MongoDB Atlas IP whitelist includes your server's IP
- Verify database user credentials

### "JWT_SECRET is undefined"
- Ensure environment variable is set in deployment platform
- Check spelling: `JWT_SECRET` (not `JWT_SECRET_KEY`)

### "Health check fails"
- Check server is listening on correct port
- Verify PORT environment variable if not 4000
- Check logs for startup errors

### "Slow response times"
- Check MongoDB connection status
- Verify rate limiting isn't blocking requests
- Check database query performance

---

## Security Checklist

Before going live:

- [ ] `JWT_SECRET` is strong and random (32+ chars)
- [ ] `CORS_ORIGIN` is set to your exact frontend domain
- [ ] `NODE_ENV=production` is set
- [ ] MongoDB has authentication enabled
- [ ] `.env` is in `.gitignore` (never commit secrets)
- [ ] Use HTTPS everywhere
- [ ] Rate limiting is enabled
- [ ] Helmet.js headers are configured
- [ ] Error messages don't leak sensitive info
- [ ] Logs are monitored

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Set up MongoDB Atlas database
3. ✅ Deploy to Render/Railway
4. ✅ Test backend endpoints
5. ✅ Update frontend with production URL
6. ✅ Deploy frontend
7. ✅ Monitor logs and errors
8. ✅ Set up uptime monitoring (optional)

---

## Additional Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas
- **Express.js Security:** https://expressjs.com/en/advanced/best-practice-security.html
- **OWASP Security:** https://owasp.org/Top10/

---

**Your backend is now ready for production! 🚀**
