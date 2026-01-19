# 🚀 CogniCore - Quick Start Guide

## 📦 What You Got

I've created a **complete enterprise SaaS platform** for you with:

### 1. **Professional Landing Page** (`landing.html`)
- Beautiful modern design with animations
- 3 pricing tiers (Starter R299, Professional R599, Enterprise R1,499)
- Client application form
- Fully responsive

### 2. **Master Admin Portal** (`master-admin.html`)
- Dashboard with real-time stats
- Pending client approvals
- User management (create, edit, delete, reset passwords)
- Company management
- Branding tools (logos, colors, templates)
- System configuration
- Blocked clients management

### 3. **AI-Powered Onboarding API** (`api/onboarding.js`)
- Automated client processing
- Fraud detection
- Stripe invoice generation
- Email notifications

### 4. **Client Blocking System** (`api/client-blocking.js`)
- Automated payment monitoring
- Progressive warnings (7, 14, 21 days)
- Auto-block after 30 days
- Email notifications

---

## ⚡ Quick Test (2 Minutes)

### Step 1: Open Landing Page
```bash
# Just double-click: landing.html
# Or open in browser
```

**What you'll see:**
- 🧠 CogniCore branding
- Feature showcase
- Pricing plans
- Application form

### Step 2: Submit Test Application
1. Click any "Choose Plan" button
2. Fill in the form:
   - Company: "Test Company"
   - Name: "John Doe"
   - Email: "test@example.com"
   - Phone: "+27123456789"
3. Click "Proceed to Payment"
4. Click "Submit"

### Step 3: Open Admin Portal
```bash
# Double-click: master-admin.html
```

**What you'll see:**
- Dashboard with stats
- Your test application in "Pending Clients"

### Step 4: Approve Application
1. Click "Pending Clients" in sidebar
2. Find your test application
3. Click "✅ Approve"
4. Review details
5. Click "Approve & Send Invoice"

**Done!** ✅ You've tested the complete workflow!

---

## 🎯 Two Deployment Options

### Option A: Simple (Frontend Only)

**Best for:** Quick testing, demo, MVP

**Steps:**
1. Upload `landing.html` to any web host
2. Upload `master-admin.html` to secure subdomain
3. Uses localStorage (data stored in browser)

**Pros:**
- ✅ No backend needed
- ✅ Deploy in 5 minutes
- ✅ Free hosting (GitHub Pages, Netlify)

**Cons:**
- ❌ Data only in browser
- ❌ No real Stripe integration
- ❌ No email notifications

### Option B: Full Stack (Recommended)

**Best for:** Production, real business

**Steps:**
1. Set up Node.js server
2. Configure Stripe API
3. Set up email service
4. Deploy backend API
5. Connect frontend to API

**Pros:**
- ✅ Real database
- ✅ Stripe payments work
- ✅ Email notifications
- ✅ Automated blocking

**Cons:**
- ❌ Requires backend setup
- ❌ Hosting costs

---

## 🔧 Full Stack Setup (15 Minutes)

### 1. Install Dependencies
```bash
npm init -y
npm install express stripe nodemailer node-cron dotenv cors body-parser
```

### 2. Create `.env` File
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@cognicore.com
APP_URL=http://localhost:3000
ADMIN_PORTAL_URL=http://localhost:3000/master-admin.html
AUTO_BLOCK_DAYS=30
```

### 3. Create `server.js`
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve HTML files

// API Routes
app.use('/api/onboarding', require('./api/onboarding'));
app.use('/api/client-blocking', require('./api/client-blocking'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 Landing page: http://localhost:${PORT}/landing.html`);
    console.log(`🎛️ Admin portal: http://localhost:${PORT}/master-admin.html`);
});
```

### 4. Create Data Directory
```bash
mkdir data
```

### 5. Run Server
```bash
node server.js
```

### 6. Test
- Landing page: http://localhost:3000/landing.html
- Admin portal: http://localhost:3000/master-admin.html

---

## 🎨 Customization

### Change Branding
**File:** `landing.html` and `master-admin.html`

```css
/* Lines 12-18 in both files */
:root {
    --primary: #667eea;      /* Your primary color */
    --secondary: #764ba2;    /* Your secondary color */
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
}
```

### Change Pricing
**File:** `landing.html` (lines 460-505)

```html
<div class="price">R 299</div>  <!-- Change amount -->
```

### Change Company Name
**Find and replace:** "CogniCore" → "Your Company Name"

---

## 📧 Email Setup (Gmail)

### 1. Enable 2-Factor Authentication
- Go to Google Account settings
- Security → 2-Step Verification → Turn On

### 2. Create App Password
- Security → App passwords
- Select "Mail" and "Other"
- Copy the 16-character password

### 3. Update `.env`
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App password
```

---

## 💳 Stripe Setup

### 1. Create Stripe Account
- Go to https://stripe.com
- Sign up for free

### 2. Get API Keys
- Dashboard → Developers → API keys
- Copy "Secret key" (starts with `sk_test_`)

### 3. Set Up Webhook
- Dashboard → Developers → Webhooks
- Add endpoint: `https://yourdomain.com/api/onboarding/webhook/stripe`
- Select events:
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
- Copy webhook secret (starts with `whsec_`)

### 4. Update `.env`
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🚀 Deployment Options

### Heroku (Easiest)
```bash
# Install Heroku CLI
heroku login
heroku create cognicore-app
git push heroku main
heroku config:set STRIPE_SECRET_KEY=sk_test_xxxxx
```

### DigitalOcean
- Create Droplet (Ubuntu)
- Install Node.js
- Upload files
- Run with PM2

### Netlify (Frontend Only)
- Drag and drop `landing.html`
- Done!

---

## ✅ Checklist

### Before Going Live:

- [ ] Test landing page
- [ ] Test admin portal
- [ ] Configure Stripe (live keys)
- [ ] Set up email service
- [ ] Test payment flow
- [ ] Test blocking system
- [ ] Add authentication to admin portal
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure custom domain
- [ ] Test all email notifications
- [ ] Create backup system
- [ ] Set up monitoring

---

## 🎯 Your Workflow

### Daily:
1. Open admin portal
2. Check pending applications
3. Approve/reject clients
4. Monitor blocked clients

### When Client Applies:
1. Receives application
2. You get email notification
3. Review in admin portal
4. Approve → Client gets payment link
5. Client pays → Account activated
6. Client receives login credentials

### When Payment Overdue:
- Day 7: Reminder email sent
- Day 14: Second reminder
- Day 21: Final warning
- Day 30: Auto-blocked (configurable)

---

## 🆘 Need Help?

### Common Issues:

**Q: Applications not showing?**  
A: Check browser console, verify localStorage or API connection

**Q: Emails not sending?**  
A: Verify EMAIL_USER and EMAIL_PASSWORD in .env

**Q: Stripe not working?**  
A: Check API keys, ensure webhook is configured

**Q: Auto-blocking not working?**  
A: Ensure server is running 24/7 for cron jobs

---

## 📚 Full Documentation

See `MASTER_ADMIN_GUIDE.md` for complete documentation including:
- Detailed feature explanations
- API documentation
- Security recommendations
- Advanced customization
- Troubleshooting guide

---

## 🎉 You're Ready!

You now have everything you need to run a professional SaaS platform!

**Next Steps:**
1. ✅ Test the system locally
2. ✅ Customize branding
3. ✅ Set up Stripe
4. ✅ Deploy to production
5. ✅ Start accepting clients!

**Good luck! 🚀**
