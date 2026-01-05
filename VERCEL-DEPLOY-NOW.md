# 🚀 Deploy to Vercel - Step by Step

## ✅ **What You Need to Do**

Since Vercel requires interactive authentication, please follow these steps in your PowerShell terminal:

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Open PowerShell**

You should already have PowerShell open in your project folder:
```
c:\Users\Richard.Downing\Downloads\Awake Invoicing sytem
```

If not, open PowerShell and navigate there:
```powershell
cd "c:\Users\Richard.Downing\Downloads\Awake Invoicing sytem"
```

---

### **Step 2: Login to Vercel**

Run this command:
```powershell
vercel login
```

**What happens:**
1. You'll see a message like:
   ```
   Vercel CLI 50.0.0
   Visit https://vercel.com/oauth/device?user_code=XXXX-XXXX
   Press [ENTER] to open the browser
   ```

2. **Press ENTER** - This opens your browser

3. **In the browser:**
   - Sign in to Vercel (or create a free account)
   - Click "Authorize" or "Confirm"
   - You'll see "Success! You may now close this tab"

4. **Back in PowerShell:**
   - You'll see: "✔ Success! Authentication complete."

---

### **Step 3: Deploy to Production**

Run this command:
```powershell
vercel --prod
```

**What happens:**
1. Vercel asks: **"Set up and deploy?"**
   - Type: `y` and press ENTER

2. Vercel asks: **"Which scope?"**
   - Select your account (usually just press ENTER)

3. Vercel asks: **"Link to existing project?"**
   - Type: `n` and press ENTER (we're creating a new project)

4. Vercel asks: **"What's your project's name?"**
   - Type: `aweh-invoice-system` and press ENTER
   - (Or use any name you prefer)

5. Vercel asks: **"In which directory is your code located?"**
   - Just press ENTER (uses current directory: `./`)

6. Vercel asks: **"Want to modify these settings?"**
   - Type: `n` and press ENTER

7. **Deployment starts!** You'll see:
   ```
   🔗  Inspecting...
   🔍  Analyzing...
   📦  Building...
   ✅  Deployed to production!
   ```

8. **You'll get your URL:**
   ```
   https://aweh-invoice-system.vercel.app
   ```

---

### **Step 4: Copy Your Vercel URL**

After deployment completes, you'll see something like:
```
✅ Production: https://aweh-invoice-system-xxxxx.vercel.app
```

**Copy this URL!** You'll need it for the next step.

---

### **Step 5: Update Google OAuth Settings**

1. **Open:** https://console.cloud.google.com/apis/credentials

2. **Click** your OAuth Client ID:
   - Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`

3. **Scroll to "Authorized JavaScript origins"**

4. **Click "ADD URI"** and add:
   ```
   https://aweh-invoice-system.vercel.app
   ```
   (Replace with YOUR actual Vercel URL)

5. **Click "ADD URI"** again and add:
   ```
   https://aweh-invoice-system-*.vercel.app
   ```
   (This allows preview deployments)

6. **Click "SAVE"** at the bottom

7. **⏳ Wait 5 minutes** for changes to take effect

---

### **Step 6: Test Your Deployment**

1. **Open your Vercel URL** in a browser:
   ```
   https://aweh-invoice-system.vercel.app
   ```

2. **Click** "🚀 Setup Google Drive"

3. **Complete the wizard** (if not already done)

4. **Click** "🔌 Test Connection"

5. **Should work!** ✅

---

## 📱 **Access from Mobile**

Now you can access your invoice system from **anywhere**:

- **Desktop:** `https://aweh-invoice-system.vercel.app`
- **Mobile:** `https://aweh-invoice-system.vercel.app`
- **Tablet:** `https://aweh-invoice-system.vercel.app`

**Same URL everywhere!** 🎉

---

## 🔄 **Test Cross-Device Sync**

### **On Desktop:**
1. Open: `https://aweh-invoice-system.vercel.app`
2. Sign in to Google Drive
3. Add a test customer
4. Add a test invoice
5. Click "🔄 Sync Now"

### **On Mobile:**
1. Open: `https://aweh-invoice-system.vercel.app`
2. Sign in with **the same Google account**
3. Your test data appears! ✅

---

## 🎯 **Quick Reference**

| Command | Purpose |
|---------|---------|
| `vercel login` | Authenticate with Vercel |
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel ls` | List deployments |
| `vercel logs` | View deployment logs |
| `vercel domains` | Manage custom domains |

---

## 🆘 **Troubleshooting**

### **"Error: The specified token is not valid"**
- Run `vercel login` again
- Complete the browser authentication
- Try deployment again

### **"Error: No such file or directory"**
- Make sure you're in the correct folder
- Run: `cd "c:\Users\Richard.Downing\Downloads\Awake Invoicing sytem"`

### **"Connection Failed" after deployment**
- Make sure you added the Vercel URL to Google OAuth
- Wait the full 5 minutes after updating OAuth settings
- Clear browser cache and try again

### **Deployment takes too long**
- This is normal for first deployment (can take 2-3 minutes)
- Subsequent deployments are faster

---

## 💡 **Pro Tips**

- **Bookmark the URL** on all devices
- **Add to Home Screen** on mobile for app-like experience
- **Custom Domain:** You can add your own domain in Vercel dashboard
- **Automatic HTTPS:** Vercel provides free SSL certificates
- **Global CDN:** Your app is fast worldwide

---

## 🎉 **After Deployment**

Once deployed, you'll have:
- ✅ **Online access** from anywhere
- ✅ **HTTPS security** (automatic)
- ✅ **Fast loading** (global CDN)
- ✅ **Mobile friendly** (works on all devices)
- ✅ **Cross-device sync** (via Google Drive)
- ✅ **Free hosting** (Vercel free tier)

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the troubleshooting section above
2. Run `vercel logs` to see deployment logs
3. Visit Vercel dashboard: https://vercel.com/dashboard

---

**Ready to deploy? Just run these two commands:**

```powershell
vercel login
vercel --prod
```

**That's it!** 🚀

