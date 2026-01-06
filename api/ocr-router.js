/**
 * Hybrid OCR Router Service
 * Intelligently routes OCR requests to the best engine based on document type and language
 * 
 * Engines:
 * - HunyuanOCR: Best for invoices/receipts (92%+ accuracy), English/Chinese
 * - PaddleOCR: Best for multilingual documents (100+ languages)
 * - LlamaVision: Fallback when primary engines unavailable
 */

export const config = {
  runtime: 'edge',
};

/**
 * API Handler - Route OCR requests to the best engine
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { image, imageUrl, documentType, language, forceEngine, prompt } = await req.json();

    // Get image data
    let imageBase64 = image;
    if (!imageBase64 && imageUrl) {
      // Fetch image from URL if not base64
      const imgResponse = await fetch(imageUrl);
      const imgBuffer = await imgResponse.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image provided'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    // Determine the best engine
    const selectedEngine = selectEngine(documentType || 'general', language || 'en', forceEngine);

    // Call OCR with automatic fallback
    const result = await callOCR(imageBase64, documentType || 'general', prompt || 'Extract all text from this image', {
      language,
      forceEngine
    });

    return new Response(JSON.stringify({
      success: true,
      ...result,
      selectedEngine: selectedEngine.name,
      engineConfig: getEngineStatus()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      engineConfig: getEngineStatus()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// OCR Engine Configuration
const OCR_ENGINES = {
  HUNYUAN: {
    name: 'HunyuanOCR',
    accuracy: 0.92,
    bestFor: ['invoice', 'receipt', 'card', 'table', 'formula'],
    languages: ['en', 'zh', 'zh-CN', 'zh-TW'],
    url: process.env.HUNYUAN_OCR_URL || 'http://localhost:8118',
    model: 'tencent/HunyuanOCR',
    available: false
  },
  PADDLE: {
    name: 'PaddleOCR',
    accuracy: 0.80,
    bestFor: ['multilingual', 'pricelist', 'general', 'structure'],
    languages: ['*'], // 100+ languages
    url: process.env.PADDLE_OCR_URL || 'http://localhost:8080',
    available: false
  },
  LLAMA: {
    name: 'LlamaVision',
    accuracy: 0.65,
    bestFor: ['fallback'],
    languages: ['en'],
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    available: true // Always available via Together AI
  }
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

/**
 * Detect primary language from text sample
 */
export function detectLanguage(text) {
  if (!text) return { code: 'en', confidence: 0.5 };
  
  for (const [code, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 5) {
      return { 
        code, 
        confidence: Math.min(matches.length / text.length * 10, 0.95) 
      };
    }
  }
  
  return { code: 'en', confidence: 0.8 };
}

/**
 * Select best OCR engine based on document type and language
 */
export function selectEngine(documentType, language = 'en', forceEngine = null) {
  // Allow forcing a specific engine
  if (forceEngine && OCR_ENGINES[forceEngine.toUpperCase()]) {
    return OCR_ENGINES[forceEngine.toUpperCase()];
  }
  
  // Non-English/Chinese → PaddleOCR (100+ languages)
  if (!['en', 'zh', 'zh-CN', 'zh-TW'].includes(language)) {
    return OCR_ENGINES.PADDLE;
  }
  
  // Invoice/Receipt/Card → HunyuanOCR (92%+ accuracy)
  if (['invoice', 'receipt', 'card', 'table', 'customs', 'shipping'].includes(documentType)) {
    return OCR_ENGINES.HUNYUAN;
  }
  
  // Price lists and multilingual → PaddleOCR
  if (['pricelist', 'multilingual', 'structure'].includes(documentType)) {
    return OCR_ENGINES.PADDLE;
  }
  
  // Default to HunyuanOCR for highest accuracy
  return OCR_ENGINES.HUNYUAN;
}

/**
 * Check if an OCR engine is available
 */
