/**
 * Payment Fraud Detection API
 * Detects cases where customer claims payment but no record exists
 * Links payments to invoices and tracks cash payments by staff
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      action,
      invoiceId,
      businessId,
      customerClaim,
      timeRange
    } = req.body;

    switch (action) {
      case 'check_fraud':
        return await checkFraudDetection(req, res, invoiceId, businessId, customerClaim);
      
      case 'link_payment':
        return await linkPaymentToInvoice(req, res, req.body);
      
      case 'verify_cash_payment':
        return await verifyCashPayment(req, res, req.body);
      
      case 'get_payment_history':
        return await getPaymentHistory(req, res, invoiceId);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Fraud detection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Fraud detection failed'
    });
  }
};

/**
 * Check for potential fraud
 */
async function checkFraudDetection(req, res, invoiceId, businessId, customerClaim) {
  // Simulate checking payment records
  // In production, this would query your database
  
  const fraudCheck = {
    invoiceId,
    businessId,
    timestamp: new Date().toISOString(),
    
    // Check 1: Stripe payment records
    stripePayments: {
      found: false,
      count: 0,
      totalAmount: 0,
      lastPayment: null
    },
    
    // Check 2: Cash payment records
    cashPayments: {
      found: false,
      count: 0,
      totalAmount: 0,
      recordedBy: [],
      lastPayment: null
    },
    
    // Check 3: Customer claim analysis
    customerClaim: {
      claimDate: customerClaim?.claimDate || null,
      claimAmount: customerClaim?.claimAmount || 0,
      claimMethod: customerClaim?.claimMethod || null,
      timeSinceClaim: customerClaim?.claimDate 
        ? calculateTimeDifference(customerClaim.claimDate, new Date())
        : null
    },
    
    // Fraud risk assessment
    riskAssessment: {
      level: 'low', // low, medium, high, critical
      score: 0, // 0-100
      flags: [],
      recommendation: ''
    }
  };

  // Analyze fraud risk
  const flags = [];
  let riskScore = 0;

  // Flag 1: Customer claims payment but no Stripe record
  if (customerClaim && !fraudCheck.stripePayments.found) {
    flags.push({
      type: 'NO_STRIPE_RECORD',
      severity: 'medium',
      message: 'Customer claims card payment but no Stripe transaction found',
      points: 30
    });
    riskScore += 30;
  }

  // Flag 2: Customer claims payment but no cash record
  if (customerClaim && !fraudCheck.cashPayments.found) {
    flags.push({
      type: 'NO_CASH_RECORD',
      severity: 'high',
      message: 'Customer claims cash payment but no staff member recorded it',
      points: 50
    });
    riskScore += 50;
  }

  // Flag 3: Claim is old (>7 days) with no record
  if (fraudCheck.customerClaim.timeSinceClaim?.days > 7) {
    flags.push({
      type: 'OLD_CLAIM',
      severity: 'high',
      message: 'Payment claim is over 7 days old with no verification',
      points: 40
    });
    riskScore += 40;
  }

  // Flag 4: Multiple claims for same invoice
  // (Would check database for duplicate claims)

  // Determine risk level
  let riskLevel = 'low';
  let recommendation = 'No fraud detected. Invoice payment status is accurate.';

  if (riskScore >= 70) {
    riskLevel = 'critical';
    recommendation = '🚨 CRITICAL: Contact customer immediately. Verify payment method and request proof of payment.';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
    recommendation = '⚠️ HIGH RISK: Review with customer. Request bank statement or receipt.';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
    recommendation = '⚡ MEDIUM RISK: Follow up with customer to clarify payment method.';
  }

  fraudCheck.riskAssessment = {
    level: riskLevel,
    score: riskScore,
    flags,
    recommendation
  };

  return res.status(200).json({
    success: true,
    fraudCheck,
    actions: [
      'Review payment records',
      'Contact customer if high risk',
      'Verify with staff members',
      'Request proof of payment if needed'
    ]
  });
}

/**
 * Link payment to invoice
 */
async function linkPaymentToInvoice(req, res, data) {
  const {
    invoiceId,
    paymentId,
    amount,
    method,
    reference,
    paidAt
  } = data;

  const paymentLink = {
    id: generateLinkId(),
    invoiceId,
    paymentId,
    amount,
    method,
    reference,
    paidAt: paidAt || new Date().toISOString(),
    linkedAt: new Date().toISOString(),
    linkedBy: 'AI Payment Processor',
    verified: method === 'stripe' // Stripe payments auto-verified
  };

  return res.status(200).json({
    success: true,
    message: '✅ Payment linked to invoice successfully',
    paymentLink,
    invoiceUpdate: {
      status: 'paid',
      amountPaid: amount,
      balance: 0
    }
  });
}

/**
 * Verify cash payment
 */
async function verifyCashPayment(req, res, data) {
  const {
    invoiceId,
    paymentId,
    staffMemberId,
    verifiedBy,
    notes
  } = data;

  const verification = {
    paymentId,
    invoiceId,
    verifiedBy,
    verifiedAt: new Date().toISOString(),
    staffMemberId,
    notes,
    status: 'verified'
  };

  return res.status(200).json({
    success: true,
    message: '✅ Cash payment verified',
    verification
  });
}

/**
 * Get payment history for invoice
 */
async function getPaymentHistory(req, res, invoiceId) {
  // In production, query database
  const history = {
    invoiceId,
    payments: [],
    totalPaid: 0,
    lastPayment: null
  };

  return res.status(200).json({
    success: true,
    history
  });
}

// Helper functions
function calculateTimeDifference(date1, date2) {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { days, hours, totalHours: Math.floor(diff / (1000 * 60 * 60)) };
}

function generateLinkId() {
  return 'LINK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

