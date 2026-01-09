# ⚡ PAYMENT SYSTEM QUICK START GUIDE

## 🚀 5-MINUTE SETUP

### Step 1: Install Stripe Package (1 minute)
```bash
npm install stripe
```

### Step 2: Get Stripe Keys (2 minutes)
1. Go to https://stripe.com
2. Sign up / Log in
3. Go to Developers → API Keys
4. Copy:
   - Secret Key (sk_test_...)
   - Publishable Key (pk_test_...)

### Step 3: Add Environment Variables (1 minute)
Create `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
APP_URL=https://your-domain.vercel.app
```

### Step 4: Deploy to Vercel (1 minute)
```bash
git add .
git commit -m "Add Stripe payment system"
git push
```
Then deploy on Vercel dashboard.

### Step 5: Configure Webhook (30 seconds)
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `checkout.session.completed`
4. Copy webhook secret to `.env`

---

## 💳 HOW TO USE

### For Business Owners:

**1. Connect Stripe Account**
- Go to Settings → Payments
- Click "Connect Stripe"
- Complete Stripe onboarding
- Done! ✅

**2. Create Invoice with Payment Link**
- Create invoice as normal
- Click "Generate Payment Link"
- Share link with customer
- Payment automatically processed

**3. Track Payments**
- View invoice status (auto-updates to "PAID")
- See commission breakdown
- Download receipts

### For Customers:

**1. Receive Invoice**
- Get email/WhatsApp with payment link
- Click link

**2. Pay Securely**
- Enter card details on Stripe
- Or use Apple Pay / Google Pay
- Submit payment

**3. Get Receipt**
- Instant confirmation
- Receipt emailed automatically
- Invoice marked as paid

---

## 🔢 COMMISSION CALCULATOR

| Invoice Amount | Platform Fee (0.5%) | Business Receives | Stripe Fee (~3%) | Business Net |
|----------------|---------------------|-------------------|------------------|--------------|
| R100 | R0.50 | R99.50 | R3.20 | R96.30 |
| R500 | R2.50 | R497.50 | R14.80 | R482.70 |
| R1,000 | R5.00 | R995.00 | R29.30 | R965.70 |
| R5,000 | R25.00 | R4,975.00 | R145.05 | R4,829.95 |
| R10,000 | R50.00 | R9,950.00 | R290.30 | R9,659.70 |

---

## 🎯 KEY FEATURES

✅ **0.5% Platform Commission** - Minimal fee for AI management
✅ **Automatic Invoice Updates** - AI marks invoices as paid
✅ **Fraud Detection** - Flags suspicious payment claims
✅ **Cash Payment Tracking** - Staff can record cash payments
✅ **Receipt Generation** - Automatic PDF receipts
✅ **Multi-Currency** - ZAR, USD, EUR, GBP supported
✅ **Secure** - PCI compliant via Stripe

---

## 📱 PAYMENT METHODS SUPPORTED

- 💳 Credit/Debit Cards (Visa, Mastercard, Amex)
- 🍎 Apple Pay
- 📱 Google Pay
- 💵 Cash (manual entry by staff)
- 🏦 Bank Transfer (coming soon)

---

## 🔐 SECURITY

- ✅ Stripe handles all card data (PCI compliant)
- ✅ No card details stored on your server
- ✅ Webhook signature verification
- ✅ HTTPS/SSL encryption
- ✅ Fraud detection algorithms

---

## 🆘 TROUBLESHOOTING

**Payment link not working?**
- Check business completed Stripe onboarding
- Verify Stripe account is active
- Ensure API keys are correct

**Invoice not updating to "PAID"?**
- Check webhook is configured
- Verify webhook secret matches
- Check Vercel function logs

**Commission not splitting?**
- Verify business has Stripe account ID
- Check `application_fee_amount` in payment
- Review Stripe Connect settings

---

## 📞 SUPPORT CONTACTS

**Stripe Issues:**
- Stripe Support: https://support.stripe.com
- Stripe Status: https://status.stripe.com

**System Issues:**
- Check Vercel logs
- Review webhook delivery in Stripe
- Test in Stripe test mode first

---

## 🎓 TRAINING RESOURCES

**For Staff:**
1. How to record cash payments
2. How to verify customer payments
3. How to handle payment disputes

**For Owners:**
1. How to connect Stripe account
2. How to view commission reports
3. How to export payment data

**For Customers:**
1. How to pay invoices online
2. How to download receipts
3. How to request refunds

---

## 📊 MASTER ADMIN PORTAL

**Access:** `https://your-domain.vercel.app/MASTER-ADMIN-PORTAL.html`

**Features:**
- View all businesses
- Monitor platform revenue
- Adjust commission rates
- Export all data
- Generate reports

**Login:** Platform administrator only

---

## 🎉 YOU'RE READY!

**Next Actions:**
1. ✅ Test payment in Stripe test mode
2. ✅ Create sample invoice
3. ✅ Generate payment link
4. ✅ Make test payment
5. ✅ Verify invoice updates
6. ✅ Check commission split
7. ✅ Switch to live mode

---

## 📚 FULL DOCUMENTATION

- `HOSTING-SETUP-COMPLETE-GUIDE.md` - Complete deployment guide
- `STRIPE-PAYMENT-SYSTEM-COMPLETE.md` - Full implementation details
- `BUSINESS-CLOUD-STORAGE-FIX.md` - Cloud storage setup

---

**Need Help?** Check the full documentation files above for detailed instructions.

*Last Updated: 2026-01-08*

