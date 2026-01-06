/**
 * Hybrid OCR Price List Scanning
 * Primary: PaddleOCR (100+ languages, excellent table parsing)
 * Fallback: HunyuanOCR → LlamaVision
 *
 * Supports user-provided API keys (for Vercel deployment)
 * Users can bring their own keys - no server-side secrets required
 */

export const config = {
  runtime: 'edge',
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
  'zh': /[\u4e00-\u9fff]/,           // Chinese
  'ja': /[\u3040-\u309f\u30a0-\u30ff]/, // Japanese
  'ko': /[\uac00-\ud7af]/,           // Korean
  'ar': /[\u0600-\u06ff]/,           // Arabic
  'he': /[\u0590-\u05ff]/,           // Hebrew
  'th': /[\u0e00-\u0e7f]/,           // Thai
  'ru': /[\u0400-\u04ff]/,           // Russian
  'hi': /[\u0900-\u097f]/,           // Hindi
};

// Price list extraction prompt
const PRICELIST_PROMPT = `Extract ALL products from this price list as JSON array:
[
  {
    "sku": "product code or SKU",
    "name": "Product Name",
    "category": "Category if visible",
    "price": 0,
    "currency": "ZAR",
    "unit": "each/pack/kg/etc",
    "notes": "bulk discount, min order, etc"
  }
]

Be thorough - extract EVERY product. Use null for unknown fields.`;

/**
 * Detect language from text
 */
function detectLanguage(text) {
  if (!text) return { code: 'en', confidence: 0.5, name: 'English' };

  const langNames = {
    'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean',
    'ar': 'Arabic', 'he': 'Hebrew', 'th': 'Thai',
    'ru': 'Russian', 'hi': 'Hindi'
  };

  for (const [code, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 3) {
      return {
        code,
        confidence: Math.min(matches.length / text.length * 10, 0.95),
        name: langNames[code]
      };
    }
  }

  return { code: 'en', confidence: 0.8, name: 'English' };
}

/**
 * Try PaddleOCR first (best for multilingual + tables)
 */
async function tryPaddleOCR(imageBase64, options = {}, userUrl = null) {
  const paddleUrl = userUrl || process.env.PADDLE_OCR_URL;
  if (!paddleUrl) return null;

  try {
    // Use structure pipeline for tables in price lists
    const pipeline = options.useStructure ? 'structure' : 'ocr';

    const response = await fetch(`${paddleUrl}/${pipeline}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: imageBase64,
        fileType: 1,
        lang: options.lang || 'auto' // Auto-detect language
      })
    });

    if (!response.ok) return null;

    const result = await response.json();
    const ocrResults = result.result?.ocrResults || [];

    // Calculate average confidence
    const avgConfidence = ocrResults.length > 0
      ? ocrResults.reduce((sum, r) => sum + (r.confidence || 0.8), 0) / ocrResults.length
      : 0.80;

    // Detect language from extracted text
    const fullText = ocrResults.map(r => r.text).join('\n');
    const language = detectLanguage(fullText);

    return {
      text: fullText,
      results: ocrResults,
      structuredData: result.result,
      engine: 'paddle',
      accuracy: avgConfidence,
      pipeline,
      language
    };
  } catch (error) {
    console.error('PaddleOCR error:', error.message);
    return null;
  }
}

/**
 * Try HunyuanOCR (good for tables)
 */
async function tryHunyuanOCR(imageBase64, supplier, userUrl = null) {
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
            { type: 'text', text: `${supplier ? `This is a ${supplier} price list. ` : ''}${PRICELIST_PROMPT}` }
          ]
        }],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) return null;

    const result = await response.json();
    const text = result.choices[0].message.content;
    const language = detectLanguage(text);

    return {
      text,
      engine: 'hunyuan',
      accuracy: 0.88,
      model: 'tencent/HunyuanOCR',
      language
    };
  } catch (error) {
    console.error('HunyuanOCR error:', error.message);
    return null;
  }
}

/**
 * Fallback to Llama Vision (Together AI - FREE)
 */
async function tryLlamaVision(imageBase64, supplier, context, userApiKey = null) {
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
          { role: 'system', content: PRICELIST_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Extract all products from this ${supplier ? supplier + ' ' : ''}price list. ${context || ''}` },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
            ]
          }
        ],
        max_tokens: 2500,
        temperature: 0.1
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    const language = detectLanguage(text);

    return {
      text,
      engine: 'llama',
      accuracy: 0.65,
      model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
      language
    };
  } catch (error) {
    console.error('LlamaVision error:', error.message);
    return null;
  }
}

/**
 * Parse products JSON from OCR text
 */
function parseProductsJSON(text) {
  if (!text) return [];

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                     text.match(/```\n([\s\S]*?)\n```/) ||
                     text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    console.error('JSON parse error:', e.message);
  }

  return [];
}

/**
 * Main Handler - Hybrid OCR with language detection
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      image, imageUrl, supplier, context, forceEngine,
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

    // Engine order: PaddleOCR first for multilingual, then HunyuanOCR, then Llama
    const engineOrder = forceEngine
      ? [forceEngine]
      : ['paddle', 'hunyuan', 'llama'];

    for (const engine of engineOrder) {
      if (result) break;

      switch (engine) {
        case 'paddle':
          result = await tryPaddleOCR(imageBase64, { useStructure: true }, paddleUrl);
          attempts.push({ engine: 'PaddleOCR', success: !!result });
          break;

        case 'hunyuan':
          result = await tryHunyuanOCR(imageBase64, supplier, hunyuanUrl);
          attempts.push({ engine: 'HunyuanOCR', success: !!result });
          break;

        case 'llama':
          result = await tryLlamaVision(imageBase64, supplier, context, userApiKey);
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
        message: 'Unable to scan price list. Please try again or enter data manually.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    // Parse products from result
    let products = [];
    if (result.structuredData && Array.isArray(result.structuredData.tables)) {
      // PaddleOCR structure mode returns tables
      products = result.structuredData.tables.flatMap(t => t.rows || []);
    } else {
      products = parseProductsJSON(result.text);
    }

    // Enrich products with metadata
    const enrichedProducts = products.map(p => ({
      sku: p.sku || p.code || p.productCode || '',
      name: p.name || p.description || p.product || '',
      category: p.category || '',
      price: parseFloat(p.price) || 0,
      currency: p.currency || 'ZAR',
      unit: p.unit || 'each',
      notes: p.notes || '',
      supplier: supplier || 'Unknown',
      importDate: new Date().toISOString(),
      source: `ocr-${result.engine}`
    }));

    // Calculate confidence
    const confidence = result.accuracy || 0.5;
    const confidenceLevel = confidence >= 0.85 ? 'high' : confidence >= 0.70 ? 'medium' : 'low';

    return new Response(JSON.stringify({
      success: true,
      products: enrichedProducts,
      count: enrichedProducts.length,
      source: result.engine,
      model: result.model || result.pipeline,
      accuracy: result.accuracy,
      confidence: confidenceLevel,
      language: result.language,
      attempts,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
