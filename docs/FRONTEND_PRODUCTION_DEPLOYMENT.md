# Frontend Production Deployment Guide

## Quick Start - Deploy in 15 Minutes

### Option A: Vercel (Recommended - Easiest)

**Steps:**

1. **Go to Vercel**
   - https://vercel.com
   - Sign up/login with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select Tasky repository
   - Choose frontend directory (or entire repo)

3. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_URL = https://your-backend-domain.com/api
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build (1-2 minutes)
   - Your URL: `https://tasky-xxx.vercel.app`

6. **Connect Custom Domain (Optional)**
   - Settings → Domains
   - Add your domain
   - Follow DNS instructions

**Pros:**
- ✅ Easiest setup
- ✅ Automatic HTTPS
- ✅ Built-in CDN (Vercel Edge Network)
- ✅ Great caching headers
- ✅ GitHub integration
- ✅ Free tier available
- ✅ Preview deployments

**Cons:**
- Some features require paid plan

**Time:** 10-15 minutes

---

### Option B: Netlify (Great Alternative)

**Steps:**

1. **Go to Netlify**
   - https://netlify.com
   - Sign up/login with GitHub

2. **Create New Site**
   - New site from Git
   - Select repository
   - Choose GitHub account and repo

3. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Netlify auto-detects Vite

4. **Add Environment Variables**
   - Settings → Build & Deploy → Environment
   - Add:
     ```
     VITE_API_URL = https://your-backend-domain.com/api
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build
   - Your URL: `https://tasky-xxxx.netlify.app`

6. **Connect Custom Domain**
   - Domain Management → Custom domains
   - Add your domain
   - Update DNS records

**Pros:**
- ✅ Easy GitHub integration
- ✅ Free tier with good features
- ✅ Built-in CDN
- ✅ Automatic HTTPS
- ✅ Netlify forms
- ✅ Split testing

**Cons:**
- Slightly slower builds than Vercel

**Time:** 10-15 minutes

---

## Configuration Details

### Environment Variables

**Production (.env.production):**
```env
VITE_API_URL=https://your-backend-domain.com/api
```

**Development (.env):**
```env
VITE_API_URL=http://localhost:4000/api
```

### Caching Headers

Your frontend is configured with optimal caching:

```
index.html:     Cache 1 hour (must revalidate - app updates)
/js/*:          Cache 1 year (immutable - hash in filename)
/css/*:         Cache 1 year (immutable - hash in filename)
/images/*:      Cache 1 year (immutable - hash in filename)
/fonts/*:       Cache 1 year (immutable - hash in filename)
```

**Why this works:**
- Vite adds hash to filenames: `main-abc123.js`
- If file changes, hash changes
- Browser requests new file (cache busts automatically)
- Older files cached forever (safe because hash changed)

### Security Headers

Configured in both Vercel and Netlify:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000
```

### SPA Routing

Both platforms configured to route all requests to `index.html` for React Router:

```
/any-path → /index.html (React Router handles routing)
```

---

## Build Optimization

### Production Build Features

Your `vite.config.js` includes:

- ✅ Terser minification
- ✅ Console.log removal in production
- ✅ Asset hashing for cache busting
- ✅ Chunk splitting for better caching
- ✅ Sourcemap disabled (smaller bundle)
- ✅ Code splitting by route

### Bundle Analysis

```bash
# Check bundle size
npm run build

# Output shows dist size:
# dist/index.html          0.55 kB │ gzip:  0.33 kB
# dist/js/main-abc123.js  250.45 kB │ gzip: 85.22 kB
```

---

## Custom Domain Setup

### For Vercel

1. **Buy Domain** (Vercel recommends Namecheap, GoDaddy)
   - Or use existing domain

2. **In Vercel Dashboard**
   - Project → Settings → Domains
   - Add domain
   - Choose automatic or manual DNS

3. **Automatic DNS (Easiest)**
   - Vercel manages DNS
   - Point nameservers to Vercel
   - Takes 24-48 hours

4. **Manual DNS**
   - Get Vercel's DNS records
   - Update in your domain registrar
   - Add CNAME/A records
   - Takes 5-30 minutes

### For Netlify

1. **Connect Domain**
   - Site settings → Domain management
   - Add domain
   - Use Netlify DNS or update existing DNS

2. **DNS Records**
   - Create A record or CNAME
   - Update at your registrar
   - HTTPS auto-configured

---

## Testing Before Deployment

### Local Build Test

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Check output
# dist/ folder created with optimized files
```

