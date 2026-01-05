# 🏢 Aweh Be Lekker - Invoice Management System

A complete, professional invoice management system with **Google Drive cloud sync** for multi-device access.

## ✨ Features

- 📄 **Complete Invoice Management** - Create, edit, and track invoices, quotes, and purchase orders
- 👥 **Customer & Supplier Management** - Organize all your business contacts
- 📦 **Product Catalog** - Manage products with pricing tiers and cost tracking
- 💰 **Profit Margin Tracking** - Monitor profitability on every sale
- 🎨 **Customizable Themes** - Professional invoice templates with your branding
- ☁️ **Google Drive Sync** - Access your data from any device
- 📱 **Mobile Friendly** - Works on desktop, tablet, and mobile
- 🔒 **Secure** - Your data stays in your Google Drive
- 🌐 **Multi-Business Support** - Manage multiple businesses from one system

## 🚀 Quick Start

### **Option 1: Local Server (Fastest)**

1. **Double-click** `START-SERVER.bat`
2. **Open browser** to `http://localhost:8080`
3. **Done!** 🎉

### **Option 2: Command Line**

```powershell
node server.js
```

Then open: `http://localhost:8080`

### **Option 3: Deploy Online (Vercel)**

```powershell
npm install -g vercel
vercel login
vercel --prod
```

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed instructions.

## 📱 Mobile Access

### **Local Network (Same WiFi)**
1. Find your computer's IP: `ipconfig`
2. On mobile, open: `http://YOUR_IP:8080`

### **Online Access (Anywhere)**
1. Deploy to Vercel (see guide above)
2. Access from anywhere: `https://your-app.vercel.app`

## ☁️ Google Drive Setup

1. Click **"🚀 Setup Google Drive"** button
2. Follow the **5-step wizard** (takes 5-10 minutes)
3. Sign in with Google
4. Your data syncs automatically! ✅

**Cross-Device Sync:**
- Add data on laptop → Syncs to Google Drive
- Open on mobile → Data appears automatically
- Same Google account required on all devices

## 📋 System Requirements

- ✅ Node.js v14+ (you have v20.11.0)
- ✅ Modern web browser (Chrome, Firefox, Edge, Safari)
- ✅ Google account (for cloud sync)
- ✅ Internet connection (for sync features)

## 🔧 Configuration

### **Google OAuth Client ID**
Your current Client ID: `536049859348-0gjrch6f2p4josa279lv38sfvgmbnoc0`

**Authorized JavaScript Origins:**
- `http://localhost:8080`
- `http://127.0.0.1:8080`
- Your Vercel URL (after deployment)

Update at: https://console.cloud.google.com/apis/credentials

## 📁 Project Structure

```
aweh-invoice-system/
├── COMPLETE-INVOICE-SYSTEM.html  # Main application (single-file)
├── google-drive-sync.js          # Google Drive integration
├── server.js                     # Local HTTP server
├── package.json                  # Node.js configuration
├── vercel.json                   # Vercel deployment config
├── START-SERVER.bat              # Quick start script
├── DEPLOYMENT-GUIDE.md           # Detailed deployment instructions
└── README.md                     # This file
```

## 🎯 Usage

### **Creating an Invoice**
1. Click **"➕ New Invoice"**
2. Select customer (or add new)
3. Add products
4. Review and save
5. Print or export as PDF

### **Syncing Data**
1. Sign in to Google Drive
2. Data syncs automatically
3. Or click **"🔄 Sync Now"** to force sync

### **Accessing on Another Device**
1. Open the same URL
2. Sign in with the same Google account
3. All your data appears automatically

## 🔒 Security & Privacy

- ✅ **Your data stays in YOUR Google Drive** - We don't store anything
- ✅ **OAuth 2.0 authentication** - Secure Google sign-in
- ✅ **HTTPS encryption** - When deployed to Vercel
- ✅ **No third-party tracking** - Your privacy is protected

## 🆘 Troubleshooting

### **"Invalid cookiePolicy" Error**
- Use HTTP server (not file:// URLs)
- Update Google OAuth authorized origins
- Wait 5 minutes after updating settings

### **Data Not Syncing**
- Check internet connection
- Verify you're signed in to Google Drive
- Use the same Google account on all devices
- Click "🔄 Sync Now" manually

### **Can't Access on Mobile**
- Make sure mobile is on same WiFi (for local server)
- Use your computer's IP address, not localhost
- Or deploy to Vercel for access from anywhere

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for more troubleshooting tips.

## 📚 Documentation

- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Deployment instructions
- [GOOGLE-DRIVE-SETUP-GUIDE.md](GOOGLE-DRIVE-SETUP-GUIDE.md) - Google Drive setup
- [SETUP-WIZARD-GUIDE.md](SETUP-WIZARD-GUIDE.md) - Setup wizard documentation

## 🎉 You're Ready!

Start the server and begin managing your invoices with cloud sync! 🚀

---

**Made for Aweh Be Lekker** - Awake Jetboards, E-Foils & Aqua Marina Water Sports

