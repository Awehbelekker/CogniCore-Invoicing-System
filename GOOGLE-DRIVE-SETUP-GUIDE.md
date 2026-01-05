# 🚀 Google Drive Integration - Setup Guide

## Step-by-Step Implementation Guide for Aweh Invoice System

---

## 📋 **PART 1: Google Cloud Console Setup** (10 minutes)

### **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. **Project name:** `Aweh Invoice System`
4. Click **"Create"**
5. Wait for project creation (30 seconds)

### **Step 2: Enable Google Drive API**

1. In the project dashboard, click **"Enable APIs and Services"**
2. Search for **"Google Drive API"**
3. Click on **"Google Drive API"**
4. Click **"Enable"**
5. Wait for activation (10 seconds)

### **Step 3: Configure OAuth Consent Screen**

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type
3. Click **"Create"**

**Fill in the form:**
- **App name:** `Aweh Invoice System`
- **User support email:** Your email address
- **App logo:** (Optional - upload your logo)
- **Application home page:** Leave blank (or your website)
- **Authorized domains:** Leave blank for now
- **Developer contact information:** Your email address

4. Click **"Save and Continue"**

**Scopes:**
5. Click **"Add or Remove Scopes"**
6. Search for: `https://www.googleapis.com/auth/drive.file`
7. Check the box next to it
8. Click **"Update"**
9. Click **"Save and Continue"**

**Test users:**
10. Click **"Add Users"**
11. Add your email address (and any other users who will test)
12. Click **"Save and Continue"**
13. Click **"Back to Dashboard"**

### **Step 4: Create OAuth 2.0 Credentials**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** `Aweh Invoice System Web Client`

**Authorized JavaScript origins:**
5. Click **"Add URI"**
6. Add these URIs (one at a time):
   - `http://localhost`
   - `http://localhost:8000`
   - `http://localhost:3000`
   - `file://` (for local HTML file)
   - Your domain if hosted (e.g., `https://yourdomain.com`)

**Authorized redirect URIs:**
7. Click **"Add URI"**
8. Add these URIs:
   - `http://localhost`
   - `http://localhost:8000`
   - Your domain if hosted

9. Click **"Create"**

### **Step 5: Get Your Credentials**

A popup will appear with your credentials:

```
Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT:**
- ✅ **Copy the Client ID** - You'll need this
- ✅ **Copy the Client Secret** - Keep this safe (but not needed for client-side app)
- ✅ Click **"Download JSON"** - Save this file as backup

---

## 📝 **PART 2: Update Your Invoice System** (15 minutes)

### **Step 1: Add Google API Libraries**

Open `COMPLETE-INVOICE-SYSTEM.html` and add these scripts **before** the closing `</body>` tag:

```html
<!-- Google API Client Library -->
<script src="https://apis.google.com/js/api.js"></script>
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- Google Drive Sync Module -->
<script src="google-drive-sync.js"></script>
```

### **Step 2: Configure Your Google Client ID**

Recommended: connect inside the app.

1. Open the invoice system
2. Click **“🔗 Sync Google”** in the header
3. The app shows the exact **Authorized JavaScript origin** you must add (copy button)
4. Paste your **OAuth Client ID** once
5. Click **“Connect Google”** → a Google sign-in popup appears → accept permissions → done

The Client ID is saved to browser storage, so next time it’s just: **Sync Google → popup login → done**.

Manual editing of `google-drive-sync.js` is optional and generally not needed.

### **Step 3: Add Single-Click Sync UI to Your Invoice System**

The header already includes a single “Sync Google” button and a sync status label.

```html
<div class="header-actions">
    <!-- Existing buttons -->
    <button class="btn btn-primary" onclick="switchTab('dashboard')">📊 Dashboard</button>

    <!-- NEW: Single-click Google Sync -->
    <span id="syncStatus" class="sync-status">💾 Local storage</span>
    <button id="syncGoogleBtn" class="btn btn-outline btn-sm setup-google-drive-btn" onclick="syncGoogle()">
        🔗 Sync Google
    </button>
    <button id="googleSignOutBtn" class="btn btn-outline btn-sm gdrive-control" onclick="driveStorage.signOut()">
        Sign Out
    </button>
