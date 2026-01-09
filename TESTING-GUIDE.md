# 🧪 TESTING GUIDE - Stripe Payment System

## 📋 OVERVIEW

This guide provides step-by-step testing scenarios to verify all payment system features work correctly before going live.

---

## 🎯 TEST SCENARIOS

### Scenario 1: Complete Payment Flow (Happy Path)

**Objective:** Test full payment cycle from invoice creation to payment confirmation

**Steps:**
1. **Create Business Account**
   - Log in to system
   - Create new business: "Test Coffee Shop"
   - Save business details

2. **Connect Stripe**
   - Go to Settings → Payments
   - Click "Connect Stripe"
   - Complete Stripe Express onboarding
   - Verify success message

3. **Create Customer**
   - Go to Customers tab
   - Add customer: "John Doe"
   - Email: john@example.com
   - Phone: 0821234567
   - Save customer

4. **Create Invoice**
   - Go to Invoices tab
   - Click "New Invoice"
   - Select customer: John Doe
   - Add product: "Coffee" - R50
   - Add product: "Muffin" - R30
   - Total: R80
   - Save invoice

5. **Generate Payment Link**
   - Open invoice
   - Click "Generate Payment Link"
   - Verify commission calculation:
     - Total: R80.00
     - Commission (0.5%): R0.40
     - Business receives: R79.60
   - Copy payment link

6. **Make Test Payment**
   - Open payment link in new browser
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: 12/25
   - CVC: 123
   - Click "Pay"
   - Verify success message

7. **Verify Auto-Update**
   - Return to invoice system
   - Refresh invoice list
   - Verify invoice status changed to "PAID"
   - Check receipt was generated
   - Verify payment date is recorded

8. **Check Commission Split**
   - Go to Stripe Dashboard
   - Check Payments
   - Verify R80 payment received
   - Verify R0.40 commission to platform
   - Verify R79.60 to business

**Expected Result:** ✅ All steps complete successfully, invoice auto-updates, commission splits correctly

---

### Scenario 2: Cash Payment Recording

**Objective:** Test manual cash payment recording and tracking

**Steps:**
1. Create invoice for R500
2. Customer pays cash to staff member
3. Staff member records payment:
   - Click "Record Cash Payment"
   - Enter amount: R500
   - Select staff member
   - Add note: "Paid in cash at counter"
   - Save
4. Verify invoice status updates to "PAID"
5. Check payment method shows "Cash"
6. Verify staff member name is recorded

**Expected Result:** ✅ Cash payment recorded, invoice updated, staff tracking works

---

### Scenario 3: Fraud Detection - No Payment Record

**Objective:** Test fraud detection when customer claims payment but no record exists

