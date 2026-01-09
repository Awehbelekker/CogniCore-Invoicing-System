/**
 * Stripe Connect Onboarding API
 * Creates Stripe Express account for businesses to receive payments
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
      businessId,
      businessName,
      email,
      country = 'ZA', // Default to South Africa
      businessType = 'company',
      returnUrl,
      refreshUrl
    } = req.body;

    // Validate required fields
    if (!businessId || !businessName || !email) {
      return res.status(400).json({
        error: 'Missing required fields: businessId, businessName, email'
      });
    }

    // Create Stripe Express Connected Account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessType,
      business_profile: {
        name: businessName,
        support_email: email,
        mcc: '5734', // Computer Software Stores (for SaaS/invoicing)
      },
      metadata: {
        businessId: businessId,
        platform: 'aweh-invoice-system',
        createdAt: new Date().toISOString()
      },
    });

    console.log('✅ Stripe account created:', account.id);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || `${process.env.APP_URL || 'https://aweh-invoice-system.vercel.app'}/settings?stripe_refresh=true`,
      return_url: returnUrl || `${process.env.APP_URL || 'https://aweh-invoice-system.vercel.app'}/settings?stripe_success=true`,
      type: 'account_onboarding',
    });

    console.log('✅ Onboarding link created:', accountLink.url);

    // Return account details and onboarding URL
    return res.status(200).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      accountStatus: {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      },
      metadata: {
        businessId,
        businessName,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stripe onboarding error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Stripe account',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

