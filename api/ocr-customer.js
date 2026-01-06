/**
 * Hybrid OCR Customer/Business Card Scanning
 * Primary: HunyuanOCR (92%+ accuracy on cards)
 * Fallback: PaddleOCR (100+ languages) → LlamaVision
 *
 * Supports user-provided API keys (for Vercel deployment)
 * Users can bring their own keys - no server-side secrets required
 */

export const config = {
  runtime: 'edge',
};

// Customer/Contact extraction prompt
const CUSTOMER_EXTRACTION_PROMPT = `Extract contact information as JSON:
{
  "companyName": "Company/Business name",
  "contactPerson": "Person's full name",
  "title": "Job title/position",
  "phone": "Landline number",
  "mobile": "Mobile number",
  "email": "Email address",
  "address": "Street address",
  "city": "City",
  "postalCode": "Postal/ZIP code",
  "country": "Country",
  "website": "Website URL",
  "vat": "VAT/Tax number",
  "notes": "Other relevant info"
}

Use null for fields you cannot determine.`;

// Language detection patterns
const LANGUAGE_PATTERNS = {
  'zh': /[\u4e00-\u9fff]/,
  'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
  'ko': /[\uac00-\ud7af]/,
  'ar': /[\u0600-\u06ff]/,
  'ru': /[\u0400-\u04ff]/,
};

function detectLanguage(text) {
  if (!text) return 'en';
  for (const [code, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) return code;
  }
  return 'en';
}

/**
 * Try HunyuanOCR first (best for cards)
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
            { type: 'text', text: CUSTOMER_EXTRACTION_PROMPT }
          ]
        }],
        temperature: 0.1,
        max_tokens: 1000
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
 * Try PaddleOCR (for non-English cards)
 */
async function tryPaddleOCR(imageBase64, userUrl = null) {
  const paddleUrl = userUrl || process.env.PADDLE_OCR_URL;
  if (!paddleUrl) return null;

  try {
    const response = await fetch(`${paddleUrl}/ocr`, {
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
    const fullText = ocrResults.map(r => r.text).join('\n');
    const avgConfidence = ocrResults.reduce((s, r) => s + (r.confidence || 0.8), 0) / (ocrResults.length || 1);

    return {
      text: fullText,
      engine: 'paddle',
      accuracy: avgConfidence,
      language: detectLanguage(fullText)
    };
  } catch (error) {
    console.error('PaddleOCR error:', error.message);
    return null;
  }
}

/**
 * Fallback to Llama Vision
 */
async function tryLlamaVision(imageBase64, context, userApiKey = null) {
  const apiKey = userApiKey || process.env.TOGETHER_API_KEY;
  if (!apiKey || apiKey === 'FREE_TIER') return null;

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
          { role: 'system', content: CUSTOMER_EXTRACTION_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: context || 'Extract contact information from this image.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      engine: 'llama',
      accuracy: 0.65
    };
  } catch (error) {
    console.error('LlamaVision error:', error.message);
    return null;
  }
}

/**
 * Parse customer JSON from OCR text
 */
function parseCustomerJSON(text) {
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
 * Clean phone numbers
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

/**
 * Main Handler - Hybrid OCR for customer/business cards
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      image, imageUrl, context, forceEngine,
      // User-provided API keys
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
        error: 'No image provided'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const attempts = [];
    let result = null;

    // Engine order: HunyuanOCR first (92% accuracy on cards)
    const engineOrder = forceEngine
      ? [forceEngine]
      : ['hunyuan', 'paddle', 'llama'];

    for (const engine of engineOrder) {
      if (result) break;

      switch (engine) {
        case 'hunyuan':
          result = await tryHunyuanOCR(imageBase64, hunyuanUrl);
          attempts.push({ engine: 'HunyuanOCR', success: !!result });
          break;

        case 'paddle':
          result = await tryPaddleOCR(imageBase64, paddleUrl);
          attempts.push({ engine: 'PaddleOCR', success: !!result });
          break;

        case 'llama':
          result = await tryLlamaVision(imageBase64, context, userApiKey);
          attempts.push({ engine: 'LlamaVision', success: !!result });
          break;
      }
    }

    // If no OCR succeeded
    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All OCR engines failed',
        attempts,
        message: 'Unable to scan card. Please try again or enter data manually.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    // Parse customer data from result
    let customerData = parseCustomerJSON(result.text);

    if (!customerData) {
      return new Response(JSON.stringify({
        success: false,
        rawText: result.text,
        parseError: true,
        attempts,
        message: 'Could not parse customer data. Please review and enter manually.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    // Enrich and clean customer data
    customerData = {
      ...customerData,
      phone: cleanPhoneNumber(customerData.phone),
      mobile: cleanPhoneNumber(customerData.mobile),
      source: `ocr-${result.engine}`,
      createdDate: new Date().toISOString(),
      tier: 'retail'
    };

    // Calculate confidence
    const confidence = result.accuracy || 0.5;
    const confidenceLevel = confidence >= 0.85 ? 'high' : confidence >= 0.70 ? 'medium' : 'low';

    return new Response(JSON.stringify({
      success: true,
      customer: customerData,
      source: result.engine,
      accuracy: result.accuracy,
      confidence: confidenceLevel,
      language: result.language || 'en',
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
      message: 'OCR processing failed.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
