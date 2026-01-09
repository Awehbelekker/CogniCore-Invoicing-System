# 💳 Aweh Invoice System - Complete Payment Platform

## 🌟 Overview

A complete invoice management system with integrated Stripe Connect payments, AI automation, fraud detection, and multi-business support.

---

## ✨ Key Features

### 💰 Payment Processing
- **Stripe Connect Integration** - Accept card payments with 0.5% platform commission
- **Multiple Payment Methods** - Cards, Apple Pay, Google Pay, Cash
- **Automatic Commission Split** - Platform fee deducted before transfer to business
- **Multi-Currency Support** - ZAR, USD, EUR, GBP, and more

### 🤖 AI Automation
- **Auto Payment Processing** - AI handles payment confirmations
- **Smart Invoice Updates** - Automatic status changes (Pending → Paid)
- **Receipt Generation** - Instant PDF receipts
- **Fraud Detection** - AI flags suspicious payment claims

### 👥 Multi-Business Platform
- **Unlimited Businesses** - Each with own Stripe account
- **Role-Based Access** - 7 user roles with granular permissions
- **CSV Staff Upload** - Bulk import team members
- **Master Admin Portal** - Platform-wide management

### ☁️ Cloud Integration
- **Google Drive Sync** - Owner-only connection, staff access via system
- **Microsoft OneDrive** - Alternative cloud storage
- **Automatic Backups** - All data synced to cloud
- **Cross-Device Access** - Work from anywhere

### 🔒 Security & Compliance
- **PCI Compliant** - Via Stripe (no card data stored)
- **Fraud Detection** - Multi-layer verification
- **Webhook Verification** - Cryptographic signature checking
- **SSL/HTTPS** - End-to-end encryption

---

## 🚀 Quick Start

### 1. Installation
```bash
# Clone repository
git clone https://github.com/yourusername/aweh-invoice-system.git
cd aweh-invoice-system

# Install dependencies
npm install stripe

# Set up environment variables
cp .env.example .env
# Edit .env with your Stripe keys
```

### 2. Configuration
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://your-domain.vercel.app
PLATFORM_COMMISSION_RATE=0.5
```

### 3. Deploy
```bash
# Deploy to Vercel
vercel --prod

# Or push to GitHub and deploy via Vercel dashboard
git push origin main
```

### 4. Configure Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `checkout.session.completed`
4. Copy webhook secret to environment variables

---

## 📁 Project Structure

```
aweh-invoice-system/
├── api/
│   ├── stripe-create-payment.js      # Create payment links
│   ├── stripe-webhook.js              # Handle Stripe events
│   ├── stripe-onboard-business.js     # Onboard businesses
│   ├── ai-payment-processor.js        # AI payment automation
│   ├── payment-fraud-detection.js     # Fraud detection
│   └── upload-staff-csv.js            # Bulk staff upload
├── COMPLETE-INVOICE-SYSTEM.html       # Main application
├── MASTER-ADMIN-PORTAL.html           # Platform admin dashboard
├── index.html                         # Login page
├── package.json                       # Dependencies
├── vercel.json                        # Vercel configuration
└── docs/
    ├── HOSTING-SETUP-COMPLETE-GUIDE.md
    ├── STRIPE-PAYMENT-SYSTEM-COMPLETE.md
    ├── BUSINESS-CLOUD-STORAGE-FIX.md
    └── PAYMENT-SYSTEM-QUICK-START.md
```

---

## 🔄 Payment Flow

```
1. Business creates invoice
   ↓
2. System generates Stripe payment link (0.5% commission included)
   ↓
3. Customer receives invoice with payment link
   ↓
4. Customer pays via Stripe
   ↓
5. Stripe webhook notifies system
   ↓
6. AI Payment Processor validates payment
   ↓
7. AI updates invoice status to "PAID"
   ↓
8. AI generates receipt
   ↓
9. Platform receives 0.5% commission
   ↓
10. Business receives 99.5% of payment
   ↓
11. Customer receives receipt
```

---

## 💵 Commission Structure

**Platform Fee: 0.5%**

Example breakdown for R10,000 invoice:
```
Invoice Amount:              R10,000.00
Platform Commission (0.5%):       R50.00
Business Receives:            R9,950.00
Stripe Fees (~2.9% + R0.30):    R290.30
Business Net:                 R9,659.70
```

---

## 🎯 Use Cases

### For Small Businesses
- Create professional invoices
- Accept online payments
- Track payment status
- Manage customers
- Generate reports

### For Freelancers
- Quick invoice creation
- Get paid faster
- Track income
- Manage multiple clients
- Export for tax filing

### For Enterprises
- Multi-user access
- Role-based permissions
- Bulk operations
- Advanced reporting
- API integration

### For Platform Owners
- Manage multiple businesses
- Earn commission on transactions
- Monitor platform health
- Adjust commission rates
- Export platform data

---

## 🛠️ API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stripe-create-payment` | POST | Create payment link |
| `/api/stripe-webhook` | POST | Receive Stripe events |
| `/api/stripe-onboard-business` | POST | Onboard business to Stripe |
| `/api/ai-payment-processor` | POST | AI payment automation |
| `/api/payment-fraud-detection` | POST | Fraud detection |
| `/api/upload-staff-csv` | POST | Bulk staff upload |

---

## 📊 Features Comparison

| Feature | Free Plan | Pro Plan | Enterprise |
|---------|-----------|----------|------------|
| Invoices/month | 50 | Unlimited | Unlimited |
| Users | 3 | 10 | Unlimited |
| Payment Processing | ✅ | ✅ | ✅ |
| Cloud Sync | ✅ | ✅ | ✅ |
| AI Automation | ✅ | ✅ | ✅ |
| Fraud Detection | ✅ | ✅ | ✅ |
| Custom Branding | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |
| Commission Rate | 0.5% | 0.5% | Negotiable |

---

## 🔐 Security Features

- ✅ Stripe PCI compliance
- ✅ Webhook signature verification
- ✅ HTTPS/SSL encryption
- ✅ Role-based access control
- ✅ Fraud detection algorithms
- ✅ Audit logging
- ✅ Secure token storage
- ✅ CORS protection

---

## 📚 Documentation

- **[Quick Start Guide](PAYMENT-SYSTEM-QUICK-START.md)** - Get started in 5 minutes
- **[Complete Setup Guide](HOSTING-SETUP-COMPLETE-GUIDE.md)** - Full deployment instructions
- **[Payment System Details](STRIPE-PAYMENT-SYSTEM-COMPLETE.md)** - Technical implementation
- **[Cloud Storage Setup](BUSINESS-CLOUD-STORAGE-FIX.md)** - Google Drive integration

---

## 🤝 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@aweh-invoice-system.com
- **Stripe Support**: https://support.stripe.com

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Stripe** - Payment processing
- **Vercel** - Hosting platform
- **Google** - Cloud storage & OAuth
- **Microsoft** - OneDrive integration

---

## 🎉 Ready to Deploy!

Follow the [Quick Start Guide](PAYMENT-SYSTEM-QUICK-START.md) to get your system live in minutes.

---

*Built with ❤️ for businesses that want to get paid faster*

