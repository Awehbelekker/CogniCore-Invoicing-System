# 🚀 CogniCore Deployment Checklist

## ✅ Pre-Deployment Testing

### Local Testing (5 minutes)

- [ ] **Test Landing Page**
  - [ ] Open `landing.html` in browser
  - [ ] Check all three pricing plans display correctly
  - [ ] Fill out application form
  - [ ] Submit test application
  - [ ] Verify data saved in localStorage
  - [ ] Check console for errors

- [ ] **Test Master Admin Portal**
  - [ ] Open `master-admin.html` in browser
  - [ ] Verify dashboard loads with stats
  - [ ] Check pending applications appear
  - [ ] Test approve workflow
  - [ ] Test reject workflow
  - [ ] Create test user
  - [ ] Create test company
  - [ ] Test branding tools
  - [ ] Test system configuration
  - [ ] Check all tabs work

- [ ] **Test Responsive Design**
  - [ ] Test on mobile (375px width)
  - [ ] Test on tablet (768px width)
  - [ ] Test on desktop (1920px width)
  - [ ] Check all buttons are clickable
  - [ ] Verify forms work on mobile

---

## 🔧 Backend Setup

### Node.js Environment

- [ ] **Install Dependencies**
  ```bash
  npm init -y
  npm install express stripe nodemailer node-cron dotenv cors body-parser
  ```

- [ ] **Create Data Directory**
  ```bash
  mkdir data
  ```

- [ ] **Create `.env` File**
  ```bash
  STRIPE_SECRET_KEY=sk_test_xxxxx
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
  ADMIN_EMAIL=admin@cognicore.com
  APP_URL=http://localhost:3000
  ADMIN_PORTAL_URL=http://localhost:3000/master-admin.html
  AUTO_BLOCK_DAYS=30
  ```

- [ ] **Create `server.js`**
  ```javascript
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  require('dotenv').config();

  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.static('.'));

  app.use('/api/onboarding', require('./api/onboarding'));
  app.use('/api/client-blocking', require('./api/client-blocking'));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
  });
  ```

- [ ] **Test Local Server**
  ```bash
  node server.js
  ```
  - [ ] Visit http://localhost:3000/landing.html
  - [ ] Visit http://localhost:3000/master-admin.html
  - [ ] Check console for errors

---

## 💳 Stripe Configuration

### Stripe Account Setup

- [ ] **Create Stripe Account**
  - [ ] Go to https://stripe.com
  - [ ] Sign up for account
  - [ ] Complete business verification

- [ ] **Get API Keys**
  - [ ] Go to Dashboard → Developers → API keys
  - [ ] Copy "Secret key" (starts with `sk_test_` or `sk_live_`)
  - [ ] Add to `.env` file

- [ ] **Set Up Webhook**
  - [ ] Go to Dashboard → Developers → Webhooks
  - [ ] Click "Add endpoint"
  - [ ] URL: `https://yourdomain.com/api/onboarding/webhook/stripe`
  - [ ] Select events:
    - [ ] `invoice.paid`
    - [ ] `invoice.payment_failed`
    - [ ] `customer.subscription.deleted`
  - [ ] Copy webhook secret (starts with `whsec_`)
  - [ ] Add to `.env` file