### Test with Backend

```bash
# Update .env to use backend URL
# For local: http://localhost:4000/api
# For production: https://your-backend.com/api

# Run dev server
npm run dev

# Test login, API calls, etc.
```

---

## After Deployment

### 1. Test Everything

```bash
# Health check
curl https://your-frontend-domain.com

# Check if it loads
# Network tab should show gzipped assets
# Console should be clean (no errors)
```

### 2. Verify API Connection

```bash
# In browser console:
# Make a test API call to verify backend connection
```

### 3. Check Performance

Use Lighthouse (in Chrome DevTools):
- Performance: Should be 90+
- Accessibility: Should be 90+
- Best Practices: Should be 90+
- SEO: Should be 90+

### 4. Monitor Deployments

**Vercel:**
- Analytics → Web Analytics
- Monitor page load time, user metrics

**Netlify:**
- Analytics dashboard
- Deploy logs and status

---

## Troubleshooting

### CORS Error from Frontend

**Problem:** Frontend can't reach backend

**Solutions:**
1. Verify `VITE_API_URL` is set correctly
2. Check backend `CORS_ORIGIN` includes frontend domain
3. Ensure backend is accessible from frontend

```bash
# Test from browser console:
fetch('https://your-backend.com/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Deployment Fails

**Check:**
1. Does `npm run build` work locally?
2. Are all dependencies installed?
3. Are environment variables set in deployment platform?
4. Check deployment logs for errors

### Page Not Loading

**Solutions:**
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Check if route is correct (should be `/index.html`)
4. Check browser console for JS errors

### Slow Page Load

**Optimizations:**
1. Check bundle size: `npm run build`
2. Lazy load routes (already configured in React Router)
3. Use CDN (both Vercel and Netlify include CDN)
4. Compress images
5. Remove unused dependencies

---

## Environment Variables Reference

### Required
- `VITE_API_URL` - Backend API URL

### Optional
- `VITE_ANALYTICS_ID` - Analytics tracking
- `VITE_SENTRY_DSN` - Error tracking
- `VITE_ENABLE_DEBUG` - Debug mode flag

### How to Add

**In Vercel:**
1. Project → Settings → Environment Variables
2. Add name and value
3. Select environments (Production, Preview, Development)

**In Netlify:**
1. Site → Settings → Build & Deploy → Environment
2. Edit environment variables
3. Or use `netlify.toml` file

---

## Performance Checklist

- [ ] Bundle size < 300KB gzipped
- [ ] Lighthouse score > 90
- [ ] Page load < 3 seconds
- [ ] CORS headers present
- [ ] Cache headers correct
- [ ] Security headers present
- [ ] No console errors
- [ ] API calls working

---

## Security Checklist

- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Security headers configured
- [ ] No sensitive data in code
- [ ] API URL configurable (via env vars)
- [ ] No hardcoded secrets
- [ ] CSP headers configured (if needed)

---

## Deployment Comparison

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Setup Time | 5 min | 5 min |
| Free Tier | Yes | Yes |
| CDN | Vercel Edge | Netlify CDN |
| Custom Domain | Yes | Yes |
| Environment Variables | Yes | Yes |
| Preview Deployments | Yes | Yes |
| Performance | Excellent | Good |
| Ease of Use | Very Easy | Easy |

**Recommendation:** Vercel is slightly easier and faster, but both are great choices.

---

## Next Steps

1. ✅ Build frontend locally: `npm run build`
2. ✅ Choose Vercel or Netlify
3. ✅ Connect GitHub repository
4. ✅ Add environment variables
5. ✅ Deploy
6. ✅ Test all endpoints
7. ✅ Set up custom domain (optional)
8. ✅ Monitor performance

---

## Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Vite Production Guide:** https://vite.dev/guide/ssr.html
- **React Router Deployment:** https://reactrouter.com/
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse

---

**Your frontend is ready to deploy! 🚀**

Choose Vercel or Netlify and deploy in under 15 minutes!
