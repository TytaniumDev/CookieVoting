# Test User Setup Instructions

## Quick Setup: Using GitHub Authentication for Test User

The test user now uses **GitHub OAuth authentication** for a secure, maintainable test account.

## Step 1: Create GitHub OAuth App

1. **Go to GitHub Developer Settings**:
   - Visit: https://github.com/settings/developers
   - Or: GitHub → Your Profile (top right) → Settings → Developer settings → OAuth Apps

2. **Create a new OAuth App**:
   - Click **"New OAuth App"** button (or if you see "OAuth Apps" in the sidebar, click that first, then "New OAuth App")

3. **Fill in the OAuth App details**:
   - **Application name**: `Cookie Voting (Local Dev)` (or any name you prefer)
   - **Homepage URL**: `http://localhost:5173` (your local development URL)
   - **Authorization callback URL**: `https://cookie-voting.firebaseapp.com/__/auth/handler`
     - ⚠️ **Important**: This must match exactly!
     - Format: `https://<your-firebase-auth-domain>/__/auth/handler`
     - Your auth domain is: `cookie-voting.firebaseapp.com`
     - You can verify this in Firebase Console → Authentication → Settings → Authorized domains
   - **Click "Register application"**

4. **Get your Client ID and Client Secret**:
   - After registering, you'll see your **Client ID** immediately (it's visible on the page)
   - **Copy the Client ID** - you'll need this for Firebase
   - For the **Client Secret**:
     - Look for a section that says "Client secrets"
     - Click **"Generate a new client secret"** button
     - ⚠️ **CRITICAL**: Copy the secret immediately - GitHub only shows it ONCE!
     - If you lose it, you'll need to generate a new one
     - Save both values somewhere safe (you'll need them in the next step)

## Step 2: Enable GitHub Authentication in Firebase

1. **Go to Firebase Console**:
   - Visit: https://console.firebase.google.com/
   - Select your project: `cookie-voting`

2. **Navigate to Authentication**:
   - Click **"Authentication"** in the left sidebar
   - Or go directly to:
     https://console.firebase.google.com/project/cookie-voting/authentication

3. **Enable GitHub sign-in**:
   - Click on the **"Sign-in method"** tab (at the top)
   - Scroll down or look for **"GitHub"** in the list of providers
   - If you don't see GitHub:
     - Click **"Add new provider"** button
     - Select **"GitHub"** from the list
   - Click on **"GitHub"** to configure it

4. **Enter your GitHub OAuth credentials**:
   - **Toggle "Enable"** to ON (at the top)
   - **Client ID**: Paste the Client ID you copied from GitHub
   - **Client Secret**: Paste the Client Secret you copied from GitHub
   - **Click "Save"** button

5. **Verify it's enabled**:
   - You should see GitHub in the list with a green checkmark or "Enabled" status
   - If you see any errors, double-check:
     - Client ID and Secret are correct (no extra spaces)
     - Callback URL in GitHub matches exactly: `https://cookie-voting.firebaseapp.com/__/auth/handler`

## Step 3: Sign In as Test User

1. **Open your app** in the browser (http://localhost:5173)
2. **Click "Use Test User"** button on the landing page
3. **You'll be redirected to GitHub** to authorize the app
4. **Authorize the application** (you may need to sign in to GitHub first)
5. **You'll be redirected back** to your app, now signed in with GitHub
6. **Check the browser console** for your test user UID

## Step 4: Add Test User as Admin

1. **Get the test user UID**:
   - After signing in, check the browser console for: `Test User UID: <uid>`
   - Or go to Firebase Console → Authentication → Users → Find your GitHub account → Copy the UID

2. **Add UID to Firestore admin list**:
   - Go to: Firebase Console → Firestore Database
   - Navigate to: `system/admins` document
   - If it doesn't exist, create it:
     - Collection: `system`
     - Document ID: `admins`
     - Field: `userIds` (type: array)
   - Add the test user UID to the `userIds` array
   - Click "Update" to save

### Example Document Structure:

```
Collection: system
Document ID: admins
Fields:
  userIds: [array]
    - "your-github-user-uid-here"
    - (any other existing admin UIDs)
```

## Step 5: Verify It Works

1. **Refresh your app** in the browser
2. **Try creating an event** called "Test 2"
3. **Check the console** - you should no longer see permission errors
4. **The event should be created successfully**

## Optional: Restrict Test User to Specific GitHub Account

If you want to restrict the test user to only your specific GitHub account:

1. **Find your GitHub email** (the one associated with your GitHub account)
2. **Add it to your `.env` file**:
   ```
   VITE_TEST_USER_GITHUB_EMAIL=your-github-email@example.com
   ```
3. **Restart your dev server**

Without this setting, any GitHub account can be used as the test user when test mode is enabled.

## Alternative: Using Firebase CLI (if you prefer command line)

If you have Firebase CLI set up, you can also add the admin programmatically:

```bash
# First, get your test user UID from Firebase Console → Authentication → Users
# Then run this command (replace YOUR_TEST_USER_UID with the actual UID):
firebase firestore:set system/admins '{"userIds":["existing-admin-uid","YOUR_TEST_USER_UID"]}' --merge
```

Or if creating for the first time:

```bash
firebase firestore:set system/admins '{"userIds":["YOUR_TEST_USER_UID"]}'
```

## Notes

- **The test user UID is consistent** - it's tied to your GitHub account, so it won't change
- **The account persists** - even if you clear browser data, the account still exists in Firebase
- **More secure** - uses proper OAuth authentication
- **Easy to manage** - you can see and manage the test user in Firebase Console → Authentication
- **Works with GitHub** - you can sign in even if Google sign-in doesn't work in your browser

## Troubleshooting

- **Can't find the UID?** Check the browser console when signing in, or look in Firebase Console → Authentication → Users
- **Permission denied?** Make sure you added the UID correctly to the `userIds` array in the `system/admins` document
- **GitHub not enabled?** Make sure you enabled GitHub authentication in Firebase Console → Authentication → Sign-in method
- **Callback URL error?** Make sure the Authorization callback URL in GitHub matches: `https://cookie-voting.firebaseapp.com/__/auth/handler`
- **Client Secret not working?** Make sure you copied it correctly - GitHub only shows it once when you create it
