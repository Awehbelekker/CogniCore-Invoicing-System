# 🔐 Google Drive OAuth Setup Guide

## Quick & Easy Setup (5 Minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Name it: **"Aweh Invoice System"**
4. Click **Create**

---

### Step 2: Enable Google Drive API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **"Google Drive API"**
3. Click on it and click **"Enable"**

---

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - **User Type**: External
   - **App name**: Aweh Invoice System
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - **Scopes**: Skip (click Save and Continue)
   - **Test users**: Add your email
   - Click **Save and Continue**

4. Create OAuth Client:
   - **Application type**: Web application
   - **Name**: Aweh Invoice Web Client
   - **Authorized JavaScript origins**:
     ```
     https://aweh-invoice-system.vercel.app
     https://aweh-invoice-system-*.vercel.app
     http://localhost:8000
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     https://aweh-invoice-system.vercel.app
     https://aweh-invoice-system-*.vercel.app
     http://localhost:8000
     http://localhost:3000
     ```
   - Click **Create**

5. **COPY YOUR CLIENT ID** - it looks like:
   ```
   1234567890-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
   ```

---

### Step 4: Add Client ID to Your App

**Option A: Via Settings (Recommended)**
1. Login to your invoice system
2. Click **⚙️ Settings** → **Google Drive** tab
3. Paste your Client ID
4. Click **Save**

**Option B: In Code**
1. Open `google-drive-sync.js`
2. Find line: `this.CLIENT_ID = '...'`
3. Replace with your Client ID
4. Deploy: `vercel deploy --prod`

---

### Step 5: Test It!

1. Click **"Sync Google"** button in your app
2. Login with your Google account
3. Click **"Allow"** to grant permissions
4. Done! Your data will auto-sync

---

## 📱 Alternative: Microsoft OneDrive Setup

### Step 1: Register App

1. Go to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **"+ New registration"**
4. Name: **Aweh Invoice System**
5. **Supported account types**: Personal Microsoft accounts only
6. **Redirect URI**: 
   - Platform: **Single-page application (SPA)**
   - URI: `https://aweh-invoice-system.vercel.app`
7. Click **Register**

### Step 2: Configure Permissions

1. Go to **API permissions**
2. Click **"+ Add a permission"**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these:
   - `Files.ReadWrite`
   - `User.Read`
6. Click **Add permissions**

### Step 3: Get Application ID

1. Go to **Overview**
2. Copy **Application (client) ID**
3. Save it in Settings → Microsoft OneDrive tab

---

## 🚀 That's It!

Your users can now:
- Click one button to login
- Accept permissions
- Automatic cloud backup enabled

**No complex setup needed for end users - just you as admin!**

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Solution**: Add your current URL to authorized redirect URIs:
1. Go to Google Cloud Console → Credentials
2. Click your OAuth Client
3. Add your Vercel URL to **Authorized redirect URIs**
4. Click Save
5. Wait 5 minutes for changes to propagate

### "This app isn't verified" Warning

**Solution**: This is normal for testing. Click **"Advanced"** → **"Go to Aweh Invoice System (unsafe)"**

To remove warning:
1. Go to OAuth consent screen
2. Click **"Publish App"**
3. Submit for verification (optional)

---

## Security Notes

✅ OAuth is secure - users login with Google/Microsoft  
✅ No passwords stored in your app  
✅ Users can revoke access anytime  
✅ Data encrypted in transit  

---

**Need help?** The setup takes 5 minutes and users will love the easy cloud sync!
