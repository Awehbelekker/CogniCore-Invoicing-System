# 🚀 Accounting Features - Quick Start Guide

## Where to Find Everything

### 📊 **ACCOUNTING TAB**
**For:** General ledger, tax tracking, AR aging, multi-currency

**What you can do:**
- 📖 **General Ledger**: View all journal entries automatically posted
  - Every invoice creates: Dr. AR / Cr. Sales Revenue
  - Every payment: Dr. Bank / Cr. AR
  - Complete history with balances

- 💰 **Tax Management**: Track GST in/out
  - See tax collected from customer invoices
  - See tax paid on expenses
  - Calculate net tax liability
  - Export for tax filing

- 🕐 **AR Aging**: Collect overdue invoices
  - 0-30 days: Current
  - 31-60 days: Slow
  - 61-90 days: Very slow
  - 90+ days: Critical
  - Export to contact customers

- 💱 **Multi-Currency**: Invoice in USD, EUR, GBP, etc.
  - View current exchange rates
  - Auto-convert for reporting
  - Track currency gains/losses

---

### 📈 **REPORTS TAB**
**For:** Financial statements, dashboards, KPIs, cash flow

**What you can do:**
- 📊 **Financial Statements**: Generate standard reports
  - Income Statement (P&L)
  - Balance Sheet (Assets vs Liabilities)
  - Cash Flow Statement
  - Trial Balance

- 📊 **KPI Dashboard**: Monitor business health
  - **DTI** (Days to Invoice): Faster = better efficiency
  - **DSO** (Days Sales Outstanding): Faster = better cash flow
  - **On-Time Payment %**: Higher = more reliable customers
  - **Invoice Accuracy %**: Higher = better quality
  - **Customer Lifetime Value**: Average per customer

- 📈 **Cash Flow Forecast**: See 12-month projection
  - Income forecast
  - Expense forecast
  - Net cash position
  - Confidence level for each month

---

### 💸 **EXPENSES TAB**
**For:** Track business spending

**What you can do:**
- 📷 **Scan Receipt**: Use phone camera to capture expenses
  - OCR automatically reads amount, date, vendor
  - Just upload and confirm

- ✏️ **Manual Entry**: Type expense details
  - Date, description, category, amount
  - Select approver

- 📤 **Bulk Upload**: Import from CSV
  - Download template
  - Fill in your expenses
  - Upload all at once

**Expense Categories:**
- Travel (flights, hotels, transport)
- Supplies (stationery, equipment)
- Utilities (electricity, water, internet)
- Services (consulting, repairs)
- Marketing (advertising, social media)

---

### 💰 **BUDGET TAB**
**For:** Control spending with budgets

**What you can do:**
- 📊 Create monthly/quarterly/annual budgets
- Set limits per category
- System automatically tracks actual vs budget
- Get alerts when approaching limits
- See variance analysis

**Example:**
```
Category: Travel
Budget: R 5,000/month
Actual: R 3,200 (64%)
Status: On track ✅
```

---

### ✅ **COMPLIANCE TAB**
**For:** Audit, approvals, document retention

**What you can do:**
- 🔐 **Audit Trail**: See every action
  - Who: User name
  - What: Action taken
  - When: Exact timestamp
  - Where: IP address
  - Export for reviews

- ✅ **Approval Workflows**: Require approval for big transactions
  - Invoices > R 50,000 need approval
  - Expenses > R 10,000 need approval
  - Credits > R 5,000 need approval
  - Approver gets email notification

- 📁 **Document Retention**: Auto-organize documents
  - Active documents: Working files
  - Archived: Old files (7+ years)
  - Soft Deleted: Recoverable for 30 days

---

## 🎯 Daily Tasks

### Every Morning
```
1. Check Dashboard for overnight invoices/payments
2. Review Audit Trail for any suspicious activity
3. Check pending approvals
```

### Every Friday
```
1. Review KPIs (DSO, Payment %, Accuracy)
2. Check Cash Flow Forecast for next month
3. Compare Budget vs Actual spending
4. Export AR Aging to follow up on slow payers
```

### Monthly
```
1. Generate Income Statement (P&L)
2. Calculate tax liability
3. Export GL entries to accountant
4. Review all expenses in Expenses tab
5. Reforecast if needed
```

### Quarterly
```
1. Generate Balance Sheet
2. Run full Trial Balance check
3. Compare KPIs to previous quarter
4. Export Audit Trail for review
5. Update budgets
```

### Annually
```
1. Generate all Financial Statements
2. Full P&L & Balance Sheet
3. Complete Tax report
4. Archive prior year documents
5. Export all GL entries
```

---

## 💡 Key Concepts

### General Ledger
**What:** Record of every financial transaction  
**Why:** Required for accurate financial reporting  
**How:** Automatically updated when invoices created/paid

### Tax Tracking
**What:** Monitor GST collected vs paid  
**Why:** Calculate tax liability for filing  
**How:** Every invoice calculates tax, system tracks total

### AR Aging
**What:** Categorize unpaid invoices by age  
**Why:** Prioritize collection efforts  
**How:** System auto-calculates days overdue

### Cash Flow
**What:** Predict money in/out over time  
**Why:** Avoid cash shortages  
**How:** Projects based on invoice patterns

### KPIs
**What:** Business health measurements  
**Why:** Identify trends and problems  
**How:** System calculates daily from transactions

---

## 📊 Sample Scenarios

### Scenario 1: Tax Filing
```
Month: January
Tax Collected (GST Out): R 15,000
Tax Paid (GST In): R 3,500
Net Tax Liability: R 11,500
→ Pay R 11,500 to SARS by deadline
```

