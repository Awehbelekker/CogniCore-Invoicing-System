/**
 * Stripe Webhook Handler
 * Handles payment confirmations and automatically updates invoice status
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Raw body parser for webhook signature verification
const getRawBody = (req) => {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
  });
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    res.status(200).json({ received: true, eventType: event.type });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle successful checkout
async function handleCheckoutCompleted(session) {
  console.log('✅ Checkout completed:', session.id);
  
  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId) {
    console.warn('No invoiceId in session metadata');
    return;
  }

  // Trigger AI to update invoice status
  await notifyAIPaymentReceived({
    invoiceId,
    paymentId: session.payment_intent,
    amount: session.amount_total / 100,
    currency: session.currency,
    customerEmail: session.customer_email,
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentMethod: 'stripe',
    metadata: session.metadata
  });
}

// Handle successful payment intent
async function handlePaymentSucceeded(paymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);
  
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) {
    console.warn('No invoiceId in payment intent metadata');
    return;
  }

  await notifyAIPaymentReceived({
    invoiceId,
    paymentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentMethod: 'stripe',
    metadata: paymentIntent.metadata
  });
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);
  
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (invoiceId) {
    await notifyAIPaymentFailed({
      invoiceId,
      paymentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
      failedAt: new Date().toISOString()
    });
  }
}

// Handle successful charge
async function handleChargeSucceeded(charge) {
  console.log('✅ Charge succeeded:', charge.id);
  // Additional charge tracking if needed
}

// Handle refund
async function handleChargeRefunded(charge) {
  console.log('🔄 Charge refunded:', charge.id);
  // Handle refund logic
}

// Notify AI system about payment (this would integrate with your AI endpoints)
async function notifyAIPaymentReceived(paymentData) {
  console.log('🤖 AI Payment Notification:', paymentData);
  
  // TODO: Call your AI endpoint to process payment
  // This will be implemented in the AI payment management module
  // For now, we'll store it in a queue that the frontend can poll
  
  // Store payment notification for frontend to process
  // (In production, this would be a database or message queue)
}

async function notifyAIPaymentFailed(failureData) {
  console.log('🤖 AI Payment Failure Notification:', failureData);
  // Handle payment failure notification
}

