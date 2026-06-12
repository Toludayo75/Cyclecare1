# Deployment Guide

This guide covers deploying your Cyclecare Health Manager to production using Render, Netlify, and Expo.

## Prerequisites

- Aiven PostgreSQL database (you already have this)
- Render account (free tier available)
- Netlify account (free tier available)
- GitHub account with your monorepo pushed

---

## Phase 1: Add GitHub Secrets for CI/CD

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

```
Name: DATABASE_URL
Value: postgresql://user:password@aiven-host:5432/cyclecare
(copy this from your Aiven dashboard)

Name: SESSION_SECRET
Value: (generate a random 32+ character string, e.g., openssl rand -base64 32)

Name: PAYSTACK_SECRET_KEY
Value: sk_live_xxxx (your Paystack secret key)

Name: ALLOWED_ORIGINS
Value: https://admin.example.com,https://ngo.example.com,https://example.com,https://api.example.com

Name: EXPO_PUBLIC_DOMAIN
Value: https://api.example.com

Name: RENDER_SERVICE_ID
Value: (you'll get this after creating Render service)

Name: RENDER_DEPLOY_KEY
Value: (you'll get this from Render)

Name: NETLIFY_AUTH_TOKEN
Value: (you'll get this from Netlify)

Name: NETLIFY_ADMIN_SITE_ID
Value: (you'll get this when creating admin site on Netlify)

Name: NETLIFY_NGO_SITE_ID
Value: (you'll get this when creating NGO site on Netlify)

Name: NETLIFY_PUBLIC_SITE_ID
Value: (you'll get this when creating public site on Netlify)
```

---

## Phase 2: Deploy API to Render

### Step 1: Create a Render account
1. Go to https://render.com
2. Sign up with GitHub (recommended, makes deployment easier)

### Step 2: Create a new Web Service
1. Dashboard → **New +** → **Web Service**
2. Connect your GitHub repo
3. Fill in details:
   - **Name**: cyclecare-api
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm --filter @workspace/api-server run build`
   - **Start Command**: `node artifacts/api-server/dist/index.mjs`
   - **Environment**: Production

> Render provides `PORT` automatically for the web service, and the app already reads `process.env.PORT`. Do not override the Render-assigned port with a fixed value unless you know the platform requires it.

### Step 3: Add environment variables
1. In Render dashboard → Your service → **Environment**
2. Add all these variables (values from Step 1):
   - DATABASE_URL
   - SESSION_SECRET
   - PAYSTACK_SECRET_KEY
   - ALLOWED_ORIGINS
   - No manual `PORT` is required in Render environment unless explicitly needed by your service

> Render uses its own dynamically assigned port. The app is already configured to bind to `process.env.PORT`.

> For `DATABASE_URL`, use the Aiven-provided connection string and remove any local file path references like `sslrootcert=C:/Users/Hp/.../ca.pem`. Render cannot access files on your local machine.

### Step 4: Deploy
1. Render will auto-deploy from your GitHub repo
2. Wait for build to complete (takes ~5 min)
3. Your API will be live at: `https://cyclecare-api.onrender.com` (or your custom domain)

### Step 5: Get deploy info for GitHub Actions
1. Go to **Account Settings** → **API Keys**
2. Generate an API Key → copy it (this is your RENDER_DEPLOY_KEY)
3. Go back to your service → **Settings** → copy the Service ID (RENDER_SERVICE_ID)
4. Add these to GitHub Secrets (Phase 1)

---

## Phase 3: Deploy Web Apps to Netlify

### Step 1: Create Netlify account
1. Go to https://netlify.com
2. Sign up with GitHub (recommended)

### Step 2: Deploy Admin Dashboard
1. **New site from Git** → Choose your GitHub repo
2. Fill in:
   - **Base directory**: `artifacts/admin`
   - **Build command**: `pnpm --filter @workspace/admin run build`
   - **Publish directory**: `dist`
3. Click **Deploy site**
4. Wait for build (~3-5 min)
5. Go to **Site settings** → copy your **Site ID** (this is NETLIFY_ADMIN_SITE_ID)

### Step 3: Deploy NGO Portal
Repeat Step 2 but:
   - **Base directory**: `artifacts/ngo-portal`
   - **Build command**: `pnpm --filter @workspace/ngo-portal run build`
   - Copy the Site ID (NETLIFY_NGO_SITE_ID)

