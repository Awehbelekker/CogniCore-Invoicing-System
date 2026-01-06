/**
 * Hybrid OCR Stock Receipt API
 * Primary: HunyuanOCR (92%+ accuracy for receipts/invoices)
 * Fallback: PaddleOCR → LlamaVision
 *
 * Supports: supplier invoices, customs declarations, delivery notes,
 * shipping invoices, payment proofs
 */

export const config = {
  runtime: 'edge',
};

// Document type specific prompts
const PROMPTS = {
  payment: `Extract Proof of Payment data as JSON:
{
  "documentType": "payment",
  "paymentAmount": 0,
  "paymentDate": "YYYY-MM-DD",
  "reference": "transaction ID",
  "paymentMethod": "EFT/card/cash",
  "currency": "ZAR"
}`,
  customs: `Extract Customs Declaration data as JSON:
{
  "documentType": "customs",
  "totalDuties": 0,
  "importVAT": 0,
  "currency": "ZAR",
  "items": [{"hsCode": "", "description": "", "value": 0}],
  "date": "YYYY-MM-DD"
}`,
  shipping: `Extract Shipping Invoice data as JSON:
{
  "documentType": "shipping",
  "supplier": "shipping company",
  "invoiceNumber": "",
  "shippingCost": 0,
  "currency": "ZAR",
  "date": "YYYY-MM-DD"
}`,
  default: `Extract document data as JSON:
{
  "documentType": "supplier-invoice/delivery-note/price-list/customs/shipping",
  "supplier": "company name",
  "invoiceNumber": "",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": "ZAR",
  "items": [{"sku": "", "description": "", "quantity": 0, "unitPrice": 0, "total": 0}],
  "subtotal": 0,
  "vat": 0,
  "total": 0
}`
};

// Currency normalization map
const CURRENCY_MAP = {
  'R': 'ZAR', 'RAND': 'ZAR', 'RANDS': 'ZAR',
  '$': 'USD', 'DOLLAR': 'USD', 'DOLLARS': 'USD',
  '€': 'EUR', 'EURO': 'EUR', 'EUROS': 'EUR',
  '£': 'GBP', 'POUND': 'GBP', 'POUNDS': 'GBP',
  '¥': 'CNY', 'YUAN': 'CNY', 'RMB': 'CNY',
  'SEK': 'SEK', 'NOK': 'NOK', 'DKK': 'DKK'
};

/**
 * Try HunyuanOCR (best for receipts/invoices)
 */
async function tryHunyuanOCR(imageBase64, prompt) {
  const hunyuanUrl = process.env.HUNYUAN_OCR_URL;
  if (!hunyuanUrl) return null;

  try {
    const response = await fetch(`${hunyuanUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tencent/HunyuanOCR',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` }},
            { type: 'text', text: prompt }
          ]
        }],
        temperature: 0.1,
        max_tokens: 2500
      })
    });

    if (!response.ok) return null;

    const result = await response.json();
    return {
      text: result.choices[0].message.content,
      engine: 'hunyuan',
      accuracy: 0.92
    };
  } catch (error) {
    console.error('HunyuanOCR error:', error.message);
    return null;
  }
}

/**
 * Try PaddleOCR with structure mode
 */
async function tryPaddleOCR(imageBase64) {
  const paddleUrl = process.env.PADDLE_OCR_URL;
  if (!paddleUrl) return null;

  try {
    // Clean image data if it has data URL prefix
    const cleanImage = imageBase64.startsWith('data:')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const response = await fetch(`${paddleUrl}/structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: cleanImage,
        fileType: 1
      })
    });

    if (!response.ok) return null;

    const result = await response.json();
    const ocrResults = result.result?.ocrResults || [];
    const avgConfidence = ocrResults.reduce((s, r) => s + (r.confidence || 0.8), 0) / (ocrResults.length || 1);

    return {
      text: ocrResults.map(r => r.text).join('\n'),
      structuredData: result.result,
      engine: 'paddle',
      accuracy: avgConfidence
    };
  } catch (error) {
    console.error('PaddleOCR error:', error.message);
    return null;
  }
}

/**
 * Fallback to Llama Vision
 */
async function tryLlamaVision(imageBase64, prompt, fileName) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Analyze this document${fileName ? ` (${fileName})` : ''} and extract data as JSON:` },
              { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` }}
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      engine: 'llama',
      accuracy: 0.65
    };
  } catch (error) {
    console.error('LlamaVision error:', error.message);
    return null;
  }
}

/**
 * Parse JSON from OCR text
 */
function parseDocumentJSON(text) {
  if (!text) return null;

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                     text.match(/```\n([\s\S]*?)\n```/) ||
                     text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {
    console.error('JSON parse error:', e.message);
  }

  return null;
}

/**
 * Normalize currency code
 */
function normalizeCurrency(currency) {
  if (!currency) return 'ZAR';
  const upper = currency.toUpperCase().replace(/[^A-Z]/g, '');
  return CURRENCY_MAP[upper] || upper || 'ZAR';
}

/**
 * Normalize items array
 */
function normalizeItems(items) {
  if (!items || !Array.isArray(items)) return [];

  return items.map(item => ({
    sku: item.sku || item.code || item.productCode || '',
    description: item.description || item.name || item.product || '',
    quantity: parseFloat(item.quantity) || 1,
    unitPrice: parseFloat(item.unitPrice || item.price || item.unit_price) || 0,
    total: parseFloat(item.total || item.lineTotal || item.amount) || 0,
    matchedProduct: null
  })).map(item => ({
    ...item,
    total: item.total || (item.quantity * item.unitPrice)
  }));
}

/**
 * Main Handler - Hybrid OCR for stock receipts
 */
export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { image, scanType, fileName, forceEngine } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({
        error: 'Image data is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    // Get the appropriate prompt
    const prompt = PROMPTS[scanType] || PROMPTS.default;

    const attempts = [];
    let result = null;

    // Engine order: HunyuanOCR first (92% accuracy on receipts)
    const engineOrder = forceEngine
      ? [forceEngine]
      : ['hunyuan', 'paddle', 'llama'];

    for (const engine of engineOrder) {
      if (result) break;

      switch (engine) {
        case 'hunyuan':
          result = await tryHunyuanOCR(image, prompt);
          attempts.push({ engine: 'HunyuanOCR', success: !!result });
          break;

        case 'paddle':
          result = await tryPaddleOCR(image);
          attempts.push({ engine: 'PaddleOCR', success: !!result });
          break;

        case 'llama':
          result = await tryLlamaVision(image, prompt, fileName);
          attempts.push({ engine: 'LlamaVision', success: !!result });
          break;
      }
    }

    // If no OCR succeeded
    if (!result) {
      return new Response(JSON.stringify({
        documentType: scanType || 'unknown',
        supplier: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'ZAR',
        items: [],
        error: 'All OCR engines failed',
        attempts,
        message: 'AI not available. Please enter data manually.'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Parse the result
    let extracted = parseDocumentJSON(result.text);

    if (!extracted) {
      extracted = {
        documentType: scanType || 'unknown',
        supplier: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'ZAR',
        items: [],
        rawResponse: result.text
      };
    }

    // Normalize the extracted data
    extracted.items = normalizeItems(extracted.items);
    extracted.currency = normalizeCurrency(extracted.currency);

    // Add OCR metadata
    extracted.ocrEngine = result.engine;
    extracted.ocrAccuracy = result.accuracy;
    extracted.attempts = attempts;

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('OCR Stock Receipt error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process document',
      message: error.message,
      documentType: 'unknown',
      items: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
