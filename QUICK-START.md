# ⚡ Quick Start Guide - Fix Connection Error & Deploy

## 🎯 **Your Current Situation**

- ✅ Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`
- ❌ Error: "Invalid cookiePolicy"
- 🎯 Goal: Fix error + enable mobile access

---

## 🔧 **STEP 1: Start Local HTTP Server (2 minutes)**

### **Method A: Double-Click (Easiest)**
1. Find `START-SERVER.bat` in your folder
2. Double-click it
3. A window opens showing the server is running
4. **Keep this window open!**

### **Method B: PowerShell**
```powershell
# In PowerShell (in your project folder):
node server.js
```

You should see:
```
🚀 ========================================
   Aweh Invoice System - HTTP Server
   ========================================

   ✅ Server running at:
      http://localhost:8080
      http://127.0.0.1:8080

   📱 For mobile access on same network:
      Find your IP with: ipconfig
      Then use: http://YOUR_IP:8080

   Press Ctrl+C to stop the server
   ========================================
```

---

## 🌐 **STEP 2: Update Google OAuth Settings (3 minutes)**

### **Add Local Server URLs**

1. **Open:** https://console.cloud.google.com/apis/credentials

2. **Click** your OAuth Client ID:
   - Name: Something like "Web client 1" or your custom name
   - Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`

3. **Scroll to "Authorized JavaScript origins"**

4. **Click "ADD URI"** and add these URLs:
   ```
   http://localhost:8080
   http://127.0.0.1:8080
   ```

5. **Click "SAVE"** at the bottom

6. **Wait 5 minutes** for changes to propagate

---

## ✅ **STEP 3: Test the Fix (1 minute)**

1. **Open browser** to: `http://localhost:8080`

2. **Click** "🚀 Setup Google Drive" button

3. **Go to Step 5** of the wizard

4. **Paste your Client ID:**
   ```
   536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0
   ```

5. **Click "🔌 Test Connection"**

6. **Should work now!** ✅

---

## 📱 **STEP 4: Enable Mobile Access (5 minutes)**

### **Option A: Local Network (Same WiFi)**

1. **Find your computer's IP:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **Add to Google OAuth:**
   - Go back to: https://console.cloud.google.com/apis/credentials
   - Click your Client ID
   - Add URI: `http://192.168.1.100:8080` (use YOUR IP)
   - Click "SAVE"
   - Wait 5 minutes

3. **On mobile (same WiFi):**
   - Open: `http://192.168.1.100:8080` (use YOUR IP)
   - Works! ✅

### **Option B: Deploy to Vercel (Access from Anywhere)**

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Login:**
   ```powershell
   vercel login
   ```
   (Opens browser to authenticate)

3. **Deploy:**
   ```powershell
   vercel --prod
   ```
   
   Follow prompts:
   - Set up and deploy? **Yes**
   - Which scope? **(select your account)**
   - Link to existing project? **No**
   - Project name? **aweh-invoice-system**
   - Directory? **./  (just press Enter)**
   - Override settings? **No**

4. **You'll get a URL like:**
   ```
   https://aweh-invoice-system.vercel.app
   ```

5. **Add to Google OAuth:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click your Client ID
   - Add URI: `https://aweh-invoice-system.vercel.app`
   - Add URI: `https://aweh-invoice-system-*.vercel.app` (for previews)
   - Click "SAVE"
   - Wait 5 minutes

6. **Access from anywhere:**
   - Desktop: `https://aweh-invoice-system.vercel.app`
   - Mobile: `https://aweh-invoice-system.vercel.app`
   - Tablet: `https://aweh-invoice-system.vercel.app`
   - **Same URL everywhere!** 🎉

---

## 🔄 **STEP 5: Test Cross-Device Sync**

### **On Desktop:**
1. Open the invoice system (local or Vercel URL)
2. Complete Google Drive setup wizard
3. Sign in with Google
4. Add a test customer
5. Add a test invoice
6. Click "🔄 Sync Now"
7. See "✅ Synced to Google Drive" message

### **On Mobile:**
1. Open the same URL
2. Sign in with **the same Google account**
3. Your test customer and invoice appear! ✅

---

## 📊 **Summary of URLs to Add to Google OAuth**

Go to: https://console.cloud.google.com/apis/credentials

Click your Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`

**Authorized JavaScript origins:**
```
http://localhost:8080
http://127.0.0.1:8080
http://YOUR_IP:8080                          (replace with your actual IP)
https://aweh-invoice-system.vercel.app       (your Vercel URL)
https://aweh-invoice-system-*.vercel.app     (Vercel preview URLs)
```

**Click SAVE and wait 5 minutes!**

---

## 🎉 **You're Done!**

Now you have:
- ✅ Local HTTP server running
- ✅ Connection error fixed
- ✅ Mobile access enabled
- ✅ Cross-device sync working
- ✅ Access from anywhere (if deployed to Vercel)

---

## 🆘 **Still Having Issues?**

### **"Invalid cookiePolicy" still appears:**
- Wait the full 5 minutes after updating Google OAuth
- Clear browser cache and cookies
- Try in incognito/private mode
- Make sure you're using `http://localhost:8080` not `file://`

### **Can't access on mobile:**
- Check mobile is on same WiFi network
- Verify firewall isn't blocking port 8080
- Use IP address, not "localhost"
- Make sure server is still running (check PowerShell window)

### **Data not syncing:**
- Sign in with the same Google account on both devices
- Click "🔄 Sync Now" manually
- Check internet connection
- Verify Google Drive permissions were granted

---

## 💡 **Pro Tips**

- **Bookmark the URL** on all devices for quick access
- **Add to Home Screen** on mobile for app-like experience
- **Use Vercel** for the best mobile experience (works anywhere)
- **Keep server running** if using local server (or use Vercel)

---

**Need more help?** See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed instructions!

