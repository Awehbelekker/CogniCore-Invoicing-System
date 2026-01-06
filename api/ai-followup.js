// Vercel Serverless Function for AI Follow-ups
// Version 2.0 - With GLM Support & Multiple Free Providers
// FREE AI using OpenRouter GLM, Together AI, SiliconFlow
// No API costs with free tier!

export const config = {
  runtime: 'edge', // Fast edge runtime
};

// Provider configurations with fallback chain
const AI_PROVIDERS = {
  // OpenRouter - FREE GLM-4.5-Air (RECOMMENDED)
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'z-ai/glm-4.5-air:free',
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
      'HTTP-Referer': 'https://cognicore-invoice.app',
      'X-Title': 'CogniCore Invoice System'
    }),
    free: true,
    rateLimit: 20
  },
  // Together AI - FREE Llama
  together: {
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TOGETHER_API_KEY || 'FREE_TIER'}`
    }),
    free: true,
    rateLimit: 60
  },
  // SiliconFlow - FREE GLM-4-9B (Chinese provider)
  siliconflow: {
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'THUDM/glm-4-9b-chat',
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY || ''}`
    }),
    free: true,
    rateLimit: 30
  },
  // Novita AI - GLM support
  novita: {
    url: 'https://api.novita.ai/v3/openai/chat/completions',
    model: 'zai-org/glm-4.5-air',
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NOVITA_API_KEY || ''}`
    }),
    free: false
  },
  // Z.ai - Official GLM API
  zai: {
    url: 'https://api.z.ai/api/paas/v4/chat/completions',
    model: 'glm-4',
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZAI_API_KEY || ''}`
    }),
    free: false
  }
};

// Fallback order (free providers first)
const PROVIDER_ORDER = ['openrouter', 'together', 'siliconflow', 'novita', 'zai'];

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { customer, invoice, prompt, customerHistory, business, preferProvider } = await req.json();

    // Build customer context from history
    let customerContext = '';
    if (customerHistory) {
      const totalOrders = customerHistory.invoiceCount || 0;
      const totalSpent = customerHistory.totalSpent || 0;
      const paymentRate = customerHistory.paymentRate || 100;
      const tier = customerHistory.tier || 'retail';

      customerContext = `\n\nCustomer Profile:\n- ${tier.toUpperCase()} tier customer\n- ${totalOrders} previous orders\n- R${totalSpent.toLocaleString()} total spent\n- ${paymentRate}% on-time payment rate\n- ${paymentRate > 90 ? 'Excellent payment history! 🌟' : paymentRate > 70 ? 'Generally reliable payer' : 'Needs gentle encouragement'}`;
    }

    const businessName = business?.name || 'Aweh Be Lekker';
    const businessTone = business?.tone || 'friendly South African surfer vibe';

    const messages = [
      {
        role: 'system',
        content: `You are a payment reminder assistant for ${businessName}. Use a ${businessTone}. Be professional but warm. Keep messages concise and personalized based on customer history.`
      },
      {
        role: 'user',
        content: `Generate a payment reminder message:

Customer: ${customer.name}
Invoice: ${invoice.number}
Amount: R${invoice.total}
Due Date: ${invoice.dueDate}
Days Overdue: ${invoice.daysOverdue || 0}${customerContext}

Custom Instructions: ${prompt || 'Keep it friendly but firm. Acknowledge their history if they\'re a good customer.'}`
      }
    ];

    // Determine provider order (preferred first)
    const providerOrder = preferProvider && AI_PROVIDERS[preferProvider]
      ? [preferProvider, ...PROVIDER_ORDER.filter(p => p !== preferProvider)]
      : PROVIDER_ORDER;

    // Try providers in order until one succeeds
    let lastError = null;
    for (const providerName of providerOrder) {
      const provider = AI_PROVIDERS[providerName];
      if (!provider) continue;

      try {
        const result = await callProvider(provider, providerName, messages);
        if (result.success) {
          return new Response(JSON.stringify({
            message: result.content,
            source: 'ai',
            model: provider.model,
            provider: providerName
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        lastError = result.error;
      } catch (e) {
        lastError = e.message;
        console.log(`Provider ${providerName} failed:`, e.message);
      }
    }

    // All providers failed - use template
    console.error('All AI providers failed, using template. Last error:', lastError);
    return new Response(JSON.stringify({
      message: generateFallbackMessage(customer, invoice),
      source: 'template',
      fallbackReason: lastError
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI generation error:', error);

    // Always return a fallback message
    return new Response(JSON.stringify({
      message: '🏄‍♂️ Howzit! Just a friendly reminder about your invoice. Please let us know if you need any help with payment. Thanks! 🌊',
      source: 'template',
      error: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Call a specific AI provider
 */
async function callProvider(provider, providerName, messages) {
  const response = await fetch(provider.url, {
    method: 'POST',
    headers: provider.getHeaders(),
    body: JSON.stringify({
      model: provider.model,
      messages: messages,
      max_tokens: 200,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `${providerName}: ${response.status} - ${errorText}` };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return { success: false, error: `${providerName}: No content in response` };
  }

  return { success: true, content };
}

/**
 * Generate fallback template message
 */
function generateFallbackMessage(customer, invoice) {
  const name = customer?.name || 'Valued Customer';
  const invoiceNum = invoice?.number || 'your invoice';
  const total = invoice?.total || 'the amount';
  const daysOverdue = invoice?.daysOverdue || 0;

  return `🏄‍♂️ Howzit ${name}!

Just a friendly reminder about invoice ${invoiceNum} for R${total}.

${daysOverdue > 0 ? `It's been ${daysOverdue} days past the due date.` : 'Payment is due soon.'}

Can you help us out with payment? 🙏

Reply if you need any help or have questions!

Thanks boet! 🌊`;
}
