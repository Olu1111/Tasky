# Backend Production Deployment - Complete Setup Guide

## 🎯 Deployment Checklist

- [x] Backend configured for production
- [x] Security headers and CORS configured
- [x] Database connection pooling enabled
- [x] Logging and monitoring set up
- [x] Error handling and graceful shutdown
- [x] Environment variable templates created
- [x] Deployment platform configs (Render/Railway)

## 📋 What's Been Configured

### 1. **Security (✅ app.js)**
```javascript
// Helmet.js security headers with production CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", corsOrigin]
    }
  }
}));

// Strict CORS validation
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
};
```

### 2. **Database Connection (✅ config/db.js)**
```javascript
// Production connection pooling
const options = {
  maxPoolSize: 10,      // Production: 10 connections
  minPoolSize: 5,       // Production: maintain 5
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true
};

// Connection monitoring
mongoose.connection.on("disconnected", () => { /* ... */ });
mongoose.connection.on("reconnected", () => { /* ... */ });
```

### 3. **Graceful Shutdown (✅ server.js)**
```javascript
// Handle SIGTERM (deployment shutdown signals)
process.on("SIGTERM", () => {
  console.log("SIGTERM received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
```

### 4. **Logging & Monitoring (✅ app.js)**
```javascript
// Production: Console logging (captured by deployment platform)
// Development: File + Console logging

if (isProduction) {
  app.use(morgan(securityLogFormat));  // Console logs
} else {
  app.use(morgan(securityLogFormat, { stream: auditStream }));  // File logs
  app.use(morgan("dev"));  // Console logs
}
```

### 5. **Error Handling (✅ middleware/error.js)**
```javascript
// Production: Hide sensitive error details
const errorResponse = {
  ok: false,
  error: isProduction && status === 500 ? "Internal Server Error" : message
};

// Development: Include stack traces
if (!isProduction) {
  errorResponse.stack = err.stack;
}
```

### 6. **Environment Variables (✅ config/env.js)**
```javascript
return {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || (isProduction ? "24h" : "7d"),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  isProduction,
  logLevel: process.env.LOG_LEVEL || (isProduction ? "warn" : "debug"),
};
```

---

## 🚀 Deployment Steps

### Step 1: Database Setup (MongoDB Atlas)

**Free Tier Available!**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and organization
3. Create project (e.g., "Tasky")
4. Click "Build a Database" → "Shared Cluster" (Free)
5. Choose cloud provider (AWS, GCP, Azure)
6. Click "Create Cluster"
7. **Create Database User:**
   - Security → Database Access
   - Username: `tasky_user`
   - Password: Generate strong password
   - Click "Add User"
8. **Add IP to Whitelist:**
   - Security → Network Access
   - For development: "Allow access from anywhere"
   - For production: Add specific server IP
9. **Get Connection String:**
   - Cluster → Connect
   - Copy connection string
   - Replace `<username>` and `<password>`
   - Example: `mongodb+srv://tasky_user:password@cluster.mongodb.net/tasky?retryWrites=true&w=majority`

### Step 2: Environment Variables

**Create `.env` in `backend/` directory:**

```bash
# Server
NODE_ENV=production
PORT=4000

# Database (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tasky?retryWrites=true&w=majority

# Security
JWT_SECRET=<your-strong-random-32-char-string>
JWT_EXPIRES_IN=24h

# Frontend domain (CORS)
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=warn
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Choose Deployment Platform

---

## ✅ OPTION A: Render.com (Recommended)

**Best for:** Beginners, quick setup, free tier available

**Steps:**

1. **Create Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Connect Repository**
   - Dashboard → New → Web Service
   - Select Tasky GitHub repository
   - Choose main branch

3. **Configure Service**
   - **Name:** `tasky-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter paid)

4. **Set Environment Variables**
   - Environment tab
   - Add variables:
   ```
   NODE_ENV = production
   PORT = 4000
   MONGODB_URI = mongodb+srv://...
   JWT_SECRET = <your-secret>
   CORS_ORIGIN = https://your-frontend.com
   LOG_LEVEL = warn
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build (2-3 minutes)
   - Get your URL: `https://tasky-backend-xxxx.onrender.com`

**Pros:**
- ✅ Easiest to set up
- ✅ Free tier available
- ✅ GitHub auto-deploy on push
- ✅ Built-in logs and monitoring
- ✅ Auto-redeploy on code updates

**Cons:**
- ⚠️ Free tier spins down after 15 min inactivity (slow cold start)
- ⚠️ Limited for production use

---

## ✅ OPTION B: Railway.app (Fast & Simple)

**Best for:** Production, better performance than Render free tier

