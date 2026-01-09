# 🚀 COMPLETE HOSTING & DEPLOYMENT GUIDE
## Aweh Invoice System with Stripe Connect

---

## 📋 TABLE OF CONTENTS

1. [Stripe Connect Setup](#stripe-connect-setup)
2. [Environment Variables](#environment-variables)
3. [Vercel Deployment](#vercel-deployment)
4. [Webhook Configuration](#webhook-configuration)
5. [Google Drive Setup](#google-drive-setup)
6. [Domain & SSL](#domain--ssl)
7. [Database Setup (Optional)](#database-setup)
8. [Testing Checklist](#testing-checklist)

---

## 🔷 1. STRIPE CONNECT SETUP

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign Up" and create your platform account
3. Complete business verification
4. Navigate to Dashboard

### Step 2: Enable Stripe Connect

1. In Stripe Dashboard, go to **Connect** → **Settings**
2. Click **Get Started** on Connect
3. Choose **Platform or Marketplace** as your business type
4. Complete the Connect onboarding form:
   - Platform name: "Aweh Invoice System"
   - Platform description: "Invoice management platform with payment processing"
   - Platform URL: Your domain (e.g., aweh-invoice-system.vercel.app)

### Step 3: Configure Connect Settings

1. Go to **Connect** → **Settings** → **Connect Settings**
2. Set **Account Types**: Enable "Express" accounts
3. Set **Branding**:
   - Upload your logo
   - Set brand colors
   - Add support email

### Step 4: Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
3. **IMPORTANT**: Keep secret key secure, never commit to Git

### Step 5: Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter endpoint URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.refunded`
   - `account.updated`
5. Click **Add Endpoint**
6. Copy the **Webhook Signing Secret** (starts with `whsec_`)

---

## 🔷 2. ENVIRONMENT VARIABLES

Create a `.env` file in your project root (for local development):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URL
APP_URL=https://aweh-invoice-system.vercel.app

# Google OAuth (if using Google Drive)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth (if using OneDrive)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Optional: Database (if using Supabase/PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Platform Settings
PLATFORM_COMMISSION_RATE=0.5
NODE_ENV=production
```

### For Vercel Deployment:

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above
4. Set scope to **Production**, **Preview**, and **Development**

---

## 🔷 3. VERCEL DEPLOYMENT

### Prerequisites

- GitHub/GitLab/Bitbucket account
- Vercel account (free tier works)
- Your code pushed to a Git repository

### Deployment Steps

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/aweh-invoice-system.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click **New Project**
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: **Other**
     - Root Directory: `./`
     - Build Command: (leave empty)
     - Output Directory: (leave empty)

3. **Add Environment Variables**
   - In Vercel project settings
   - Add all variables from section 2
   - Click **Deploy**

4. **Get Your Domain**
   - Vercel will provide: `your-project.vercel.app`
   - Update `APP_URL` environment variable with this domain
   - Redeploy if needed

---

## 🔷 4. WEBHOOK CONFIGURATION

### Update Stripe Webhook URL

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Update URL to: `https://your-actual-domain.vercel.app/api/stripe-webhook`
4. Save changes

### Test Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your endpoint
3. Click **Send test webhook**
4. Select `payment_intent.succeeded`
5. Check if webhook receives successfully

### Webhook Security

The webhook handler automatically verifies signatures using `STRIPE_WEBHOOK_SECRET`.
Never disable signature verification in production.

---

## 🔷 5. GOOGLE DRIVE SETUP

### Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project: "Aweh Invoice System"
3. Enable APIs:
   - Google Drive API
   - Google Picker API

### Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Aweh Invoice Web Client"
5. Authorized JavaScript origins:
   - `https://your-domain.vercel.app`
   - `http://localhost:3000` (for testing)
6. Authorized redirect URIs:
   - `https://your-domain.vercel.app`
   - `https://your-domain.vercel.app/COMPLETE-INVOICE-SYSTEM.html`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**
9. Add to environment variables

---

## 🔷 6. DOMAIN & SSL

### Using Vercel Domain (Free)

- Vercel provides: `your-project.vercel.app`
- SSL certificate: **Automatic** ✅
- No configuration needed

### Using Custom Domain

1. Purchase domain (e.g., from Namecheap, GoDaddy)
2. In Vercel project → **Settings** → **Domains**
3. Add your custom domain
4. Update DNS records as instructed by Vercel
5. SSL certificate: **Automatic** ✅

### DNS Records Example

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

---

## 🔷 7. DATABASE SETUP (OPTIONAL)

### Option A: LocalStorage (Current - No Setup Needed)

- Data stored in browser
- No database required
- Works immediately
- Limited to single device

### Option B: Supabase (Recommended for Production)

1. Go to https://supabase.com
2. Create new project
3. Get connection details:
   - Project URL
   - Anon/Public key
4. Run database migrations (see `database-schema.sql`)
5. Add to environment variables

---

## 🔷 8. TESTING CHECKLIST

### Before Going Live

- [ ] Stripe test mode working
- [ ] Webhook receiving events
- [ ] Payment links generating correctly
- [ ] Commission split (0.5%) calculating correctly
- [ ] Invoice status updating after payment
- [ ] Google Drive sync working
- [ ] All environment variables set
- [ ] SSL certificate active
- [ ] Custom domain configured (if using)

### Switch to Live Mode

1. In Stripe Dashboard, toggle to **Live Mode**
2. Get new API keys (live keys start with `pk_live_` and `sk_live_`)
3. Create new webhook for live mode
4. Update environment variables in Vercel
5. Test with real payment (small amount)
6. Verify commission split
7. Check webhook logs

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify webhook secret matches
- Check Vercel function logs

**Payment link not working:**
- Verify Stripe account is activated
- Check business has completed Connect onboarding
- Ensure API keys are correct

**Commission not splitting:**
- Verify `application_fee_amount` is set
- Check business Stripe account ID is correct
- Review Stripe Connect settings

---

## 🎉 YOU'RE READY!

Your Aweh Invoice System is now fully configured with:
- ✅ Stripe Connect payment processing
- ✅ 0.5% platform commission
- ✅ Automatic invoice status updates
- ✅ Webhook integration
- ✅ Secure hosting on Vercel
- ✅ SSL encryption
- ✅ Google Drive integration

**Next Steps:**
1. Test the complete payment flow
2. Onboard your first business
3. Create and send test invoice
4. Process test payment
5. Verify commission split in Stripe Dashboard

---

*Last Updated: 2026-01-08*

