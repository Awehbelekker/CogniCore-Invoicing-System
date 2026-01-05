// Vercel Serverless Function for AI Follow-ups
// FREE AI using Together AI (free tier: 60 requests/minute)
// No API costs!

export const config = {
  runtime: 'edge', // Fast edge runtime
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { customer, invoice, prompt, customerHistory, business } = await req.json();

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

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY || 'FREE_TIER'}`, // Free tier works without key!
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
        messages: [
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
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      // Fallback to template-based message if API fails
      return new Response(JSON.stringify({
        message: generateFallbackMessage(customer, invoice),
        source: 'template'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    return new Response(JSON.stringify({
      message,
      source: 'ai',
      model: 'Llama-3.1-8B'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Always return a fallback message
    try {
      const { customer, invoice } = await req.json();
      return new Response(JSON.stringify({
        message: generateFallbackMessage(customer, invoice),
        source: 'template',
        error: error.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(JSON.stringify({
        message: '🏄‍♂️ Howzit! Just a friendly reminder about your invoice. Please let us know if you need any help with payment. Thanks! 🌊',
        source: 'template'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

function generateFallbackMessage(customer, invoice) {
  return `🏄‍♂️ Howzit ${customer.name}! 

Just a friendly reminder about invoice ${invoice.number} for R${invoice.total}.

It's been ${invoice.daysOverdue || 0} days past the due date.

Can you help us out with payment? 🙏

Reply if you need any help or have questions!

Thanks boet! 🌊`;
}