**Steps:**
1. Create invoice for R1000
2. Customer claims they paid (but didn't)
3. Run fraud detection:
   - Check Stripe records: Not found
   - Check cash records: Not found
   - Risk score: +50 (High Risk)
4. Verify system flags as HIGH RISK
5. Check recommended action: "Request proof of payment"

**Expected Result:** ✅ Fraud detection flags suspicious claim, suggests appropriate action

---

### Scenario 4: Fraud Detection - Unverified Cash Payment

**Objective:** Test fraud detection for cash payment without staff verification

**Steps:**
1. Create invoice for R2000
2. Customer claims cash payment
3. No staff member recorded the payment
4. Run fraud detection:
   - Check Stripe: Not found
   - Check cash: Not found
   - Risk score: +50
5. Verify MEDIUM to HIGH RISK flag
6. Check recommended action

**Expected Result:** ✅ System detects unverified cash claim, flags for follow-up

---

### Scenario 5: CSV Staff Upload

**Objective:** Test bulk staff member upload

**Steps:**
1. Create CSV file `test-staff.csv`:
   ```csv
   name,email,role,phone,department
   Alice Manager,alice@test.com,manager,0821111111,Sales
   Bob Accountant,bob@test.com,accountant,0822222222,Finance
   Carol Staff,carol@test.com,staff,0823333333,Operations
   ```
2. Go to Settings → Staff
3. Click "Upload CSV"
4. Select file
5. Click "Upload"
6. Verify success message
7. Check all 3 staff members created
8. Verify roles assigned correctly
9. Check permissions are set

**Expected Result:** ✅ All staff members imported, roles and permissions assigned

---

### Scenario 6: Master Admin Portal

**Objective:** Test platform-wide management features

**Steps:**
1. Access Master Admin Portal:
   `https://your-domain.vercel.app/MASTER-ADMIN-PORTAL.html`
2. Verify all businesses are listed
3. Check platform statistics:
   - Total businesses
   - Total revenue
   - Total commissions
4. Test commission rate adjustment:
   - Change from 0.5% to 0.6%
   - Save
   - Verify new rate applies to new payments
5. Export business data
6. Verify CSV export is correct

**Expected Result:** ✅ Admin portal shows accurate data, commission adjustment works

---

### Scenario 7: Multiple Currency Support

**Objective:** Test payment processing in different currencies

**Steps:**
1. Create invoice in ZAR (R1000)
2. Generate payment link
3. Verify currency is ZAR
4. Create invoice in USD ($100)
5. Generate payment link
6. Verify currency is USD
7. Test payment in both currencies
8. Verify commission calculated correctly for each

**Expected Result:** ✅ Multi-currency support works, commission calculated correctly

---

### Scenario 8: Webhook Failure Recovery

**Objective:** Test system behavior when webhook fails

**Steps:**
1. Temporarily disable webhook in Stripe
2. Create invoice and payment link
3. Make test payment
4. Payment succeeds in Stripe
5. Invoice doesn't auto-update (webhook failed)
6. Re-enable webhook
7. Manually trigger webhook resend from Stripe
8. Verify invoice updates

**Expected Result:** ✅ System recovers from webhook failure, manual resend works

---

## 🔍 EDGE CASES TO TEST

### Edge Case 1: Duplicate Payment
- Customer pays twice for same invoice
- System should detect duplicate
- Suggest refund for second payment

### Edge Case 2: Partial Payment
- Invoice for R1000
- Customer pays R500
- System should track partial payment
- Show remaining balance

### Edge Case 3: Overpayment
- Invoice for R100
- Customer pays R150
- System should flag overpayment
- Suggest refund or credit

### Edge Case 4: Expired Payment Link
- Create payment link
- Wait for expiration (if configured)
- Attempt payment
- Verify appropriate error message

### Edge Case 5: Cancelled Payment
- Start payment process
- Cancel before completion
- Verify invoice remains "Pending"
- No commission charged

---

## 📊 PERFORMANCE TESTING

### Load Test 1: Multiple Simultaneous Payments
- Create 10 invoices
- Generate 10 payment links
- Process 10 payments simultaneously
- Verify all webhooks processed
- Check all invoices updated

### Load Test 2: Bulk Staff Upload
- Create CSV with 100 staff members
- Upload file
- Verify all imported correctly
- Check system performance

### Load Test 3: Large Invoice
- Create invoice with 50 line items
- Total: R50,000
- Generate payment link
- Process payment
- Verify commission: R250

---

## 🔐 SECURITY TESTING

### Security Test 1: Webhook Signature Verification
- Send fake webhook with invalid signature
- Verify system rejects it
- Check error is logged

### Security Test 2: Unauthorized Access
- Try to access Master Admin Portal without auth
- Verify access denied
- Try to access other business's data
- Verify isolation works

### Security Test 3: API Key Exposure
- Check frontend source code
- Verify no API keys visible
- Check network requests
- Verify keys not transmitted

---

## ✅ TEST CHECKLIST

### Pre-Launch Testing
- [ ] Scenario 1: Complete Payment Flow
- [ ] Scenario 2: Cash Payment Recording
- [ ] Scenario 3: Fraud Detection - No Record
- [ ] Scenario 4: Fraud Detection - Unverified
- [ ] Scenario 5: CSV Staff Upload
- [ ] Scenario 6: Master Admin Portal
- [ ] Scenario 7: Multi-Currency
- [ ] Scenario 8: Webhook Recovery

### Edge Cases
- [ ] Duplicate Payment
- [ ] Partial Payment
- [ ] Overpayment
- [ ] Expired Link
- [ ] Cancelled Payment

### Performance
- [ ] Multiple Simultaneous Payments
- [ ] Bulk Staff Upload
- [ ] Large Invoice

### Security
- [ ] Webhook Signature Verification
- [ ] Unauthorized Access
- [ ] API Key Exposure

---

## 📝 TEST RESULTS TEMPLATE

```
Test Date: ___________
Tester: ___________
Environment: [ ] Test [ ] Production

Scenario: ___________
Status: [ ] Pass [ ] Fail
Notes: ___________

Issues Found:
1. ___________
2. ___________

Screenshots: ___________
```

---

## 🆘 COMMON ISSUES & SOLUTIONS

### Issue: Payment link doesn't work
**Solution:** Check Stripe account is active, verify API keys

### Issue: Invoice doesn't auto-update
**Solution:** Check webhook configuration, verify webhook secret

### Issue: Commission not splitting
**Solution:** Verify business has Stripe account ID, check Connect settings

### Issue: Fraud detection not working
**Solution:** Check payment records exist, verify detection logic

---

**🎉 COMPLETE ALL TESTS BEFORE GOING LIVE!**

*Last Updated: 2026-01-08*

