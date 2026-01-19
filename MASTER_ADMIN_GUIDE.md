# 🧠 CogniCore Master Admin Portal - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Landing Page Setup](#landing-page-setup)
3. [Master Admin Portal](#master-admin-portal)
4. [AI-Powered Onboarding](#ai-powered-onboarding)
5. [Client Blocking System](#client-blocking-system)
6. [Configuration](#configuration)
7. [Deployment](#deployment)

---

## 🎯 Overview

Your CogniCore platform now includes:

### ✅ **Professional Landing Page** (`landing.html`)
- Beautiful gradient design with animations
- Pricing plans (Starter, Professional, Enterprise)
- Feature showcase
- Client application form
- Payment integration ready

### ✅ **Master Admin Portal** (`master-admin.html`)
- **Dashboard** - Real-time stats and activity monitoring
- **Pending Clients** - Review and approve new applications
- **User Management** - Create, edit, delete users, reset passwords
- **Company Management** - Full company account control
- **Branding Tools** - Upload logos, customize colors, templates
- **Template Manager** - Create custom invoice templates
- **System Configuration** - Platform settings, commission rates, integrations
- **Blocked Clients** - View and manage suspended accounts

### ✅ **AI-Powered Onboarding API** (`api/onboarding.js`)
- Automated application processing
- Fraud detection with AI analysis
- Stripe invoice generation
- Email notifications
- Webhook handling

### ✅ **Client Blocking System** (`api/client-blocking.js`)
- Automated payment monitoring
- Progressive warning system (7, 14, 21 days)
- Auto-block after 30 days (configurable)
- Manual block/unblock controls
- Email notifications at each stage

---

## 🚀 Landing Page Setup

### File: `landing.html`

**Features:**
- 🎨 Modern gradient design
- 📱 Fully responsive
- 💳 Three pricing tiers
- 📝 Application form with validation
- ✉️ Email notifications

**How It Works:**

1. **Client visits landing page**
2. **Selects a plan** (Starter/Professional/Enterprise)
3. **Fills application form:**
   - Company name
   - Contact name
   - Email
   - Phone
   - Requirements (optional)
4. **Submits application**
5. **Receives confirmation email**
6. **Application goes to Master Admin for approval**

**To Deploy:**
```bash
# Simply host landing.html on your web server
# Or use GitHub Pages, Netlify, Vercel, etc.
```

**Customization:**
- Edit pricing in lines 460-505
- Change colors in CSS variables (lines 12-18)
- Update contact info in footer (line 518)

---

## 🎛️ Master Admin Portal

### File: `master-admin.html`

### Access:
```
URL: https://yourdomain.com/master-admin.html
```

### Features:

#### 1️⃣ **Dashboard**
- Total clients count
- Pending approvals
- Active users
- Monthly revenue
- Recent activity log

#### 2️⃣ **Pending Clients**
Shows all new applications from landing page:
- View application details
- **Approve** → Creates company, sends invoice
- **Reject** → Removes application

**Approval Process:**
1. Click "✅ Approve" on application
2. Review client details
3. Click "Approve & Send Invoice"
4. System automatically:
   - Creates company account
   - Generates Stripe invoice
   - Sends payment link to client
   - Moves to active companies

#### 3️⃣ **User Management**

**Create User:**
```javascript
- Click "➕ Create User"
- Fill in details:
  * Full name
  * Email
  * Password
  * Company
  * Role (User/Admin/Master Admin)
- Click "Create User"
```

**Edit User:**
- Click "✏️ Edit" on any user
- Change name, email, role, status
- Reset password (leave blank to keep current)
- Click "Update User"

**Delete User:**
- Click "🗑️ Delete"
- Confirm deletion

#### 4️⃣ **Company Management**

**Create Company:**
```javascript
- Click "➕ Create Company"
- Enter:
  * Company name
  * Registration number
  * Plan (Starter/Professional/Enterprise)
  * Contact email
  * Phone
- Click "Create Company"
```

**Block Company:**
- Click "🚫 Block" on company
- Company status → Blocked
- All users suspended
- Added to blocked list

#### 5️⃣ **Branding Tools**

**Customize Company Branding:**
1. Select company from dropdown
2. Upload logo (PNG/JPG, max 5MB)
3. Choose colors:
   - Primary color
   - Secondary color
   - Accent color
4. Set company tagline
5. Create email signature
6. Click "💾 Save Branding"

**Branding is applied to:**
- Invoices
- Email templates
- Payment pages
- Customer portal

#### 6️⃣ **Template Management**

Create custom invoice templates:
- Multiple layouts
- Custom fields
- Branding integration
- Preview before deployment

#### 7️⃣ **System Configuration**

**Platform Settings:**
- **Commission Rate:** Platform fee per transaction (default 0.5%)
- **Default Currency:** ZAR, USD, EUR, GBP
- **Stripe API Key:** Your Stripe secret key
- **Google Drive:** Enable/disable cloud sync
- **Auto-Block Days:** Days before auto-suspension (default 30)

**To Update:**
1. Change settings
2. Click "💾 Save Configuration"
3. Settings apply immediately

#### 8️⃣ **Blocked Clients**

View all suspended accounts:
- Company name
- Block reason
- Blocked date
- Outstanding amount
- **Unblock** button

**To Unblock:**
1. Click "✅ Unblock"
2. Confirm action
3. Company reactivated
4. Users re-enabled
5. Email sent to client

---

## 🤖 AI-Powered Onboarding

### File: `api/onboarding.js`

### Endpoints:

#### 1. Submit Application
```javascript
POST /api/onboarding/submit

Body:
{
  "companyName": "Acme Corp",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "phone": "+27123456789",
  "plan": "professional",
  "price": 599,
  "requirements": "Need custom branding"
}

Response:
{
  "success": true,
  "applicationId": "APP-1234567890",
  "estimatedReviewTime": "24 hours"
}
```

#### 2. Approve Application
```javascript
POST /api/onboarding/approve/:applicationId

Body:
{
  "adminId": "ADMIN-123",
  "customPrice": 599,  // Optional: override price
  "notes": "Approved with custom pricing"
}

Response:
{
  "success": true,
  "invoiceUrl": "https://invoice.stripe.com/...",
  "customerId": "cus_xxxxx"
}
```

**What Happens:**
1. Creates Stripe customer
2. Generates invoice
3. Sends payment link to client
4. Updates application status
5. Logs activity

#### 3. Reject Application
```javascript
POST /api/onboarding/reject/:applicationId

Body:
{
  "adminId": "ADMIN-123",
  "reason": "Incomplete information",
  "sendEmail": true
}
```

#### 4. Stripe Webhook
```javascript
POST /api/onboarding/webhook/stripe

Handles:
- invoice.paid → Create company account, send welcome email
- invoice.payment_failed → Send failure notification
- customer.subscription.deleted → Block account
```

### AI Fraud Detection

The system automatically analyzes applications for:
- ✅ Disposable email addresses
- ✅ Suspicious company names
- ✅ Missing contact information
- ✅ Duplicate applications
- ✅ Risk scoring (0-1 scale)

**High-risk applications (score > 0.8):**
- Flagged for manual review
- Admin notified
- Requires approval before processing

---

## 🚫 Client Blocking System

### File: `api/client-blocking.js`

### Automated Payment Monitoring

**Runs daily at 2 AM:**
```javascript
// Checks all companies for overdue payments
// Sends warnings and blocks accounts automatically
```

### Warning Timeline:

| Days Overdue | Action | Email |
|--------------|--------|-------|
| 7 days | First reminder | 💳 Payment Reminder |
| 14 days | Second reminder | 💳 Payment Reminder |
| 21 days | Final warning | ⚠️ URGENT: Payment Required |
| 30 days | **AUTO-BLOCK** | 🚫 Account Suspended |

### Endpoints:

#### 1. Manual Block
```javascript
POST /api/client-blocking/block/:companyId

Body:
{
  "adminId": "ADMIN-123",
  "reason": "Non-payment"
}
```

#### 2. Unblock
```javascript
POST /api/client-blocking/unblock/:companyId

Body:
{
  "adminId": "ADMIN-123",
  "notes": "Payment received"
}
```

#### 3. Get Blocked Clients
```javascript
GET /api/client-blocking/blocked

Response:
{
  "success": true,
  "blockedClients": [...]
}
```

### What Happens When Blocked:

1. ✅ Company status → "blocked"
2. ✅ All user accounts suspended
3. ✅ Login disabled
4. ✅ Email notification sent
5. ✅ Admin notified
6. ✅ Added to blocked list
7. ✅ Activity logged

### What Happens When Unblocked:

1. ✅ Company status → "active"
2. ✅ User accounts re-enabled
3. ✅ Login restored
4. ✅ Email notification sent
5. ✅ Removed from blocked list
6. ✅ Activity logged

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@cognicore.com

# URLs
APP_URL=https://app.cognicore.com
ADMIN_PORTAL_URL=https://admin.cognicore.com

# System
AUTO_BLOCK_DAYS=30
COMMISSION_RATE=0.5
DEFAULT_CURRENCY=ZAR
```

### System Configuration (via Admin Portal)

Access: Master Admin Portal → System Config

**Settings:**
- Platform commission rate
- Default currency
- Stripe API key
- Google Drive integration
- Auto-block days

---

## 🚀 Deployment

### Option 1: Simple Hosting (Frontend Only)

**Landing Page:**
```bash
# Upload landing.html to:
- GitHub Pages
- Netlify
- Vercel
- Any web host

# Access at: https://yourdomain.com
```

**Master Admin Portal:**
```bash
# Upload master-admin.html to:
- Secure subdomain: https://admin.yourdomain.com
- Password-protected directory
- Behind authentication

# ⚠️ IMPORTANT: Protect this page!
```

### Option 2: Full Stack Deployment

**Backend API:**
```bash
# Install dependencies
npm install express stripe nodemailer node-cron

# Create server.js
const express = require('express');
const app = express();

app.use('/api/onboarding', require('./api/onboarding'));
app.use('/api/client-blocking', require('./api/client-blocking'));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

# Run server
node server.js

# Or use PM2 for production
pm2 start server.js
```

**Deploy to:**
- Heroku
- DigitalOcean
- AWS
- Google Cloud
- Azure

### Option 3: Integrate with Existing System

**Update landing.html:**
```javascript
// Line 600: Change API endpoint
async function processPayment(event) {
    // Change this:
    // localStorage.setItem(...)

    // To this:
    const response = await fetch('https://your-api.com/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
}
```

**Update master-admin.html:**
```javascript
// Replace localStorage calls with API calls
// Example:
async function loadPendingClients() {
    const response = await fetch('/api/onboarding/pending');
    const data = await response.json();
    // Display data...
}
```

---

## 📊 Data Storage

### Current Implementation (Demo):
- Uses `localStorage` for frontend
- Uses JSON files for backend API

### Production Recommendations:

**Database Options:**
1. **PostgreSQL** - Best for relational data
2. **MongoDB** - Best for flexibility
3. **Firebase** - Best for quick setup
4. **Supabase** - Best for modern stack

**File Storage:**
1. **AWS S3** - For logos and documents
2. **Google Cloud Storage**
3. **Cloudinary** - For images

---

## 🔒 Security Recommendations

### 1. Authentication
```javascript
// Add authentication to master-admin.html
// Use JWT tokens or session-based auth
// Require login before accessing admin portal
```

### 2. API Security
```javascript
// Add API key authentication
// Rate limiting
// CORS configuration
// Input validation
```

### 3. Data Protection
- Encrypt sensitive data
- Hash passwords (bcrypt)
- Use HTTPS only
- Regular backups

---

## 📧 Email Templates

All emails are professionally designed with:
- ✅ Responsive HTML
- ✅ Company branding
- ✅ Clear call-to-action buttons
- ✅ Professional formatting

**Email Types:**
1. Application confirmation
2. Admin notification (new application)
3. Approval with payment link
4. Rejection notification
5. Payment reminder (7 days)
6. Payment reminder (14 days)
7. Payment warning (21 days)
8. Account blocked
9. Account reactivated
10. Welcome email with credentials
11. Payment failure

---

## 🎨 Customization Guide

### Change Branding Colors

**landing.html (lines 12-18):**
```css
:root {
    --primary: #667eea;      /* Change to your primary color */
    --secondary: #764ba2;    /* Change to your secondary color */
    --success: #10b981;      /* Success color */
    --warning: #f59e0b;      /* Warning color */
    --danger: #ef4444;       /* Danger color */
}
```

### Change Pricing

**landing.html (lines 460-505):**
```html
<div class="price">R 299<span class="price-period">/month</span></div>
<!-- Change to your pricing -->
```

### Add More Features

**landing.html (lines 403-450):**
```html
<div class="feature-card">
    <div class="feature-icon">🆕</div>
    <h3>Your Feature</h3>
    <p>Feature description</p>
</div>
```

---

## 📞 Support & Maintenance

### Regular Tasks:

**Daily:**
- ✅ Check pending applications
- ✅ Review blocked clients
- ✅ Monitor payment failures

**Weekly:**
- ✅ Review activity logs
- ✅ Check system performance
- ✅ Update blocked clients

**Monthly:**
- ✅ Review commission rates
- ✅ Analyze revenue reports
- ✅ Update pricing if needed

---

## 🎯 Next Steps

1. **Test Landing Page:**
   - Open `landing.html` in browser
   - Submit test application
   - Check localStorage for data

2. **Test Admin Portal:**
   - Open `master-admin.html`
   - Review pending applications
   - Test approve/reject workflow

3. **Set Up Backend:**
   - Install Node.js dependencies
   - Configure environment variables
   - Test API endpoints

4. **Configure Stripe:**
   - Get API keys
   - Set up webhooks
   - Test payment flow

5. **Deploy:**
   - Choose hosting platform
   - Upload files
   - Configure domain
   - Test live system

---

## 🚨 Troubleshooting

### Issue: Applications not showing in admin portal
**Solution:** Check localStorage or API connection

### Issue: Emails not sending
**Solution:** Verify EMAIL_USER and EMAIL_PASSWORD in .env

### Issue: Stripe webhooks failing
**Solution:** Check STRIPE_WEBHOOK_SECRET and endpoint URL

### Issue: Auto-blocking not working
**Solution:** Ensure cron job is running (check server logs)

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Nodemailer Guide](https://nodemailer.com)
- [Express.js Docs](https://expressjs.com)
- [Node-Cron Guide](https://www.npmjs.com/package/node-cron)

---

## ✅ Summary

You now have a **complete enterprise-level admin system** with:

✅ Professional landing page with pricing
✅ AI-powered client onboarding
✅ Comprehensive admin portal
✅ User & company management
✅ Branding customization tools
✅ Automated payment monitoring
✅ Client blocking system
✅ Email notifications
✅ Activity logging
✅ Stripe integration

**Everything you need to run a professional SaaS platform!** 🎉

---

**Need Help?**
Contact: support@cognicore.com
Documentation: https://docs.cognicore.com

**Happy Managing! 🚀**

