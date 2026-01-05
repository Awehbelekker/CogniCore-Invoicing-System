// Vercel Serverless Function for AI Chatbot Assistant
// Natural language helper for invoice system
// Uses Together AI (FREE) - Llama 3.1 70B for complex reasoning

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, context, conversationHistory } = await req.json();
    
    // Build system context from current state
    const systemContext = context ? `
Current System State:
- Total Invoices: ${context.invoiceCount || 0}
- Outstanding Amount: R${context.outstandingAmount?.toLocaleString() || 0}
- Total Customers: ${context.customerCount || 0}
- Today's Revenue: R${context.todayRevenue?.toLocaleString() || 0}
- Overdue Invoices: ${context.overdueCount || 0}
` : '';

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY || 'FREE_TIER'}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo', // More capable for complex queries
        messages: [
          {
            role: 'system',
            content: `You are an intelligent assistant for an invoice management system (Aweh Be Lekker Invoice System).

You can help with:
1. **Creating invoices**: "Create invoice for Beach Bums" → Guide user through process
2. **Checking status**: "What's my revenue this month?" → Analyze and report
3. **Finding data**: "Show me all overdue invoices" → Search and display
4. **Sending reminders**: "Send follow-ups to overdue customers" → Initiate action
5. **Product recommendations**: "What should I suggest to this customer?" → Analyze history
6. **Business insights**: "How's my cash flow?" → Analyze trends
7. **Customer queries**: "Who's my top customer?" → Rank and report
8. **General help**: "How do I scan a price list?" → Provide instructions

${systemContext}

Be conversational, helpful, and action-oriented. When user wants to do something:
1. Confirm what they want
2. Suggest the action in JSON format
3. Provide friendly explanation

Return responses in this format:
{
  "message": "Your conversational response here",
  "action": "create_invoice|send_followup|show_invoices|analyze_data|scan_document|null",
  "actionData": { "any": "relevant data" },
  "suggestions": ["Quick action 1", "Quick action 2"]
}`
          },
          // Add conversation history for context
          ...(conversationHistory || []),
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      // Fallback to simple pattern matching
      return new Response(JSON.stringify({
        message: generateFallbackResponse(message, context),
        action: null,
        source: 'fallback'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // Try to parse JSON response
    let parsedResponse = null;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (e) {
      // If not JSON, return as plain message
      parsedResponse = {
        message: aiResponse,
        action: null,
        suggestions: []
      };
    }

    return new Response(JSON.stringify({
      ...parsedResponse,
      source: 'llama-70b',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      message: "Sorry, I'm having trouble right now. Please try again!",
      error: error.message,
      action: null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Fallback response generator (when AI unavailable)
function generateFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  
  // Pattern matching for common queries
  if (lowerMessage.includes('create') && lowerMessage.includes('invoice')) {
    return "Let's create an invoice! Click the 'Create Invoice' button at the top, select a customer, add products, and save. Need help with a specific step?";
  }
  
  if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
    const revenue = context?.todayRevenue || 0;
    return `Today's revenue is R${revenue.toLocaleString()}. Check the dashboard for detailed analytics!`;
  }
  
  if (lowerMessage.includes('overdue') || lowerMessage.includes('follow')) {
    const overdue = context?.overdueCount || 0;
    return `You have ${overdue} overdue invoices. Go to AI Insights and click 'Send Follow-ups' to send automated reminders!`;
  }
  
  if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
    return "You can view all customers in the Customers tab. Click on any customer to see their history, edit details, or create a new invoice for them.";
  }
  
  if (lowerMessage.includes('scan') || lowerMessage.includes('ocr')) {
    return "You can scan:\n• Supplier invoices (Suppliers tab → Scan Invoice)\n• Price lists (Suppliers tab → Scan Price List)\n• Business cards (Customers tab → Scan Card)\n\nJust take a photo and the AI will extract the data!";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I can help you with:\n• Creating invoices\n• Checking revenue and analytics\n• Sending payment reminders\n• Scanning documents\n• Finding customers or products\n\nWhat do you need help with?";
  }
  
  return "I'm here to help! Ask me about creating invoices, checking revenue, sending reminders, scanning documents, or anything else about your invoice system.";
}