</div>
```

### **Step 4: Update Save Functions to Use Google Drive**

Find all instances of `safeSetItem()` and replace with `driveStorage.setItem()`:

**Example - Saving Invoices:**

**OLD CODE:**
```javascript
if (!safeSetItem('aweh_invoices', JSON.stringify(invoices))) {
    return;
}
```

**NEW CODE:**
```javascript
await driveStorage.setItem('aweh_invoices', invoices);
```

**Example - Loading Invoices:**

**OLD CODE:**
```javascript
invoices = safeGetItem('aweh_invoices', []);
```

**NEW CODE:**
```javascript
invoices = await driveStorage.getItem('aweh_invoices', []);
```

---

## 🧪 **PART 3: Testing** (10 minutes)

### **Step 1: Test Locally**

1. Open `COMPLETE-INVOICE-SYSTEM.html` in your browser
2. You should see **"🔗 Sync Google"** in the header
3. Click the button
4. Google sign-in popup should appear
5. Sign in with your Google account
6. Grant permission to access Google Drive
7. You should see **"Synced with Google Drive"** status

### **Step 2: Verify Sync**

1. Create a test invoice
2. Check the sync status - should say **"✅ Synced to Google Drive"**
3. Go to [Google Drive](https://drive.google.com/)
4. You should see a folder: **"Aweh Invoice System"**
5. Inside, you should see: **"aweh_invoices.json"**
6. Open the file - you should see your invoice data

### **Step 3: Test Multi-Device Sync**

1. Open the invoice system on another device (or browser)
2. Sign in with the same Google account
3. Your invoices should load automatically
4. Create a new invoice on device 2
5. Refresh device 1 - new invoice should appear

### **Step 4: Test Offline Mode**

1. Disconnect from internet
2. Create a new invoice
3. Status should say **"💾 Saved locally (offline)"**
4. Reconnect to internet
5. Status should change to **"🔄 Syncing..."** then **"✅ All changes synced"**

---

## 🔧 **PART 4: Migration from localStorage** (Optional)

If you already have data in localStorage, migrate it to Google Drive:

### **Option 1: Automatic Migration**

Add this code to run once on page load:

```javascript
// Run once to migrate existing data
async function migrateToGoogleDrive() {
    if (!driveStorage.isSignedIn) {
        console.log('Please sign in to migrate data');
        return;
    }
    
    const keys = [
        'aweh_invoices',
        'aweh_customers',
        'aweh_products',
        'aweh_suppliers',
        'aweh_settings'
    ];
    
    for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
            await driveStorage.setItem(key, JSON.parse(data));
            console.log(`Migrated ${key}`);
        }
    }
    
    alert('✅ All data migrated to Google Drive!');
}

// Call this once after signing in
window.addEventListener('driveSignInStatusChanged', async (event) => {
    if (event.detail.isSignedIn) {
        await migrateToGoogleDrive();
    }
});
```

### **Option 2: Manual Sync Button**

Add a button to manually trigger sync:

```html
<button class="btn btn-primary" onclick="driveStorage.syncAll()">
    🔄 Upload All Data to Google Drive
</button>
```

---

## ⚙️ **PART 5: Advanced Configuration** (Optional)

### **Enable API Key (for higher quotas)**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API key"**
3. Copy the API key
4. Update `google-drive-sync.js`:

```javascript
this.API_KEY = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
```

### **Restrict API Key (Security)**

1. Click on the API key you just created
2. Under **"Application restrictions"**, select **"HTTP referrers"**
3. Add your domain: `https://yourdomain.com/*`
4. Under **"API restrictions"**, select **"Restrict key"**
5. Select **"Google Drive API"**
6. Click **"Save"**

---

## 🎉 **You're Done!**

Your invoice system now has:
- ✅ Cloud storage (15 GB free)
- ✅ Multi-device sync
- ✅ Automatic backups
- ✅ Offline support
- ✅ Unlimited transaction history

---

## 🆘 **Troubleshooting**

### **"Sign in failed" error**

**Solution:**
- Check that your Client ID is correct
- Make sure you added `http://localhost` to authorized origins
- Try clearing browser cache

### **"Access blocked" error**

**Solution:**
- Go to OAuth consent screen
- Add your email to "Test users"
- Make sure app is not in "Production" mode yet

### **"Quota exceeded" error**

**Solution:**
- You've hit the free tier limit (unlikely)
- Check [Google Cloud Console](https://console.cloud.google.com/) quotas
- Enable billing if needed (still free for normal use)

### **Files not syncing**

**Solution:**
- Check internet connection
- Check sync status indicator
- Click "Sync Now" button manually
- Check browser console for errors

### **"Invalid grant" error**

**Solution:**
- Sign out and sign in again
- Clear browser cookies
- Revoke access at [Google Account Permissions](https://myaccount.google.com/permissions)
- Sign in again

---

## 📞 **Need Help?**

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Stack Overflow - Google Drive API](https://stackoverflow.com/questions/tagged/google-drive-api)

---

**Next Steps:**
- [ ] Complete Google Cloud setup
- [ ] Update invoice system with Google Drive sync
- [ ] Test on multiple devices
- [ ] Migrate existing data
- [ ] Build bank reconciliation module with cloud storage

🚀 **Ready to implement? Let me know if you need help with any step!**

