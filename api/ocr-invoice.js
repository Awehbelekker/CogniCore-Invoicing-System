/**
 * Hybrid OCR Invoice Scanning
 * Primary: HunyuanOCR (92%+ accuracy on invoices/receipts)
 * Fallback: PaddleOCR → LlamaVision
 *
 * Supports user-provided API keys (for Vercel deployment)
 * Users can bring their own keys - no server-side secrets required
 */

export const config = {
  runtime: 'edge',
};

// Invoice extraction prompt for structured JSON output
const INVOICE_EXTRACTION_PROMPT = `Extract invoice data as JSON with this exact structure:
{
  "supplier": {"name": "", "contact": "", "vat": "", "address": ""},
  "invoiceNumber": "",
  "invoiceDate": "YYYY-MM-DD",
  "items": [{"description": "", "quantity": 0, "unitPrice": 0, "total": 0, "sku": ""}],
  "subtotal": 0,
  "vat": 0,
  "vatRate": 0,
  "total": 0,
  "dueDate": "YYYY-MM-DD",
  "paymentTerms": "",
  "currency": "ZAR"
}

Extract ALL line items. Use null for fields you cannot determine.`;

/**
 * Try HunyuanOCR first (highest accuracy for invoices)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} userUrl - User-provided OCR server URL (optional)
 */
async function tryHunyuanOCR(imageBase64, userUrl = null) {
  const hunyuanUrl = userUrl || process.env.HUNYUAN_OCR_URL;
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
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }},
            { type: 'text', text: INVOICE_EXTRACTION_PROMPT }
          ]
        }],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) return null;

    const result = await response.json();
    return {
      text: result.choices[0].message.content,
      engine: 'hunyuan',
      accuracy: 0.92,
      model: 'tencent/HunyuanOCR'
    };
  } catch (error) {
    console.error('HunyuanOCR error:', error.message);
    return null;
  }
}

/**
 * Try PaddleOCR (good for multilingual, structure)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} userUrl - User-provided OCR server URL (optional)
 */
async function tryPaddleOCR(imageBase64, userUrl = null) {
  const paddleUrl = userUrl || process.env.PADDLE_OCR_URL;
  if (!paddleUrl) return null;

  try {
    // Use structure pipeline for invoices
    const response = await fetch(`${paddleUrl}/structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: imageBase64,
        fileType: 1
      })
    });

    if (!response.ok) return null;

    const result = await response.json();
    const ocrResults = result.result?.ocrResults || [];
    const avgConfidence = ocrResults.length > 0
      ? ocrResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / ocrResults.length
      : 0.80;

    return {
      text: ocrResults.map(r => r.text).join('\n'),
      structuredData: result.result,
      engine: 'paddle',
      accuracy: avgConfidence,
      pipeline: 'structure'
    };
  } catch (error) {
    console.error('PaddleOCR error:', error.message);
    return null;
  }
}

/**
 * Fallback to Llama Vision (Together AI - FREE)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} context - Context for OCR
 * @param {string} userApiKey - User-provided API key (optional)
 */
async function tryLlamaVision(imageBase64, context, userApiKey = null) {
  const apiKey = userApiKey || process.env.TOGETHER_API_KEY;
  if (!apiKey || apiKey === 'FREE_TIER') {
    return null;
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: `You are an OCR assistant that extracts structured data from invoices. ${INVOICE_EXTRACTION_PROMPT}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: context || 'Extract all invoice data from this image.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      engine: 'llama',
      accuracy: 0.65,
      model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo'
    };
  } catch (error) {
    console.error('LlamaVision error:', error.message);
    return null;
  }
}

/**
 * Parse JSON from OCR text response
 */
function parseInvoiceJSON(text) {
  if (!text) return null;

  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                     text.match(/```\n([\s\S]*?)\n```/) ||
                     text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {
    // Return raw text if parsing fails
    return { rawText: text, parseError: true };
  }

  return { rawText: text, parseError: true };
}

/**
 * Main Handler - Hybrid OCR with automatic fallback
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      image, imageUrl, context, forceEngine,
      // User-provided API keys (from client-side settings)
      userApiKey, hunyuanUrl, paddleUrl
    } = await req.json();

    // Get image as base64
    let imageBase64 = image;
    if (!imageBase64 && imageUrl && imageUrl.startsWith('data:')) {
      imageBase64 = imageUrl.split(',')[1];
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image provided',
        message: 'Please provide an image to scan.'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const attempts = [];
    let result = null;
    let invoiceData = null;

    // Engine selection order based on forceEngine or default priority
    const engineOrder = forceEngine
      ? [forceEngine]
      : ['hunyuan', 'paddle', 'llama'];

    for (const engine of engineOrder) {
      if (result) break;

      switch (engine) {
        case 'hunyuan':
          result = await tryHunyuanOCR(imageBase64, hunyuanUrl);
          if (result) {
            attempts.push({ engine: 'HunyuanOCR', success: true });
          } else {
            attempts.push({ engine: 'HunyuanOCR', success: false, reason: 'unavailable or failed' });
          }
          break;

        case 'paddle':
          result = await tryPaddleOCR(imageBase64, paddleUrl);
          if (result) {
            attempts.push({ engine: 'PaddleOCR', success: true });
          } else {
            attempts.push({ engine: 'PaddleOCR', success: false, reason: 'unavailable or failed' });
          }
          break;

        case 'llama':
          result = await tryLlamaVision(imageBase64, context, userApiKey);
          if (result) {
            attempts.push({ engine: 'LlamaVision', success: true });
          } else {
            attempts.push({ engine: 'LlamaVision', success: false, reason: 'unavailable or failed' });
          }
          break;
      }
    }

    // If no OCR succeeded, return error
    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All OCR engines failed',
        attempts,
        message: 'Unable to scan invoice. Please try again or enter data manually.',
        engineStatus: {
          hunyuan: !!process.env.HUNYUAN_OCR_URL,
          paddle: !!process.env.PADDLE_OCR_URL,
          llama: !!process.env.TOGETHER_API_KEY
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    // Parse the result
    if (result.structuredData) {
      // PaddleOCR already returns structured data
      invoiceData = result.structuredData;
    } else {
      // Parse JSON from text response
      invoiceData = parseInvoiceJSON(result.text);
    }

    // Calculate confidence score
    const confidence = result.accuracy || 0.5;
    const confidenceLevel = confidence >= 0.85 ? 'high' : confidence >= 0.70 ? 'medium' : 'low';

    return new Response(JSON.stringify({
      success: true,
      data: invoiceData,
      source: result.engine,
      model: result.model || result.pipeline,
      accuracy: result.accuracy,
      confidence: confidenceLevel,
      attempts,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'OCR processing failed. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
