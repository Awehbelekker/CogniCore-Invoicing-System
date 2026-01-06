// Vercel Serverless Function for Claude AI Integration
// Uses Anthropic Claude API for premium AI features
// Supports follow-ups, insights, and recommendations

export const config = {
  runtime: 'edge',
};

// CORS headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, customer, invoice, context, message, customerHistory, business, apiKey } = body;

    // Get API key from request or environment
    const claudeApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!claudeApiKey) {
      return new Response(JSON.stringify({
        error: 'Claude API key not configured',
        message: 'Please add your Anthropic API key in Settings → AI Settings or set ANTHROPIC_API_KEY env variable',
        source: 'error'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Route to appropriate handler based on action
    let response;
    switch (action) {
      case 'followup':
        response = await generateFollowup(claudeApiKey, customer, invoice, customerHistory, business);
        break;
      case 'insights':
        response = await generateInsights(claudeApiKey, context);
        break;
      case 'recommendations':
        response = await generateRecommendations(claudeApiKey, customer, customerHistory, context);
        break;
      case 'chat':
        response = await handleChat(claudeApiKey, message, context);
        break;
      default:
        response = await handleChat(claudeApiKey, message || 'Hello', context);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Claude AI error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error',
      message: 'AI request failed. Check console for details.',
      stack: error.stack,
      source: 'error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Generate payment follow-up message
async function generateFollowup(apiKey, customer, invoice, customerHistory, business) {
  const businessName = business?.name || 'Aweh Be Lekker';
  const tone = business?.tone || 'friendly South African surfer vibe';
  
  let historyContext = '';
  if (customerHistory) {
    historyContext = `
Customer History:
- ${customerHistory.tier || 'retail'} tier customer
- ${customerHistory.invoiceCount || 0} previous orders
- R${(customerHistory.totalSpent || 0).toLocaleString()} total spent
- ${customerHistory.paymentRate || 100}% on-time payment rate`;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a payment reminder assistant for ${businessName}. Use a ${tone}. 
        
Generate a personalized, warm but professional payment reminder:

Customer: ${customer?.name || 'Valued Customer'}
Invoice: ${invoice?.number || 'N/A'}
Amount Due: R${invoice?.total || 0}
Due Date: ${invoice?.dueDate || 'N/A'}
Days Overdue: ${invoice?.daysOverdue || 0}
${historyContext}

Keep it concise (2-3 sentences). Be friendly but clear about payment expectation. Include a call to action.`
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    message: data.content[0].text,
    source: 'claude',
    model: 'claude-3-5-sonnet'
  };
}

// Generate business insights
async function generateInsights(apiKey, context) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyze this business data and provide 3-5 actionable insights:

Business Metrics:
- Total Revenue: R${context?.totalRevenue || 0}
- This Month Revenue: R${context?.monthRevenue || 0}
- Outstanding Invoices: R${context?.outstanding || 0}
- Total Customers: ${context?.customerCount || 0}
- Total Invoices: ${context?.invoiceCount || 0}
- Overdue Invoices: ${context?.overdueCount || 0}
- Top Products: ${context?.topProducts?.join(', ') || 'N/A'}
- Average Invoice Value: R${context?.avgInvoiceValue || 0}

Provide insights in this format:
1. [emoji] **Insight Title**: Brief explanation
2. [emoji] **Insight Title**: Brief explanation
etc.

Focus on: cash flow optimization, customer retention, growth opportunities, and risk areas.`
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    insights: data.content[0].text,
    source: 'claude',
    model: 'claude-3-5-sonnet'
  };
}

// Generate product recommendations
async function generateRecommendations(apiKey, customer, customerHistory, context) {
  const purchaseHistory = customerHistory?.recentPurchases?.join(', ') || 'No history';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You're a sales assistant for a water sports equipment company (Jetboards, eFoils, SUPs, accessories).

Customer: ${customer?.name || 'Customer'}
Previous Purchases: ${purchaseHistory}
Available Products: ${context?.products?.slice(0, 20).map(p => p.name).join(', ') || 'Various water sports equipment'}

Suggest 3 products they might want next, with brief reasons. Format:
1. **Product**: Reason (max 10 words)
2. **Product**: Reason
3. **Product**: Reason`
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    recommendations: data.content[0].text,
    source: 'claude',
    model: 'claude-3-5-sonnet'
  };
}

// Handle general chat
async function handleChat(apiKey, message, context) {
  const systemContext = context ? `
Current Business State:
- Total Invoices: ${context.invoiceCount || 0}
- Outstanding: R${context.outstanding || 0}
- Customers: ${context.customerCount || 0}
- Today's Revenue: R${context.todayRevenue || 0}
- Overdue: ${context.overdueCount || 0} invoices
` : '';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `You are an intelligent assistant for an invoice management system (Aweh Be Lekker Invoice System).
You help with: creating invoices, checking status, finding data, sending reminders, product recommendations, business insights.
${systemContext}
Be concise, helpful, and action-oriented. Use friendly South African surfer vibes.`,
      messages: [{
        role: 'user',
        content: message
      }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return {
    message: data.content[0].text,
    source: 'claude',
    model: 'claude-3-5-sonnet'
  };
}