**Steps:**

1. **Create Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create Project**
   - New Project → Deploy from GitHub Repo
   - Select Tasky repository
   - Railway auto-detects Node.js

3. **Add Environment Variables**
   - Project → Variables
   - Add variables:
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://...
   JWT_SECRET = <your-secret>
   CORS_ORIGIN = https://your-frontend.com
   ```

4. **Deploy**
   - Click Deploy
   - Wait for build
   - Get your URL from Railway dashboard
   - Example: `https://tasky-backend-xxxx.up.railway.app`

**Pros:**
- ✅ Better performance than Render free
- ✅ Simple setup
- ✅ Good free tier
- ✅ Good documentation

**Cons:**
- ⚠️ Limited free tier resources
- ⚠️ May need paid plan for production

---

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://your-backend-domain.com/api/health

# Expected response:
# {"ok":true,"status":"healthy"}
```

### Login Test
```bash
curl -X POST https://your-backend-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tasky.com","password":"Password123"}'

# Expected response with token
```

### Check CORS
```bash
curl -X OPTIONS https://your-backend-domain.com/api/health \
  -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: GET" -v

# Should return 200 OK with CORS headers
```

---

## 🔧 Update Frontend Configuration

After backend is deployed, update your frontend:

**In `frontend/.env` or `frontend/.env.production`:**
```
VITE_API_URL=https://your-backend-domain.com/api
```

**Or in `frontend/src/utils/apiClient.js`:**
```javascript
const API_URL = process.env.VITE_API_URL || 'https://your-backend-domain.com/api';
```

---

## 📊 Monitoring & Logs

### Render.com
- Service dashboard → Logs tab
- View real-time logs
- Check for errors and performance

### Railway.app
- Project dashboard → Logs tab
- Check deployment status
- View error logs

### What to Monitor
- API response times
- Error rates
- Database connection status
- Rate limiting triggers
- CORS errors

---

## 🔐 Production Security Checklist

Before going live:

- [ ] `JWT_SECRET` is strong (32+ random characters)
- [ ] `CORS_ORIGIN` is exact frontend domain (no typos)
- [ ] `NODE_ENV=production` is set
- [ ] `.env` file is NOT in Git (check .gitignore)
- [ ] MongoDB has authentication
- [ ] MongoDB IP whitelist is restrictive
- [ ] HTTPS is enabled on both frontend and backend
- [ ] Rate limiting is active (default: 100 requests/15 min)
- [ ] Error messages don't leak sensitive info
- [ ] Logs are being monitored

---

## 📝 Production Environment Variables Reference

```env
# Required
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-string>

# Important
CORS_ORIGIN=https://your-domain.com

# Optional with defaults
PORT=4000
JWT_EXPIRES_IN=24h
LOG_LEVEL=warn
```

---

## 🆘 Troubleshooting

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Check `CORS_ORIGIN` matches frontend domain exactly
- Include `https://`
- No trailing slash
- For multiple domains: `https://app.com,https://www.app.com`

### "Cannot connect to MongoDB"
**Solutions:**
- Verify connection string (replace `<username>` and `<password>`)
- Check MongoDB Atlas IP whitelist includes server IP
- Verify database user exists and is active
- Check network connectivity

### JWT Secret Undefined
**Solution:**
- Verify `JWT_SECRET` in environment variables
- Check spelling (case-sensitive)
- Restart deployment after adding variable

### Slow Response Times
**Solutions:**
- Check database connection status
- Verify MongoDB is responding
- Check rate limits aren't blocking requests
- Monitor logs for slow queries

### Deployment Fails
**Solutions:**
- Check logs for error messages
- Verify all environment variables are set
- Check Node version compatibility (>14)
- Ensure package.json has correct scripts

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas
- **Express.js Security:** https://expressjs.com/en/advanced/best-practice-security.html
- **OWASP Top 10:** https://owasp.org/Top10/
- **Node.js Production Best Practices:** https://nodejs.org/en/docs/guides/nodejs-web-app-best-practices/

---

## 🎉 Success Indicators

Your backend is successfully deployed when:

✅ Health check returns 200 OK  
✅ Login endpoint works with valid credentials  
✅ Frontend can connect and authenticate  
✅ Logs show no errors  
✅ CORS headers are present  
✅ Rate limiting is active  
✅ Database queries are responsive  

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs** in your deployment platform
2. **Verify environment variables** are correctly set
3. **Test endpoints** with curl or Postman
4. **Check database connection** status
5. **Review error messages** carefully
6. **Check GitHub issues** for similar problems

---

**Your Tasky backend is now production-ready! 🚀**

Next: Deploy your frontend to production!