export async function checkEngineHealth(engine) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const healthUrl = engine.name === 'HunyuanOCR' 
      ? `${engine.url}/health` 
      : `${engine.url}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get engine status for diagnostics
 */
export function getEngineStatus() {
  return {
    hunyuan: {
      configured: !!process.env.HUNYUAN_OCR_URL,
      url: process.env.HUNYUAN_OCR_URL || 'not configured'
    },
    paddle: {
      configured: !!process.env.PADDLE_OCR_URL,
      url: process.env.PADDLE_OCR_URL || 'not configured'
    },
    llama: {
      configured: !!process.env.TOGETHER_API_KEY,
      available: true
    }
  };
}

/**
 * Call HunyuanOCR via vLLM OpenAI-compatible API
 */
export async function callHunyuanOCR(imageBase64, prompt, options = {}) {
  const engine = OCR_ENGINES.HUNYUAN;
  const maxTokens = options.maxTokens || 2000;

  const response = await fetch(`${engine.url}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: engine.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }},
          { type: 'text', text: prompt }
        ]
      }],
      temperature: 0.1,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    throw new Error(`HunyuanOCR error: ${response.status}`);
  }

  const result = await response.json();
  return {
    text: result.choices[0].message.content,
    engine: 'hunyuan',
    accuracy: engine.accuracy,
    model: engine.model
  };
}

/**
 * Call PaddleOCR via REST API
 */
export async function callPaddleOCR(imageBase64, pipeline = 'ocr', options = {}) {
  const engine = OCR_ENGINES.PADDLE;

  const response = await fetch(`${engine.url}/${pipeline}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: imageBase64,
      fileType: 1, // 1 = image, 0 = PDF
      ...options
    })
  });

  if (!response.ok) {
    throw new Error(`PaddleOCR error: ${response.status}`);
  }

  const result = await response.json();

  // PaddleOCR returns ocrResults with text and confidence
  const ocrResults = result.result?.ocrResults || [];
  const avgConfidence = ocrResults.length > 0
    ? ocrResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / ocrResults.length
    : 0;

  return {
    text: ocrResults.map(r => r.text).join('\n'),
    results: ocrResults,
    engine: 'paddle',
    accuracy: avgConfidence || engine.accuracy,
    pipeline
  };
}

/**
 * Call Llama Vision via Together AI (fallback)
 */
export async function callLlamaVision(imageBase64, systemPrompt, userPrompt, options = {}) {
  const engine = OCR_ENGINES.LLAMA;
  const apiKey = process.env.TOGETHER_API_KEY;

  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY not configured');
  }

  const response = await fetch(engine.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: engine.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
          ]
        }
      ],
      max_tokens: options.maxTokens || 1500,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`LlamaVision error: ${response.status}`);
  }

  const result = await response.json();
  return {
    text: result.choices[0]?.message?.content || '',
    engine: 'llama',
    accuracy: engine.accuracy,
    model: engine.model
  };
}

/**
 * Unified OCR call with automatic fallback
 */
export async function callOCR(imageBase64, documentType, prompt, options = {}) {
  const language = options.language || 'en';
  const engine = selectEngine(documentType, language, options.forceEngine);

  let lastError = null;
  const attempts = [];

  // Try primary engine
  try {
    if (engine.name === 'HunyuanOCR') {
      const result = await callHunyuanOCR(imageBase64, prompt, options);
      return { ...result, attempts: [engine.name] };
    } else if (engine.name === 'PaddleOCR') {
      const result = await callPaddleOCR(imageBase64, options.pipeline || 'ocr', options);
      return { ...result, attempts: [engine.name] };
    }
  } catch (error) {
    lastError = error;
    attempts.push({ engine: engine.name, error: error.message });
  }

  // Try fallback to other engine
  const fallbackEngine = engine.name === 'HunyuanOCR' ? OCR_ENGINES.PADDLE : OCR_ENGINES.HUNYUAN;
  try {
    if (fallbackEngine.name === 'HunyuanOCR') {
      const result = await callHunyuanOCR(imageBase64, prompt, options);
      return { ...result, attempts: [...attempts, fallbackEngine.name], fallback: true };
    } else if (fallbackEngine.name === 'PaddleOCR') {
      const result = await callPaddleOCR(imageBase64, options.pipeline || 'ocr', options);
      return { ...result, attempts: [...attempts, fallbackEngine.name], fallback: true };
    }
  } catch (error) {
    attempts.push({ engine: fallbackEngine.name, error: error.message });
  }

  // Final fallback to Llama Vision
  try {
    const result = await callLlamaVision(imageBase64, prompt, options.userPrompt || prompt, options);
    return { ...result, attempts: [...attempts, 'LlamaVision'], fallback: true };
  } catch (error) {
    attempts.push({ engine: 'LlamaVision', error: error.message });
    throw new Error(`All OCR engines failed: ${JSON.stringify(attempts)}`);
  }
}

// Export engines for use in other modules
export { OCR_ENGINES };