- [ ] **Test Webhook**
  - [ ] Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/onboarding/webhook/stripe`
  - [ ] Trigger test event
  - [ ] Verify webhook received

---

## 📧 Email Configuration

### Gmail Setup

- [ ] **Enable 2-Factor Authentication**
  - [ ] Go to Google Account settings
  - [ ] Security → 2-Step Verification
  - [ ] Turn on

- [ ] **Create App Password**
  - [ ] Security → App passwords
  - [ ] Select "Mail" and "Other"
  - [ ] Copy 16-character password
  - [ ] Add to `.env` as `EMAIL_PASSWORD`

- [ ] **Test Email Sending**
  - [ ] Submit test application
  - [ ] Check if confirmation email received
  - [ ] Approve application
  - [ ] Check if approval email received

---

## 🎨 Customization

### Branding

- [ ] **Update Colors**
  - [ ] Edit `landing.html` lines 12-18
  - [ ] Edit `master-admin.html` lines 12-18
  - [ ] Change `--primary` and `--secondary` colors

- [ ] **Update Pricing**
  - [ ] Edit `landing.html` lines 460-505
  - [ ] Change plan prices
  - [ ] Update plan features

- [ ] **Update Company Name**
  - [ ] Find and replace "CogniCore" with your company name
  - [ ] Update in both HTML files
  - [ ] Update in email templates (api/onboarding.js)

- [ ] **Update Contact Info**
  - [ ] Edit footer in `landing.html` (line 518)
  - [ ] Update email addresses
  - [ ] Update phone numbers

---

## 🌐 Deployment

### Choose Hosting Platform

#### Option A: Heroku (Recommended for beginners)

- [ ] **Install Heroku CLI**
  ```bash
  npm install -g heroku
  ```

- [ ] **Create Heroku App**
  ```bash
  heroku login
  heroku create cognicore-app
  ```

- [ ] **Set Environment Variables**
  ```bash
  heroku config:set STRIPE_SECRET_KEY=sk_live_xxxxx
  heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
  heroku config:set EMAIL_USER=your-email@gmail.com
  heroku config:set EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"
  heroku config:set ADMIN_EMAIL=admin@cognicore.com
  heroku config:set APP_URL=https://cognicore-app.herokuapp.com
  heroku config:set AUTO_BLOCK_DAYS=30
  ```

- [ ] **Deploy**
  ```bash
  git init
  git add .
  git commit -m "Initial deployment"
  git push heroku main
  ```

- [ ] **Open App**
  ```bash
  heroku open
  ```

#### Option B: DigitalOcean

- [ ] Create Droplet (Ubuntu)
- [ ] Install Node.js
- [ ] Upload files via SFTP
- [ ] Install PM2: `npm install -g pm2`
- [ ] Run: `pm2 start server.js`
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificate (Let's Encrypt)

#### Option C: Netlify (Frontend Only)

- [ ] Drag and drop `landing.html` to Netlify
- [ ] Configure custom domain
- [ ] Deploy `master-admin.html` to password-protected subdomain

---

## 🔒 Security

### Production Security Checklist

- [ ] **Add Authentication to Admin Portal**
  - [ ] Implement login system
  - [ ] Use JWT tokens or sessions
  - [ ] Require password to access master-admin.html

- [ ] **Enable HTTPS**
  - [ ] Get SSL certificate (Let's Encrypt)
  - [ ] Force HTTPS redirect
  - [ ] Update all URLs to https://

- [ ] **Secure API Endpoints**
  - [ ] Add API key authentication
  - [ ] Implement rate limiting
  - [ ] Add CORS configuration
  - [ ] Validate all inputs

- [ ] **Environment Variables**
  - [ ] Never commit `.env` to git
  - [ ] Add `.env` to `.gitignore`
  - [ ] Use platform environment variables in production

- [ ] **Database Security**
  - [ ] Encrypt sensitive data
  - [ ] Hash passwords (bcrypt)
  - [ ] Regular backups
  - [ ] Access control

---

## 📊 Post-Deployment Testing

### Live Testing

- [ ] **Test Landing Page**
  - [ ] Visit live URL
  - [ ] Submit real application
  - [ ] Verify email received

- [ ] **Test Admin Portal**
  - [ ] Access admin portal
  - [ ] Approve test application
  - [ ] Verify Stripe invoice created

- [ ] **Test Payment Flow**
  - [ ] Pay test invoice
  - [ ] Verify webhook triggered
  - [ ] Check company account created
  - [ ] Verify welcome email sent

- [ ] **Test Blocking System**
  - [ ] Manually trigger block
  - [ ] Verify email sent
  - [ ] Check user suspended
  - [ ] Test unblock

---

## 🎯 Go-Live Checklist

### Final Steps

- [ ] **Switch to Live Stripe Keys**
  - [ ] Replace `sk_test_` with `sk_live_`
  - [ ] Update webhook to production URL
  - [ ] Test with real payment

- [ ] **Update URLs**
  - [ ] Change all localhost URLs to production
  - [ ] Update email templates
  - [ ] Update redirect URLs

- [ ] **Set Up Monitoring**
  - [ ] Add error tracking (Sentry)
  - [ ] Set up uptime monitoring
  - [ ] Configure log aggregation

- [ ] **Create Backups**
  - [ ] Set up automated backups
  - [ ] Test restore process
  - [ ] Document backup procedure

- [ ] **Documentation**
  - [ ] Share MASTER_ADMIN_GUIDE.md with team
  - [ ] Create admin training materials
  - [ ] Document custom configurations

---

## 📞 Support Resources

### Documentation

- [ ] Read `MASTER_ADMIN_GUIDE.md` (complete guide)
- [ ] Read `QUICK_START.md` (quick reference)
- [ ] Read `DELIVERY_SUMMARY.md` (overview)

### External Resources

- [ ] [Stripe Documentation](https://stripe.com/docs)
- [ ] [Nodemailer Guide](https://nodemailer.com)
- [ ] [Express.js Docs](https://expressjs.com)
- [ ] [Node-Cron Guide](https://www.npmjs.com/package/node-cron)

---

## ✅ Launch Day

### Final Checks

- [ ] All tests passing
- [ ] SSL certificate active
- [ ] Email notifications working
- [ ] Stripe payments working
- [ ] Webhooks configured
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Team trained
- [ ] Documentation complete

### Announce Launch

- [ ] Update website
- [ ] Send announcement email
- [ ] Post on social media
- [ ] Notify existing clients

---

## 🎉 You're Live!

**Congratulations! Your CogniCore platform is now live!** 🚀

### Daily Tasks

- [ ] Check pending applications
- [ ] Review blocked clients
- [ ] Monitor payment failures
- [ ] Check activity logs

### Weekly Tasks

- [ ] Review system performance
- [ ] Check error logs
- [ ] Update blocked clients
- [ ] Generate reports

### Monthly Tasks

- [ ] Review commission rates
- [ ] Analyze revenue
- [ ] Update pricing if needed
- [ ] System maintenance

---

**Need Help?**  
Refer to `MASTER_ADMIN_GUIDE.md` for detailed troubleshooting and support.

**Good luck! 🎯**
