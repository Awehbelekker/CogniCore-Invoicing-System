// Vercel Serverless Function for Google Gemini AI Integration
// Uses Gemini API for AI features (chat, insights, recommendations)
// Supports Gemini Pro, Gemini 1.5 Flash, Gemini 1.5 Pro

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, message, context, customer, invoice, customerHistory, business, apiKey, model } = body;

    // Get API key from request or environment
    const geminiApiKey = apiKey || process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        error: 'Gemini API key not configured',
        message: 'Please add your Google AI API key in Settings or set GEMINI_API_KEY env variable',
        source: 'error'
      }), { status: 400, headers: corsHeaders });
    }

    const selectedModel = model || 'gemini-1.5-flash';
    
    let response;
    switch (action) {
      case 'followup':
        response = await generateFollowup(geminiApiKey, selectedModel, customer, invoice, customerHistory, business);
        break;
      case 'insights':
        response = await generateInsights(geminiApiKey, selectedModel, context);
        break;
      case 'recommendations':
        response = await generateRecommendations(geminiApiKey, selectedModel, customer, customerHistory, context);
        break;
      case 'chat':
      default:
        response = await handleChat(geminiApiKey, selectedModel, message || 'Hello', context);
    }

    return new Response(JSON.stringify(response), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Gemini AI error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error',
      message: 'Gemini AI request failed.',
      source: 'error'
    }), { status: 500, headers: corsHeaders });
  }
}

// Gemini API call helper
async function callGemini(apiKey, model, prompt, systemPrompt = '') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const contents = systemPrompt 
    ? [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }]
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

async function generateFollowup(apiKey, model, customer, invoice, customerHistory, business) {
  const prompt = `Generate a payment reminder for:
Customer: ${customer?.name || 'Customer'}
Invoice: ${invoice?.number}, Amount: R${invoice?.total || 0}
Due: ${invoice?.dueDate}, Overdue: ${invoice?.daysOverdue || 0} days
Business: ${business?.name || 'Our Company'}

Keep it professional, friendly, 2-3 sentences with clear call to action.`;

  const text = await callGemini(apiKey, model, prompt);
  return { message: text, source: 'gemini', model };
}

async function generateInsights(apiKey, model, context) {
  const prompt = `Analyze business data and provide 3-5 actionable insights:
Revenue: R${context?.totalRevenue || 0}, Outstanding: R${context?.outstanding || 0}
Customers: ${context?.customerCount || 0}, Invoices: ${context?.invoiceCount || 0}
Overdue: ${context?.overdueCount || 0}

Format: [emoji] **Title**: Brief explanation`;

  const text = await callGemini(apiKey, model, prompt);
  return { insights: text, source: 'gemini', model };
}

async function generateRecommendations(apiKey, model, customer, customerHistory, context) {
  const prompt = `Suggest 3 products for ${customer?.name || 'Customer'} based on:
Previous: ${customerHistory?.recentPurchases?.join(', ') || 'None'}
Available: ${context?.products?.slice(0, 15).map(p => p.name).join(', ') || 'Various products'}

Format: 1. **Product**: Reason (10 words max)`;

  const text = await callGemini(apiKey, model, prompt);
  return { recommendations: text, source: 'gemini', model };
}

async function handleChat(apiKey, model, message, context) {
  const systemPrompt = `You are an AI assistant for CogniCore Invoice System.
Help with: invoices, revenue, customers, payments, products.
Current state: ${context?.invoiceCount || 0} invoices, R${context?.outstanding || 0} outstanding.
Be concise and action-oriented.`;

  const text = await callGemini(apiKey, model, message, systemPrompt);
  return { message: text, source: 'gemini', model };
}

