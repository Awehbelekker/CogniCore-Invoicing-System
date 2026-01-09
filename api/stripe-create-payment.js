/**
 * Stripe Payment Creation API
 * Creates payment link with 0.5% platform commission
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
      invoiceId,
      invoiceNumber,
      amount,
      currency = 'ZAR',
      customerName,
      customerEmail,
      businessId,
      businessStripeAccountId,
      description,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!invoiceId || !amount || !businessStripeAccountId) {
      return res.status(400).json({
        error: 'Missing required fields: invoiceId, amount, businessStripeAccountId'
      });
    }

    // Calculate commission (0.5% platform fee)
    const PLATFORM_COMMISSION_PERCENT = 0.5;
    const amountCents = Math.round(amount * 100);
    const platformCommissionCents = Math.round(amountCents * (PLATFORM_COMMISSION_PERCENT / 100));
    const businessReceivesCents = amountCents - platformCommissionCents;

    // Estimate Stripe fees (2.9% + R0.30 for South Africa)
    const stripeFeesCents = Math.round(amountCents * 0.029) + 30;
    const businessNetCents = businessReceivesCents - stripeFeesCents;

    // Create payment link with commission split
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoiceNumber || invoiceId}`,
              description: description || `Payment for invoice ${invoiceNumber || invoiceId}`,
              metadata: {
                invoiceId,
                businessId,
                customerName: customerName || 'Customer'
              }
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      // Platform commission (0.5%)
      application_fee_amount: platformCommissionCents,
      // Transfer remaining to business account
      on_behalf_of: businessStripeAccountId,
      transfer_data: {
        destination: businessStripeAccountId,
      },
      metadata: {
        invoiceId,
        invoiceNumber: invoiceNumber || '',
        businessId: businessId || '',
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        platformCommission: (platformCommissionCents / 100).toFixed(2),
        ...metadata
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.APP_URL || 'https://aweh-invoice-system.vercel.app'}/payment-success?invoice=${invoiceId}`,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect customer email if not provided
      ...(customerEmail ? {} : { customer_creation: 'always' }),
    });

    // Return payment details
    return res.status(200).json({
      success: true,
      paymentLinkUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
      breakdown: {
        total: amount,
        totalCents: amountCents,
        platformCommission: platformCommissionCents / 100,
        platformCommissionPercent: PLATFORM_COMMISSION_PERCENT,
        businessReceives: businessReceivesCents / 100,
        estimatedStripeFees: stripeFeesCents / 100,
        businessNet: businessNetCents / 100,
      },
      metadata: {
        invoiceId,
        invoiceNumber,
        businessId,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stripe payment creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment link',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

