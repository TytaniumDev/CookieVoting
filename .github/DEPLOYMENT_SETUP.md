# Firebase Hosting & GitHub CI/CD Setup Guide

This guide will help you set up automatic deployments to Firebase Hosting using GitHub Actions.

## Prerequisites

1. A Firebase project (already configured: `cookie-voting`)
2. A GitHub repository
3. Firebase CLI installed locally (already installed as dev dependency)

## Step 1: Get Firebase CI Token

You need to generate a Firebase CI token for GitHub Actions to authenticate:

1. **Install Firebase CLI globally** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Generate CI token**:
   ```bash
   firebase login:ci
   ```
   
   This will output a token that looks like: `1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   
   **Copy this token** - you'll need it in the next step.

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: Paste the token from Step 1
5. Click **Add secret**

## Step 3: Verify Configuration

The following files have been configured:

- ✅ `firebase.json` - Hosting configuration added
- ✅ `.github/workflows/deploy.yml` - CI/CD workflow created
- ✅ `package.json` - Deployment scripts added

## Step 4: Test Local Deployment (Optional)

Before pushing to GitHub, you can test the deployment locally:

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
npm run deploy

# Or deploy everything (hosting + rules)
npm run firebase:deploy:all
```

## Step 5: Push to GitHub

Once you push to the `main` or `master` branch, GitHub Actions will automatically:

1. ✅ Run tests
2. ✅ Build the project
3. ✅ Deploy to Firebase Hosting
4. ✅ Deploy Firestore and Storage rules

## Manual Deployment

You can also deploy manually using:

```bash
# Deploy only hosting
npm run firebase:deploy:hosting

# Deploy only rules
npm run firebase:deploy:rules

# Deploy everything
npm run firebase:deploy:all

# Build and deploy hosting (recommended)
npm run deploy
```

## GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) runs on:
- ✅ Push to `main` or `master` branch
- ✅ Pull requests to `main` or `master` (runs tests only)
- ✅ Manual trigger via GitHub Actions UI

## Troubleshooting

### Authentication Issues
If deployment fails with authentication errors:
1. Regenerate the Firebase token: `firebase login:ci`
2. Update the `FIREBASE_TOKEN` secret in GitHub

### Build Failures
- Check that all dependencies are in `package.json`
- Verify `npm ci` works locally
- Check GitHub Actions logs for specific errors

### Deployment Failures
- Verify Firebase project ID matches in `.firebaserc`
- Check that Firebase project has Hosting enabled
- Ensure you have proper permissions in Firebase Console

## Firebase Hosting Features

The hosting configuration includes:
- ✅ SPA routing support (all routes redirect to `index.html`)
- ✅ Static asset caching (1 year for JS/CSS/images)
- ✅ Automatic HTTPS
- ✅ CDN distribution

## Cost

- **GitHub Actions**: Free for public repositories. For private repos, you get 2,000 minutes/month free.
- **Firebase Hosting**: Free tier includes:
  - 10 GB storage
  - 360 MB/day data transfer
  - Custom domain support

Both services are free for typical usage!

