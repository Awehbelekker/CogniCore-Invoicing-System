# 🚀 VERCEL DEPLOYMENT GUIDE - CogniCore Invoicing System

## 📋 PREREQUISITES

✅ GitHub account  
✅ Vercel account (sign up at https://vercel.com/signup)  
✅ Stripe account (https://dashboard.stripe.com/acct_1SnZvjLQhlp66eti)  
✅ Google Cloud Project (cognicore-invoicing-system - 845662826428)  
✅ OpenRouter API Key (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)

---

## STEP 1: PUSH TO GITHUB

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/Awehbelekker/CogniCore-Invoicing-System.git

# Add all files
git add .

# Commit changes
git commit -m "feat: Modernized login page and prepared for deployment"

# Push to GitHub
git push -u origin master
```

---

## STEP 2: DEPLOY TO VERCEL

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Project"
   - Select "Import Git Repository"
   - Choose: `Awehbelekker/CogniCore-Invoicing-System`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Other** (or leave as detected)
   - Root Directory: `./` (leave as default)
   - Build Command: Leave empty (static site)
   - Output Directory: Leave empty
   - Install Command: `npm install` (if needed)

4. **Click "Deploy"**
   - Wait 1-2 minutes for deployment
   - You'll get a URL like: `https://cognicore-invoicing-system.vercel.app`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? cognicore-invoicing-system
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## STEP 3: ADD ENVIRONMENT VARIABLES

1. **Go to Project Settings**
   - Visit: https://vercel.com/your-username/cognicore-invoicing-system/settings/environment-variables

2. **Add Variables** (one by one):

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
OPENROUTER_API_KEY=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
APP_URL=https://your-app.vercel.app
PLATFORM_COMMISSION_RATE=0.5
```

3. **Select Environment**
   - Check: Production, Preview, Development

4. **Click "Save"**

---

## STEP 4: CONFIGURE GOOGLE OAUTH

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials?project=cognicore-invoicing-system

2. **Update OAuth Redirect URIs**
   - Click on your OAuth 2.0 Client ID
   - Add Authorized JavaScript origins:
     - `https://your-app.vercel.app`
   - Add Authorized redirect URIs:
     - `https://your-app.vercel.app`
     - `https://your-app.vercel.app/`
   - Click "Save"

3. **Update in Code**
   - Go to your deployed app
   - Login as admin
   - Go to Settings → Google Drive
   - Paste your Google Client ID
   - Click "Save"

---

## STEP 5: CONFIGURE STRIPE WEBHOOK

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks

2. **Add Endpoint**
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app.vercel.app/api/stripe-webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `checkout.session.completed`
     - `account.updated`
     - `account.application.deauthorized`
   - Click "Add endpoint"

3. **Copy Webhook Secret**
   - Click on the webhook you just created
   - Click "Reveal" under "Signing secret"
   - Copy the secret (starts with `whsec_`)
   - Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## STEP 6: TEST DEPLOYMENT

### Test 1: App Loads
- Visit: `https://your-app.vercel.app`
- ✅ Login page should load with modern design

### Test 2: Google OAuth
- Click "Sign in with Google"
- Authorize the app
- ✅ Should redirect to dashboard

### Test 3: Create Invoice
- Create a test invoice
- ✅ Should save successfully

### Test 4: Google Drive Sync
- Go to Settings → Google Drive
- Click "Connect Google Drive"
- ✅ Should show "Connected"

### Test 5: Payment Link
- Create invoice
- Click "Generate Payment Link"
- ✅ Should create Stripe payment link

---

## 🔧 TROUBLESHOOTING

### Issue: "Build Failed"
**Solution:**
- Check build logs in Vercel dashboard
- Ensure `package.json` is correct
- Try deploying again

### Issue: "Google OAuth not working"
**Solution:**
- Verify redirect URIs in Google Cloud Console
- Make sure they match your Vercel URL exactly
- Check browser console for errors

### Issue: "Stripe webhook not firing"
**Solution:**
- Verify webhook URL is correct
- Check webhook secret in environment variables
- Test webhook in Stripe dashboard

### Issue: "Environment variables not working"
**Solution:**
- Redeploy after adding environment variables
- Check variable names match exactly
- Ensure they're set for "Production" environment

---

## 📊 MONITORING & ANALYTICS

### Vercel Analytics
- Visit: https://vercel.com/your-username/cognicore-invoicing-system/analytics
- View page views, performance, errors

### Vercel Logs
- Visit: https://vercel.com/your-username/cognicore-invoicing-system/logs
- View real-time function logs
- Debug errors

---

## 🎉 SUCCESS CHECKLIST

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables added
- [ ] Google OAuth configured
- [ ] Stripe webhook configured
- [ ] App loads successfully
- [ ] Google login works
- [ ] Invoice creation works
- [ ] Payment links work
- [ ] Google Drive sync works

---

## 🔗 IMPORTANT LINKS

- **Live App:** https://your-app.vercel.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/Awehbelekker/CogniCore-Invoicing-System
- **Stripe Dashboard:** https://dashboard.stripe.com/acct_1SnZvjLQhlp66eti
- **Google Cloud:** https://console.cloud.google.com/apis/credentials?project=cognicore-invoicing-system

---

**🚀 You're live! Share your app with the world!**