### Scenario 2: AR Collection
```
Customer: ABC Ltd
Invoice: INV-001, Due 31 Dec
Today: 15 Jan (15 days overdue)
AR Aging Bucket: 0-30 days (yellow flag)
Action: Send reminder email
```

### Scenario 3: Cash Flow
```
Current: R 50,000 in bank
February Forecast: R +30,000 income, -25,000 expenses = R 55,000
March Forecast: R +10,000 income, -40,000 expenses = R 25,000 (LOW!)
Action: Plan for March cash shortage
```

### Scenario 4: Budget Alert
```
Budget Category: Travel
Monthly Budget: R 5,000
Date: 15 Jan
Spent So Far: R 4,800 (96%)
Alert: ⚠️ Approaching limit!
Action: Review remaining travel needs
```

---

## ⚙️ Settings

### Tax Rate
- Go to Settings
- Default tax rate: 15% (GST)
- Change if you use different rate
- Affects all new invoices

### Approval Limits
- Go to Compliance Tab → Setup Approval Rules
- Invoice approval threshold (e.g., > R 50,000)
- Expense approval threshold (e.g., > R 10,000)
- Credit approval threshold (e.g., > R 5,000)

### Budget Period
- Go to Budget Tab
- Create budgets (monthly/quarterly/annual)
- Set limits per category
- System tracks automatically

### Retention Policy
- Go to Compliance Tab
- Documents archive after 7 years
- Soft-deleted documents recoverable for 30 days
- Automatically managed by system

---

## 🔍 Troubleshooting

### Q: GL entries not showing?
**A:** 
1. Make sure you created an invoice
2. GL posts when invoice created
3. Check "Accounting" tab → "General Ledger" section
4. Refresh page if needed

### Q: Tax not calculating?
**A:**
1. Go to Settings
2. Verify tax rate is set (usually 15%)
3. Make sure invoices have tax enabled
4. Try creating new invoice to test

### Q: AR Aging empty?
**A:**
1. Only unpaid invoices show in aging
2. Create test invoice
3. Mark it as due (don't pay it)
4. It will appear in aging report

### Q: Budget alerts not working?
**A:**
1. Must create budget first
2. Go to Budget Tab
3. Click "Create Budget"
4. Set category limits
5. Add expenses to trigger alerts

### Q: Approval not triggering?
**A:**
1. Go to Compliance Tab
2. Click "Setup Approval Rules"
3. Make sure threshold is correct
4. Create invoice above threshold
5. Approval should trigger

---

## 📱 Mobile Tips

- Use **Expenses Tab** → **Scan Receipt** to capture on the go
- Check **Dashboard** for quick view on phone
- **KPI Dashboard** shows key metrics at a glance
- **AR Aging** helps with collections calls

---

## 🚀 Advanced Features

### Export Data
All reports can be exported to CSV:
- ✅ GL entries
- ✅ Income Statement
- ✅ Balance Sheet
- ✅ Tax Summary
- ✅ AR Aging
- ✅ Audit Trail

→ Use for Excel analysis or send to accountant

### Multi-Business View
If you have multiple businesses:
- Go to Dashboard
- Select "All Businesses"
- See consolidated P&L
- Compare performance

### Audit for Compliance
- Go to Compliance Tab
- Export audit trail
- Shows who did what and when
- Use for internal/external audits

---

## 💬 Notes for Your Accountant

**To share with your accountant:**
1. All GL entries exported in standard format
2. Monthly tax tracking available
3. P&L & Balance Sheet generated automatically
4. Trial Balance confirms accuracy
5. Audit trail shows all changes
6. AR Aging identifies collection issues

**Files to share:**
- GL entries (CSV)
- Income Statement (CSV)
- Balance Sheet (CSV)
- Tax Summary (CSV)
- Audit Trail (CSV)

---

## ✅ Quick Checklist

### Week 1
- [ ] Explore Accounting Tab
- [ ] Review GL entries (should auto-post)
- [ ] Check Tax tracking
- [ ] Enable AR Aging
- [ ] Export your first report

### Week 2
- [ ] Set up approval workflows
- [ ] Configure budget limits
- [ ] Add first expense
- [ ] Review KPIs
- [ ] Generate Income Statement

### Week 3
- [ ] Start collecting metrics
- [ ] Forecast 3 months ahead
- [ ] Compare Budget vs Actual
- [ ] Review Audit Trail
- [ ] Generate full Financial Statements

### Week 4
- [ ] All features working
- [ ] Team trained
- [ ] Reports being used
- [ ] Budgets being tracked
- [ ] Ready for month-end close

---

## 🎓 Accounting Terms Explained

| Term | Meaning | Example |
|------|---------|---------|
| **DR** | Debit (left side) | DR AR 1000 (customer owes money) |
| **CR** | Credit (right side) | CR Sales 1000 (earned revenue) |
| **GL** | General Ledger | Record of all transactions |
| **AR** | Accounts Receivable | Money customers owe you |
| **GST** | Goods & Services Tax | Sales tax (15% in South Africa) |
| **DTI** | Days to Invoice | How fast you bill |
| **DSO** | Days Sales Outstanding | How fast you get paid |
| **P&L** | Profit & Loss | Income minus expenses |
| **BS** | Balance Sheet | Assets vs Liabilities |
| **TB** | Trial Balance | GL check (debits = credits) |

---

## 📞 Support

**Need help?**
- Check this guide first
- Look for tooltips in the system
- Check Troubleshooting section above
- All features have descriptions

**Report bugs:**
- Take screenshot
- Note what you were doing
- Share with development team

---

**Happy accounting!** 🎉

