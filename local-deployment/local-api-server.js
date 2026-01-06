/**
 * Local API Server for CogniCore Invoice System
 * Replaces cloud API calls with local Ollama LLM
 * 
 * Run: node local-api-server.js
 * Requires: npm install express cors
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.MODEL || 'llama3.1:8b';

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', model: MODEL, ollama: OLLAMA_URL });
});

// AI Chatbot endpoint (replaces Together AI)
app.post('/api/ai-chatbot', async (req, res) => {
    try {
        const { message, context, conversationHistory } = req.body;
        
        const systemPrompt = `You are an intelligent assistant for CogniCore Invoice System.
Help with: creating invoices, checking revenue, finding data, sending reminders.
${context ? `Current state: ${JSON.stringify(context)}` : ''}`;

        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...(conversationHistory || []),
                    { role: 'user', content: message }
                ],
                stream: false
            })
        });

        const data = await response.json();
        res.json({
            success: true,
            response: data.message?.content || 'No response',
            model: MODEL,
            provider: 'local-ollama'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// AI Insights endpoint
app.post('/api/ai-insights', async (req, res) => {
    try {
        const { invoices, customers, products, timeframe } = req.body;
        
        const prompt = `Analyze this business data and provide insights:
- Invoices: ${invoices?.length || 0} total
- Customers: ${customers?.length || 0} total  
- Products: ${products?.length || 0} total
- Timeframe: ${timeframe || 'all time'}

Provide: revenue trends, top customers, recommendations, cash flow analysis.`;

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: MODEL, prompt, stream: false })
        });

        const data = await response.json();
        res.json({
            success: true,
            insights: data.response,
            model: MODEL
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// AI Follow-up message generator
app.post('/api/ai-followup', async (req, res) => {
    try {
        const { customer, invoice, daysOverdue } = req.body;
        
        const prompt = `Generate a friendly but professional payment reminder:
Customer: ${customer?.name}
Invoice: ${invoice?.number}
Amount: R${invoice?.balance || invoice?.total}
Days overdue: ${daysOverdue || 0}

Keep it short, professional, South African business context.`;

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: MODEL, prompt, stream: false })
        });

        const data = await response.json();
        res.json({
            success: true,
            message: data.response,
            model: MODEL
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Product recommendations
app.post('/api/ai-recommendations', async (req, res) => {
    try {
        const { customerHistory, currentItems, allProducts } = req.body;
        
        const prompt = `Based on purchase history, recommend products:
Previous purchases: ${JSON.stringify(customerHistory?.slice(0, 5) || [])}
Currently in cart: ${JSON.stringify(currentItems || [])}
Available products: ${JSON.stringify(allProducts?.slice(0, 20) || [])}

Suggest 3-5 relevant products with brief reasons.`;

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: MODEL, prompt, stream: false })
        });

        const data = await response.json();
        res.json({
            success: true,
            recommendations: data.response,
            model: MODEL
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Local API Server running on http://localhost:${PORT}`);
    console.log(`📦 Using Ollama at ${OLLAMA_URL} with model ${MODEL}`);
    console.log(`\nEndpoints:`);
    console.log(`  POST /api/ai-chatbot`);
    console.log(`  POST /api/ai-insights`);
    console.log(`  POST /api/ai-followup`);
    console.log(`  POST /api/ai-recommendations`);
});

