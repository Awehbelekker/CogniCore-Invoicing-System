// OCR Stock Receipt API - Vercel Serverless Function
// Uses Together AI Vision to extract information from supplier invoices,
// customs declarations, delivery notes, shipping invoices, and payment proofs

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { image, scanType, fileName } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }
        
        // Use Together AI Vision API (free tier)
        const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
        
        if (!TOGETHER_API_KEY) {
            // Return mock/empty data if no API key configured
            return res.status(200).json({
                documentType: scanType || 'unknown',
                supplier: '',
                invoiceNumber: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                currency: 'ZAR',
                items: [],
                total: 0,
                message: 'AI not configured. Please enter data manually.'
            });
        }
        
        // Prepare the prompt based on scan type
        let systemPrompt = '';
        
        if (scanType === 'payment') {
            systemPrompt = `You are analyzing a Proof of Payment (POP) document. Extract:
- paymentAmount: The amount paid (number only)
- paymentDate: Date of payment (YYYY-MM-DD format)
- reference: Bank reference or transaction ID
- paymentMethod: EFT, card, cash, etc.

Return ONLY valid JSON with these fields.`;
        } else if (scanType === 'customs') {
            systemPrompt = `You are analyzing a Customs Declaration document. Extract:
- documentType: "customs"
- totalDuties: Total customs duties amount (number)
- importVAT: Import VAT amount (number)
- currency: Currency code (e.g., ZAR, USD)
- items: Array of items with HS codes if visible
- date: Document date (YYYY-MM-DD)

Return ONLY valid JSON with these fields.`;
        } else if (scanType === 'shipping') {
            systemPrompt = `You are analyzing a Shipping/Freight invoice. Extract:
- documentType: "shipping"
- supplier: Shipping company name
- invoiceNumber: Invoice or bill number
- shippingCost: Total shipping cost (number)
- currency: Currency code
- date: Invoice date (YYYY-MM-DD)

Return ONLY valid JSON with these fields.`;
        } else {
            // Default: supplier invoice or auto-detect
            systemPrompt = `You are analyzing a business document (likely a supplier invoice, delivery note, or price list). Extract ALL information you can find:

- documentType: "supplier-invoice", "delivery-note", "price-list", "customs", "shipping", or "unknown"
- supplier: Company/supplier name
- invoiceNumber: Invoice/document number
- date: Document date (YYYY-MM-DD format)
- dueDate: Payment due date if visible (YYYY-MM-DD)
- currency: Currency code (USD, EUR, GBP, ZAR, SEK, CNY, etc.)
- items: Array of line items, each with:
  - sku: Product code/SKU if visible
  - description: Product description
  - quantity: Quantity (number)
  - unitPrice: Unit price (number)
  - total: Line total (number)
- subtotal: Subtotal amount (number)
- vat: VAT/Tax amount (number)
- total: Total amount (number)

Return ONLY valid JSON with these fields. Use null for fields you cannot determine.`;
        }
        
        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this document${fileName ? ` (${fileName})` : ''} and extract all relevant information as JSON:`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: image
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Together AI error:', errorText);
            throw new Error('AI Vision API failed');
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        
        // Parse the JSON from the response
        let extracted;
        try {
            // Try to find JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extracted = JSON.parse(jsonMatch[0]);
            } else {
                extracted = JSON.parse(content);
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            extracted = {
                documentType: scanType || 'unknown',
                supplier: '',
                invoiceNumber: '',
                date: new Date().toISOString().split('T')[0],
                currency: 'ZAR',
                items: [],
                rawResponse: content
            };
        }
        
        // Ensure items array exists and has proper structure
        if (extracted.items && Array.isArray(extracted.items)) {
            extracted.items = extracted.items.map(item => ({
                sku: item.sku || item.code || item.productCode || '',
                description: item.description || item.name || item.product || '',
                quantity: parseFloat(item.quantity) || 1,
                unitPrice: parseFloat(item.unitPrice || item.price || item.unit_price) || 0,
                total: parseFloat(item.total || item.lineTotal || item.amount) || 0,
                matchedProduct: null
            }));
            
            // Calculate totals if not present
            extracted.items = extracted.items.map(item => ({
                ...item,
                total: item.total || (item.quantity * item.unitPrice)
            }));
        } else {
            extracted.items = [];
        }
        
        // Normalize currency
        if (extracted.currency) {
            extracted.currency = extracted.currency.toUpperCase().replace(/[^A-Z]/g, '');
            // Map common variations
            const currencyMap = {
                'R': 'ZAR', 'RAND': 'ZAR', 'RANDS': 'ZAR',
                '$': 'USD', 'DOLLAR': 'USD', 'DOLLARS': 'USD',
                '€': 'EUR', 'EURO': 'EUR', 'EUROS': 'EUR',
                '£': 'GBP', 'POUND': 'GBP', 'POUNDS': 'GBP',
                '¥': 'CNY', 'YUAN': 'CNY', 'RMB': 'CNY'
            };
            extracted.currency = currencyMap[extracted.currency] || extracted.currency;
        }
        
        return res.status(200).json(extracted);
        
    } catch (error) {
        console.error('OCR Stock Receipt error:', error);
        return res.status(500).json({ 
            error: 'Failed to process document',
            message: error.message,
            documentType: 'unknown',
            items: []
        });
    }
}
