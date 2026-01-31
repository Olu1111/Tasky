#!/bin/bash

# Production Deployment Checklist & Guide for Tasky Backend
# This script helps verify your backend is ready for production deployment

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 TASKY BACKEND PRODUCTION DEPLOYMENT GUIDE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_requirement() {
  local item=$1
  local check=$2
  
  if eval "$check"; then
    echo -e "${GREEN}✓${NC} $item"
    return 0
  else
    echo -e "${RED}✗${NC} $item"
    return 1
  fi
}

echo -e "${BLUE}STEP 1: Pre-Deployment Checks${NC}"
echo "─────────────────────────────────────────────────────────────"

# Check Node modules
check_requirement "Node modules installed" "[ -d './node_modules' ]" || {
  echo -e "${YELLOW}→ Installing dependencies...${NC}"
  npm install
}

# Check environment file
check_requirement "Environment variables defined" "[ -f './.env' ]" || {
  echo -e "${RED}✗ .env file not found${NC}"
  echo -e "${YELLOW}→ Copy .env.example to .env and fill in values${NC}"
  cp .env.example .env
  echo -e "${YELLOW}→ Now edit .env with your production values${NC}"
  exit 1
}

# Check MongoDB connection
echo ""
echo -e "${BLUE}STEP 2: Database Configuration${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Ensure your .env has:${NC}"
echo "  • MONGODB_URI: Connection string for production MongoDB"
echo "    Recommended: MongoDB Atlas (https://www.mongodb.com/cloud/atlas)"
echo "    Format: mongodb+srv://username:password@cluster.mongodb.net/tasky"
echo ""

# Check JWT secret
echo -e "${BLUE}STEP 3: Security Configuration${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Ensure your .env has:${NC}"
echo "  • JWT_SECRET: Strong random string (min 32 characters)"
echo "    Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo "  • NODE_ENV: Set to 'production'"
echo ""

# Check CORS origin
echo -e "${BLUE}STEP 4: CORS Configuration${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Ensure your .env has:${NC}"
echo "  • CORS_ORIGIN: Your frontend domain (e.g., https://app.example.com)"
echo "    Multiple origins: https://app.example.com,https://www.example.com"
echo ""

echo -e "${BLUE}STEP 5: Choose Your Deployment Platform${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""

echo -e "${YELLOW}Option A: Deploy to Render.com${NC}"
echo "  1. Go to https://render.com"
echo "  2. Sign up and create a new account"
echo "  3. Connect your GitHub repository"
echo "  4. Create new Web Service"
echo "  5. Configure:"
echo "     • Build Command: npm install"
echo "     • Start Command: npm start"
echo "     • Environment Variables (from .env):"
echo "       - NODE_ENV: production"
echo "       - MONGODB_URI: <your connection string>"
echo "       - JWT_SECRET: <your secret>"
echo "       - CORS_ORIGIN: <your frontend domain>"
echo "       - LOG_LEVEL: warn"
echo "  6. Deploy"
echo "  7. Your backend URL: https://tasky-backend-xxxx.onrender.com"
echo ""

echo -e "${YELLOW}Option B: Deploy to Railway.app${NC}"
echo "  1. Go to https://railway.app"
echo "  2. Sign up with GitHub"
echo "  3. New Project → Deploy from GitHub Repo"
echo "  4. Select Tasky repository"
echo "  5. Set environment variables:"
echo "     • NODE_ENV: production"
echo "     • MONGODB_URI: <your connection string>"
echo "     • JWT_SECRET: <your secret>"
echo "     • CORS_ORIGIN: <your frontend domain>"
echo "  6. Railway auto-detects Node.js and deploys"
echo "  7. Your backend URL: https://tasky-backend-xxxx.up.railway.app"
echo ""

echo -e "${YELLOW}Option C: Deploy to Vercel (Serverless)${NC}"
echo "  Note: Requires restructuring to serverless functions"
echo "  See: https://vercel.com/docs/functions/nodejs"
echo ""

echo -e "${BLUE}STEP 6: Database Setup${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Create MongoDB Atlas Cluster (Free Tier available):${NC}"
echo "  1. Go to https://www.mongodb.com/cloud/atlas"
echo "  2. Create a free account"
echo "  3. Create a new Project"
echo "  4. Build a Database → Free Shared"
echo "  5. Choose cloud provider and region"
echo "  6. Create cluster"
echo "  7. Create database user (username/password)"
echo "  8. Add your IP address to network access"
echo "  9. Get connection string:"
echo "     • Click 'Connect'"
echo "     • Copy connection string"
echo "     • Replace <username> and <password>"
echo "  10. Use as MONGODB_URI in production"
echo ""

echo -e "${BLUE}STEP 7: Frontend Configuration${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Update your frontend to use production backend:${NC}"
echo "  1. In frontend/.env (or .env.production):"
echo "     VITE_API_URL=https://your-backend-domain.com/api"
echo "  2. Update all API calls to use the production URL"
echo "  3. Example: http://localhost:4000 → https://your-backend-domain.com"
echo ""

echo -e "${BLUE}STEP 8: Verify Deployment${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}After deployment, test with:${NC}"
echo "  • Health check: GET https://your-backend-domain.com/api/health"
echo "  • Login endpoint: POST https://your-backend-domain.com/api/auth/login"
echo "  • Should return: {\"ok\": true}"
echo ""

echo -e "${BLUE}STEP 9: Production Monitoring${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Monitor your deployment:${NC}"
echo "  • Render.com: Dashboard → Logs"
echo "  • Railway.app: Project → Logs"
echo "  • Check for errors and performance metrics"
echo ""

echo -e "${BLUE}STEP 10: Production Environment Variables Checklist${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "Required variables:"
echo "  ✓ NODE_ENV=production"
echo "  ✓ PORT=4000 (or auto-assigned by platform)"
echo "  ✓ MONGODB_URI=mongodb+srv://..."
echo "  ✓ JWT_SECRET=<strong-random-string>"
echo "  ✓ CORS_ORIGIN=https://your-frontend-domain.com"
echo "  ✓ JWT_EXPIRES_IN=24h (optional, default provided)"
echo "  ✓ LOG_LEVEL=warn (optional, default provided)"
echo ""

echo -e "${BLUE}STEP 11: Security Best Practices${NC}"
echo "─────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Production security checklist:${NC}"
echo "  □ Never commit .env to Git (add to .gitignore)"
echo "  □ Use strong JWT_SECRET (32+ characters, random)"
echo "  □ Restrict CORS_ORIGIN to your frontend domain only"
echo "  □ Use HTTPS for all connections"
echo "  □ Set MongoDB IP whitelist to your deployment server"
echo "  □ Enable MongoDB authentication"
echo "  □ Monitor logs for suspicious activity"
echo "  □ Set up error tracking (e.g., Sentry)"
echo "  □ Enable rate limiting (already configured)"
echo "  □ Use helmet.js security headers (already configured)"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Ready to deploy? Follow the steps above!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Final recommendations
echo -e "${BLUE}Additional Resources${NC}"
echo "─────────────────────────────────────────────────────────────"
echo "  • Render Docs: https://render.com/docs"
echo "  • Railway Docs: https://docs.railway.app"
echo "  • MongoDB Atlas: https://www.mongodb.com/docs/atlas"
echo "  • Express.js Security: https://expressjs.com/en/advanced/best-practice-security.html"
echo ""
