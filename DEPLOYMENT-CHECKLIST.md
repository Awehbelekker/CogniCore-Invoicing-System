# ✅ DEPLOYMENT CHECKLIST

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Dependencies Installation
- [ ] Run `npm install stripe`
- [ ] Verify package.json includes `"stripe": "^14.10.0"`
- [ ] Check for any dependency conflicts
- [ ] Run `npm audit` to check for vulnerabilities

### 2. Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Enable Stripe Connect in Dashboard
- [ ] Enable Express accounts for businesses
- [ ] Get Test API keys:
  - [ ] Secret Key (sk_test_...)
  - [ ] Publishable Key (pk_test_...)
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] Select webhook events:
  - [ ] `payment_intent.succeeded`
  - [ ] `checkout.session.completed`
  - [ ] `account.updated`
- [ ] Copy Webhook Secret (whsec_...)

### 3. Environment Variables
- [ ] Create `.env` file (for local testing)
- [ ] Add to Vercel environment variables:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  APP_URL=https://your-domain.vercel.app
  PLATFORM_COMMISSION_RATE=0.5
  ```
- [ ] Verify all variables are set correctly
- [ ] Test environment variable access

### 4. Code Review
- [ ] Verify all 6 API files are present:
  - [ ] `api/stripe-create-payment.js`
  - [ ] `api/stripe-webhook.js`
  - [ ] `api/stripe-onboard-business.js`
  - [ ] `api/ai-payment-processor.js`
  - [ ] `api/payment-fraud-detection.js`
  - [ ] `api/upload-staff-csv.js`
- [ ] Check `MASTER-ADMIN-PORTAL.html` exists
- [ ] Verify all documentation files are present
- [ ] Review code for any hardcoded values

### 5. Git Repository
- [ ] Commit all changes
  ```bash
  git add .
  git commit -m "Add Stripe payment system with 0.5% commission"
  ```
- [ ] Push to GitHub
  ```bash
  git push origin main
  ```
- [ ] Verify all files are in repository
- [ ] Check `.gitignore` excludes `.env` file

---

## 🚀 DEPLOYMENT STEPS

### 1. Deploy to Vercel
- [ ] Log in to Vercel dashboard
- [ ] Connect GitHub repository
- [ ] Configure project settings
- [ ] Add environment variables (from step 3 above)
- [ ] Deploy project
- [ ] Wait for deployment to complete
- [ ] Note deployment URL

### 2. Update Stripe Webhook
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Update webhook endpoint URL to:
  ```
  https://your-actual-domain.vercel.app/api/stripe-webhook
  ```
- [ ] Save changes
- [ ] Test webhook delivery

### 3. Verify Deployment
- [ ] Visit deployed URL
- [ ] Check login page loads
- [ ] Test Google OAuth login
- [ ] Access main invoice system
- [ ] Check Master Admin Portal:
  ```
  https://your-domain.vercel.app/MASTER-ADMIN-PORTAL.html
  ```

---

## 🧪 TESTING CHECKLIST (TEST MODE)

### 1. Business Onboarding
- [ ] Create test business account
- [ ] Click "Connect Stripe" in Settings
- [ ] Complete Stripe Express onboarding
- [ ] Verify Stripe account ID is saved
- [ ] Check business appears in Master Admin Portal

### 2. Payment Link Creation
- [ ] Create test invoice (e.g., R1000)
- [ ] Click "Generate Payment Link"
- [ ] Verify payment link is created
- [ ] Check commission calculation (R5 for R1000)
- [ ] Copy payment link

### 3. Test Payment
- [ ] Open payment link in new browser
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date
- [ ] CVC: Any 3 digits
- [ ] Complete payment
- [ ] Verify payment success message

### 4. Webhook & AI Processing
- [ ] Check Stripe Dashboard → Webhooks → Events
- [ ] Verify webhook was delivered successfully
- [ ] Check invoice status updated to "PAID"
- [ ] Verify receipt was generated
- [ ] Check commission split in Stripe Dashboard

### 5. Fraud Detection
- [ ] Create test invoice
- [ ] Manually mark as "Customer Claims Paid"
- [ ] Run fraud detection
- [ ] Verify risk score is calculated
- [ ] Check appropriate action is suggested

### 6. CSV Staff Upload
- [ ] Create test CSV file:
  ```csv
  name,email,role,phone,department
  Test User,test@example.com,manager,0821234567,Sales
  ```
- [ ] Upload CSV
- [ ] Verify staff member is created
- [ ] Check permissions are assigned correctly

### 7. Master Admin Portal
- [ ] Access Master Admin Portal
- [ ] Verify all businesses are listed
- [ ] Check platform statistics
- [ ] Test commission rate adjustment
- [ ] Export business data
- [ ] Verify data is correct

---

## 🔴 GO LIVE CHECKLIST

### 1. Switch to Live Mode
- [ ] Get Stripe LIVE API keys:
  - [ ] Secret Key (sk_live_...)
  - [ ] Publishable Key (pk_live_...)
- [ ] Create LIVE webhook endpoint
- [ ] Get LIVE Webhook Secret (whsec_...)
- [ ] Update Vercel environment variables with LIVE keys
- [ ] Redeploy application

### 2. Final Verification
- [ ] Test live payment with real card (small amount)
- [ ] Verify commission split works correctly
- [ ] Check invoice updates automatically
- [ ] Verify receipt generation
- [ ] Test webhook delivery
- [ ] Check Master Admin Portal shows live data

### 3. Security Check
- [ ] Verify HTTPS is enabled
- [ ] Check webhook signature verification is working
- [ ] Test unauthorized access attempts
- [ ] Verify API keys are not exposed in frontend
- [ ] Check CORS settings
- [ ] Review error messages (no sensitive data exposed)

### 4. Monitoring Setup
- [ ] Set up Stripe email notifications
- [ ] Configure Vercel deployment notifications
- [ ] Set up error tracking (optional: Sentry)
- [ ] Create monitoring dashboard
- [ ] Set up alerts for failed payments

---

## 📊 POST-DEPLOYMENT MONITORING

### Daily Checks (First Week)
- [ ] Check Stripe Dashboard for payments
- [ ] Verify webhook delivery success rate
- [ ] Review error logs in Vercel
- [ ] Check invoice status updates
- [ ] Monitor commission calculations

### Weekly Checks
- [ ] Review platform revenue
- [ ] Check fraud detection alerts
- [ ] Verify all businesses are active
- [ ] Review customer support tickets
- [ ] Update documentation if needed

### Monthly Checks
- [ ] Generate platform reports
- [ ] Review commission rates
- [ ] Check for Stripe API updates
- [ ] Update dependencies if needed
- [ ] Backup all data

---

## 🆘 TROUBLESHOOTING

### Payment Link Not Working
- [ ] Check Stripe account is active
- [ ] Verify API keys are correct
- [ ] Check business completed onboarding
- [ ] Review Vercel function logs

### Invoice Not Updating
- [ ] Check webhook is configured correctly
- [ ] Verify webhook secret matches
- [ ] Check Stripe webhook delivery logs
- [ ] Review AI processor logs

### Commission Not Splitting
- [ ] Verify business has Stripe account ID
- [ ] Check `application_fee_amount` in payment
- [ ] Review Stripe Connect settings
- [ ] Check platform commission rate

### Webhook Failures
- [ ] Check webhook URL is correct
- [ ] Verify webhook secret is correct
- [ ] Check Vercel function timeout settings
- [ ] Review webhook signature verification

---

## 📞 SUPPORT RESOURCES

### Stripe Support
- Dashboard: https://dashboard.stripe.com
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com
- Status: https://status.stripe.com

### Vercel Support
- Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://vercel-status.com

### System Documentation
- Quick Start: `PAYMENT-SYSTEM-QUICK-START.md`
- Full Setup: `HOSTING-SETUP-COMPLETE-GUIDE.md`
- Technical Details: `STRIPE-PAYMENT-SYSTEM-COMPLETE.md`
- Cloud Storage: `BUSINESS-CLOUD-STORAGE-FIX.md`

---

## ✅ DEPLOYMENT COMPLETE

Once all items are checked:
- [ ] System is live and operational
- [ ] All tests passed
- [ ] Monitoring is active
- [ ] Documentation is accessible
- [ ] Support channels are ready

**🎉 CONGRATULATIONS! YOUR PAYMENT SYSTEM IS LIVE!**

---

*Last Updated: 2026-01-08*  
*Version: 1.0.0*

