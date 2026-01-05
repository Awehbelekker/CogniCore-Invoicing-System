# 🔄 Cross-Device Sync Guide

## How It Works

Your invoice system now has **automatic cross-device sync** built in! Here's everything you need to know:

### ✅ What's Automatic

Every time you save **anything** (invoices, customers, suppliers, settings), the system automatically:
1. ✅ Saves to **localStorage** (works offline)
2. ✅ Syncs to **Google Drive** (if you're signed in)

When you open the app on **any device**, it automatically:
1. ⬇️ Downloads the latest data from Google Drive
2. ✅ Ensures all your invoices/customers are up-to-date
3. 🔄 Stays synced across all devices

### 📱 One-Time Setup Per Device

You only need to set up Google Drive sync **once per device**:

1. **Click "Setup Google Sync"** button (top-right)
2. Enter your **OAuth Client ID** (from Google Cloud Console)
3. **Sign in** to your Google account
4. **Grant permissions** to access Drive

That's it! The system will remember you're signed in.

### 🎯 What This Means

✅ **Create an invoice on your phone** → It's instantly on your laptop  
✅ **Add a customer on your tablet** → It's available on all devices  
✅ **Update settings on your desktop** → Changes everywhere  
✅ **Works offline** → Data saves locally and syncs when back online

### 🚀 Status Indicators

Watch the sync button (top-right) to see your sync status:

| Icon | Meaning |
|------|---------|
| **✅ Synced** | Your data is backed up to Google Drive and accessible on all devices |
| **💾 Local Only** | You're not signed in to Google Drive - data is saved locally only |
| **🔗 Sync Google** | Click to sign in and enable cross-device sync |
| **🚀 Setup Google Sync** | Google Drive not configured yet - click to set up |

### 🔐 Your Data Privacy

- **Your data stays YOUR data** - stored in your personal Google Drive
- **No third-party servers** - direct sync between your devices and your Drive
- **Works offline** - always saved locally first, synced when online
- **Secure** - uses Google's OAuth 2.0 authentication

### 📊 What Gets Synced

Everything is automatically synced:
- ✅ **Invoices** - All invoices and their details
- ✅ **Customers** - Customer database
- ✅ **Suppliers** - Supplier information
- ✅ **Products** - Product catalog
- ✅ **Settings** - Company info, banking details, branding
- ✅ **Businesses** - Multi-business profiles
- ✅ **Favorites** - Your favorite products

### 🆘 Troubleshooting

**Q: Do I need to click "Sync Google" every time?**  
A: **No!** Once you're signed in, every save automatically syncs. The button is just there to manually trigger a sync if you want.

**Q: What if I'm offline?**  
A: Data saves locally and will sync to Drive automatically when you're back online.

**Q: What if I sign in on a new device?**  
A: The app automatically downloads all your data from Drive when you sign in - you'll have everything instantly!

**Q: The buttons aren't working?**  
A: Make sure you're on the latest version: https://aweh-invoice-system.vercel.app/

**Q: How do I know if I'm signed in?**  
A: Look at the sync button in the top-right:
- ✅ **"Synced"** = You're signed in and syncing
- 💾 **"Local Only"** = You're not signed in

---

## 🎉 You're All Set!

Your invoice system is now fully cross-device ready. Sign in once on each device, and you'll never have to worry about syncing again!