### Step 4: Deploy Public Dashboard
Repeat Step 2 but:
   - **Base directory**: `artifacts/public-dashboard`
   - **Build command**: `pnpm --filter @workspace/public-dashboard run build`
   - Copy the Site ID (NETLIFY_PUBLIC_SITE_ID)

> If you use client-side routing, Netlify needs a redirect rule so refreshes and direct URLs resolve to `index.html`.
> The repo already includes `public/_redirects` for the frontends, so you should not need extra Netlify redirect setup.

### Step 5: Get Netlify Auth Token
1. **User settings** → **Applications**
2. Create a **Personal access token**
3. Copy it (this is NETLIFY_AUTH_TOKEN)
4. Add all these to GitHub Secrets (Phase 1)

---

## Phase 4: Build Expo APK (No Money? Use Local Build)

### Option A: Free Local Build (No EAS needed)

Since you don't have money yet, build the APK on your machine without EAS.

#### Prerequisites
- Android SDK / Android Studio installed
- JAVA_HOME set to JDK location

#### Steps

1. **Generate a keystore for signing** (one-time)
   ```powershell
   cd c:\Users\Hp\Downloads\Cyclecare-Health-Manager\artifacts\cyclecare
   keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias cyclecare
   ```
   - Enter a password (remember it!)
   - Fill in your name, organization, etc.
   - File will be saved as `my-release-key.keystore`

2. **Create `eas.json` in repo root** (so Expo knows build settings)
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       },
       "preview2": {
         "android": {
           "buildType": "apk"
         }
       },
       "preview3": {
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "aab"
         }
       }
     }
   }
   ```

3. **Build the APK locally**
   ```powershell
   cd artifacts/cyclecare
   npx eas-cli build --platform android --local
   ```
   - This uses your local Android SDK to build
   - Takes 10-20 minutes
   - Output APK will be in `./dist` or a temp folder
   - EAS CLI will show you where it saved the APK

4. **Test the APK**
   - Copy APK to an Android phone via USB or use Android emulator
   - Install and test

### Option B: Once You Have Money - Use EAS Build (Recommended)

```powershell
npm install -g eas-cli
cd artifacts/cyclecare

# Login
eas login

# Build APK in the cloud (much faster, handles signing)
eas build --platform android

# When done, APK download link will be shown
```

---

## Phase 5: Test Everything

### Test API
```powershell
curl https://api.example.com/health
```
Should return: `200 OK` and some status data

### Test Admin Dashboard
Go to: `https://admin.example.com`
Should load without errors

### Test NGO Portal
Go to: `https://ngo.example.com`
Should load without errors

### Test Public Dashboard
Go to: `https://example.com`
Should load without errors

### Test Mobile App
- Install APK on Android phone
- Open the app
- Should connect to your API at `https://api.example.com`

---

## Phase 6: Automatic Deployment (GitHub Actions)

From now on, every time you push code to GitHub:

1. GitHub Actions automatically:
   - Installs dependencies
   - Builds all packages
   - Deploys API to Render
   - Deploys web apps to Netlify
   - Creates APK build artifacts (if configured)

2. Check deployment status:
   - Go to your GitHub repo → **Actions** tab
   - Click on the latest workflow run
   - See build logs and status

---

## Troubleshooting

### API won't start on Render
- Check Render logs: Dashboard → Your service → **Logs**
- Verify DATABASE_URL is correct
- Verify SESSION_SECRET is set

### Web app won't deploy on Netlify
- Check Netlify logs: Your site → **Deploys**
- Verify build command is correct
- Check that `dist` folder exists after build

### APK won't install on phone
- Make sure your phone allows "Unknown sources"
- Try on Android 7+ (older versions might have issues)
- Check that `EXPO_PUBLIC_DOMAIN` points to your API

---

## Next Steps (Optional but Recommended)

1. **Set custom domains** instead of `*.onrender.com` and `*.netlify.app`
   - Render: Site settings → Custom domain
   - Netlify: Site settings → Domain management
   - Update DNS records to point to your hosts

2. **Add HTTPS/SSL certificates** (should be automatic on Render/Netlify, but verify)

3. **Monitor errors** (add Sentry or similar)

4. **Add logging** (Render/Netlify show logs automatically)

5. **Test from your phone** with the real URLs

---

**Your apps are now production-ready!** 🚀
