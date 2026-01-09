# 🌐 HOSTING SIGNUP GUIDE - Step by Step

## 📋 OVERVIEW

You need to sign up for 4 services (all have FREE tiers):
1. **Vercel** - Host your app
2. **Stripe** - Process payments
3. **Google Cloud** - OAuth & Drive sync
4. **OpenRouter** - FREE AI (optional but recommended)

**Total Time:** ~20 minutes  
**Total Cost:** R0 (all free tiers)

---

## 1️⃣ VERCEL (App Hosting)

### Sign Up
1. Go to: **https://vercel.com/signup**
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub
4. Done! ✅

### What You Get (FREE)
- Unlimited websites
- 100 GB bandwidth/month
- Automatic HTTPS/SSL
- Serverless functions
- Auto-deploy from GitHub

### Next Steps
- Connect your GitHub repository
- Deploy with one click
- Get your live URL: `https://your-app.vercel.app`

---

## 2️⃣ STRIPE (Payment Processing)

### Sign Up
1. Go to: **https://dashboard.stripe.com/register**
2. Enter email and create password
3. Choose "South Africa" as country
4. Enter business details
5. Done! ✅

### What You Get (FREE)
- No monthly fees
- Test mode (unlimited testing)
- Stripe Connect (for marketplace)
- Payment links
- Webhooks

### Get Your API Keys
1. Go to: **Developers → API Keys**
2. Copy:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)
3. Save these for later

### Enable Stripe Connect
1. Go to: **Connect → Settings**
2. Enable "Express accounts"
3. Set platform name: "Aweh Invoice System"
4. Done! ✅

### Create Webhook
1. Go to: **Developers → Webhooks**
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/stripe-webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `checkout.session.completed`
   - `account.updated`
5. Copy **Webhook secret** (whsec_...)
6. Done! ✅

---

## 3️⃣ GOOGLE CLOUD (OAuth & Drive)

### Sign Up
1. Go to: **https://console.cloud.google.com**
2. Sign in with your Google account
3. Accept terms
4. Done! ✅

### Create Project
1. Click "Select a project" → "New Project"
2. Name: "Aweh Invoice System"
3. Click "Create"
4. Wait 30 seconds
5. Select your new project

### Enable APIs
1. Go to: **APIs & Services → Library**
2. Search "Google Drive API" → Enable
3. Search "Google People API" → Enable
4. Done! ✅

### Create OAuth Credentials
1. Go to: **APIs & Services → Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Click "Configure consent screen"
4. Choose "External" → Create
5. Fill in:
   - App name: "Aweh Invoice System"
   - User support email: your email
   - Developer email: your email
6. Click "Save and Continue" (3 times)
7. Click "Back to Dashboard"

### Get OAuth Client ID
1. Go to: **Credentials** again
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Aweh Invoice Web"
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-app.vercel.app`
6. Authorized redirect URIs:
   - `http://localhost:3000`
   - `https://your-app.vercel.app`
7. Click "Create"
8. Copy **Client ID** (looks like: 123456789-abc.apps.googleusercontent.com)
9. Done! ✅

---

## 4️⃣ OPENROUTER (FREE AI)

### Sign Up
1. Go to: **https://openrouter.ai/keys**
2. Click "Sign in with Google"
3. Authorize OpenRouter
4. Done! ✅

### Get API Key
1. Click "Create Key"
2. Name: "Aweh Invoice System"
3. Copy the key (starts with: sk-or-v1-...)
4. Save it somewhere safe
5. Done! ✅

### What You Get (FREE)
- FREE GLM-4.5-Air model
- 20 requests/minute
- Unlimited usage
- No credit card required

---

## 5️⃣ CONFIGURE YOUR APP

### Add Environment Variables to Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to: **Settings → Environment Variables**
4. Add these variables:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# App URL
APP_URL=https://your-app.vercel.app

# Platform Commission
PLATFORM_COMMISSION_RATE=0.5

# OpenRouter (optional)
OPENROUTER_API_KEY=sk-or-v1-your_key_here
```

5. Click "Save"
6. Redeploy your app

### Add Google Client ID to App

**Option 1: Via Settings (Recommended)**
1. Login to your deployed app
2. Go to: **Settings → Google Drive**
3. Paste your Google Client ID
4. Click "Save"

**Option 2: In Code**
1. Open `google-drive-sync.js`
2. Find line: `this.CLIENT_ID = '...'`
3. Replace with your Client ID
4. Commit and push to GitHub

---

## ✅ VERIFICATION CHECKLIST

### Vercel
- [ ] Account created
- [ ] GitHub connected
- [ ] Repository deployed
- [ ] Live URL working
- [ ] Environment variables added

### Stripe
- [ ] Account created
- [ ] Test mode enabled
- [ ] API keys copied
- [ ] Stripe Connect enabled
- [ ] Webhook created
- [ ] Webhook secret copied

### Google Cloud
- [ ] Project created
- [ ] Drive API enabled
- [ ] People API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth Client ID created
- [ ] Client ID copied

### OpenRouter
- [ ] Account created
- [ ] API key created
- [ ] API key copied
- [ ] Added to Vercel env vars

---

## 🧪 TEST YOUR SETUP

### Test 1: App Loads
1. Visit your Vercel URL
2. Login page should load
3. ✅ Pass if page loads without errors

### Test 2: Google OAuth
1. Click "Sign in with Google"
2. Authorize the app
3. Should redirect to invoice system
4. ✅ Pass if login works

### Test 3: Google Drive Sync
1. Go to Settings → Google Drive
2. Click "Connect Google Drive"
3. Authorize Drive access
4. Should show "✅ Connected"
5. ✅ Pass if sync works

### Test 4: Stripe Payment
1. Create test invoice
2. Click "Generate Payment Link"
3. Open payment link
4. Use test card: 4242 4242 4242 4242
5. Complete payment
6. ✅ Pass if payment succeeds

### Test 5: AI Features
1. Go to Dashboard
2. Check if AI Insights load
3. Try AI chatbot
4. ✅ Pass if AI responds

---

## 🆘 TROUBLESHOOTING

### Vercel deployment fails
- Check build logs
- Verify package.json is correct
- Make sure all dependencies are installed

### Google OAuth not working
- Check authorized origins match your URL
- Verify Client ID is correct
- Make sure consent screen is published

### Stripe webhook not firing
- Check webhook URL is correct
- Verify webhook secret matches
- Test webhook delivery in Stripe dashboard

### AI not responding
- Check OpenRouter API key is valid
- Verify environment variable is set
- Check Vercel function logs

---

## 📞 SUPPORT LINKS

- **Vercel Docs:** https://vercel.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Google Cloud Docs:** https://cloud.google.com/docs
- **OpenRouter Docs:** https://openrouter.ai/docs

---

## 🎉 YOU'RE READY!

Once all checkboxes are ticked, you're ready to:
1. Deploy your app
2. Process payments
3. Sync to cloud
4. Use AI features

**Total Cost:** R0/month (all free tiers)  
**Total Time:** ~20 minutes  
**Result:** Production-ready invoice system!

---

*Last Updated: 2026-01-08*

