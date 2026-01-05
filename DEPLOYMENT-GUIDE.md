# 🚀 Deployment Guide - Aweh Invoice System

This guide covers **two deployment options**:
1. **Local HTTP Server** - For development and local network access
2. **Vercel Deployment** - For online access from anywhere (mobile, desktop, etc.)

---

## 📋 **Prerequisites**

- ✅ Node.js installed (v14 or higher) - **You have v20.11.0** ✅
- ✅ Google Cloud OAuth Client ID configured
- ✅ Vercel account (free) - for online deployment

---

## 🖥️ **Option 1: Local HTTP Server**

### **Quick Start (30 seconds)**

1. **Open PowerShell** in the project folder
2. **Run the server:**
   ```powershell
   node server.js
   ```
3. **Open in browser:**
   - Desktop: `http://localhost:8080`
   - Mobile (same WiFi): `http://YOUR_IP:8080`

### **Finding Your IP for Mobile Access**

```powershell
# In PowerShell:
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

Then on your mobile device (connected to same WiFi):
- Open: `http://192.168.1.100:8080`

### **Update Google OAuth Settings**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`
3. Add to **Authorized JavaScript origins**:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`
   - `http://YOUR_IP:8080` (e.g., `http://192.168.1.100:8080`)
4. Click **Save**
5. Wait 5 minutes for changes to take effect

### **Stopping the Server**

Press `Ctrl+C` in the PowerShell window

---

## 🌐 **Option 2: Vercel Deployment (Recommended for Mobile)**

### **Why Vercel?**
- ✅ **Free hosting** with HTTPS
- ✅ **Global CDN** - Fast worldwide
- ✅ **Custom domain** support (optional)
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Easy mobile access** - Works from anywhere

### **Step 1: Install Vercel CLI**

```powershell
npm install -g vercel
```

### **Step 2: Login to Vercel**

```powershell
vercel login
```

This will open your browser to authenticate.

### **Step 3: Deploy**

```powershell
# First deployment (interactive)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? aweh-invoice-system (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No
```

### **Step 4: Deploy to Production**

```powershell
vercel --prod
```

You'll get a URL like: `https://aweh-invoice-system.vercel.app`

### **Step 5: Update Google OAuth Settings**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`
3. Add to **Authorized JavaScript origins**:
   - `https://aweh-invoice-system.vercel.app` (your Vercel URL)
   - `https://aweh-invoice-system-*.vercel.app` (for preview deployments)
4. Click **Save**
5. Wait 5 minutes for changes to take effect

### **Step 6: Test on Mobile**

1. Open your Vercel URL on mobile: `https://aweh-invoice-system.vercel.app`
2. Click "🚀 Setup Google Drive" (if not already done)
3. Complete the wizard
4. Sign in with Google
5. Start using! 🎉

---

## 📱 **Cross-Device Sync Setup**

### **On Desktop (Laptop):**
1. Open the invoice system (local or Vercel URL)
2. Sign in to Google Drive
3. Add clients and invoices
4. Click "🔄 Sync Now" to upload to cloud

### **On Mobile:**
1. Open the same URL
2. Sign in with **the same Google account**
3. Data automatically downloads from Google Drive
4. All your data appears! ✅

---

## 🔧 **Troubleshooting**

### **"Invalid cookiePolicy" Error**
- ✅ **Fixed!** Use HTTP server or Vercel (not `file://` URLs)
- ✅ Make sure authorized origins are updated in Google Cloud Console
- ✅ Wait 5 minutes after updating Google OAuth settings

### **"Connection Failed" Error**
- Check that you copied the entire Client ID
- Verify authorized origins match your URL exactly
- Try refreshing the page and testing again
- Check browser console for detailed errors (F12)

### **Data Not Syncing Between Devices**
- Make sure you're signed in with the **same Google account** on both devices
- Click "🔄 Sync Now" manually to force sync
- Check that you have internet connection
- Verify Google Drive permissions were granted

### **Mobile Can't Access Local Server**
- Make sure mobile is on the **same WiFi network**
- Check firewall isn't blocking port 8080
- Use your computer's IP address, not `localhost`
- Add the IP-based URL to Google OAuth authorized origins

---

## 🎯 **Quick Reference**

| Task | Command |
|------|---------|
| **Start local server** | `node server.js` |
| **Stop local server** | `Ctrl+C` |
| **Deploy to Vercel** | `vercel --prod` |
| **Check deployment** | `vercel ls` |
| **View logs** | `vercel logs` |
| **Remove deployment** | `vercel rm aweh-invoice-system` |

---

## 🌟 **Next Steps**

After deployment:
1. ✅ Test on desktop browser
2. ✅ Test on mobile device
3. ✅ Add some test data on one device
4. ✅ Verify it syncs to the other device
5. ✅ Bookmark the URL for easy access

---

## 💡 **Pro Tips**

- **Custom Domain:** Vercel supports custom domains (e.g., `invoices.yourdomain.com`)
- **PWA:** The system can be installed as an app on mobile (Add to Home Screen)
- **Offline Mode:** Works offline, syncs when back online
- **Backup:** Data is automatically backed up to Google Drive

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Google Cloud Console settings
3. Check browser console for errors (F12)
4. Verify internet connection and Google Drive access

---

**You're all set! 🎉**

Choose your deployment method and start using your invoice system from anywhere!

