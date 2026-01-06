/**
 * Language Detection Service for OCR Routing
 * Detects language from text or image to route to optimal OCR engine
 * 
 * PaddleOCR: 100+ languages (best for non-Latin scripts)
 * HunyuanOCR: English, Chinese (best for accuracy)
 */

export const config = {
  runtime: 'edge',
};

// Language detection patterns (Unicode ranges)
const LANGUAGE_PATTERNS = {
  // East Asian
  'zh': { pattern: /[\u4e00-\u9fff]/, name: 'Chinese', engine: 'paddle' },
  'ja': { pattern: /[\u3040-\u309f\u30a0-\u30ff]/, name: 'Japanese', engine: 'paddle' },
  'ko': { pattern: /[\uac00-\ud7af]/, name: 'Korean', engine: 'paddle' },
  
  // Middle Eastern
  'ar': { pattern: /[\u0600-\u06ff]/, name: 'Arabic', engine: 'paddle' },
  'he': { pattern: /[\u0590-\u05ff]/, name: 'Hebrew', engine: 'paddle' },
  'fa': { pattern: /[\u0600-\u06ff\u0750-\u077f]/, name: 'Persian', engine: 'paddle' },
  
  // South Asian
  'hi': { pattern: /[\u0900-\u097f]/, name: 'Hindi', engine: 'paddle' },
  'bn': { pattern: /[\u0980-\u09ff]/, name: 'Bengali', engine: 'paddle' },
  'ta': { pattern: /[\u0b80-\u0bff]/, name: 'Tamil', engine: 'paddle' },
  'te': { pattern: /[\u0c00-\u0c7f]/, name: 'Telugu', engine: 'paddle' },
  
  // Southeast Asian
  'th': { pattern: /[\u0e00-\u0e7f]/, name: 'Thai', engine: 'paddle' },
  'vi': { pattern: /[\u1e00-\u1eff]/, name: 'Vietnamese', engine: 'paddle' },
  
  // Cyrillic
  'ru': { pattern: /[\u0400-\u04ff]/, name: 'Russian', engine: 'paddle' },
  'uk': { pattern: /[\u0400-\u04ff]/, name: 'Ukrainian', engine: 'paddle' },
  
  // Greek
  'el': { pattern: /[\u0370-\u03ff]/, name: 'Greek', engine: 'paddle' },
  
  // Latin-based (default to HunyuanOCR for accuracy)
  'en': { pattern: /[a-zA-Z]/, name: 'English', engine: 'hunyuan' },
  'de': { pattern: /[äöüßÄÖÜ]/, name: 'German', engine: 'hunyuan' },
  'fr': { pattern: /[àâçéèêëîïôùûüÿœæ]/, name: 'French', engine: 'hunyuan' },
  'es': { pattern: /[áéíóúüñ¿¡]/, name: 'Spanish', engine: 'hunyuan' },
  'pt': { pattern: /[àáâãçéêíóôõú]/, name: 'Portuguese', engine: 'hunyuan' },
  'it': { pattern: /[àèéìíîòóùú]/, name: 'Italian', engine: 'hunyuan' },
};

// South African languages (Latin-based, use HunyuanOCR)
const SA_LANGUAGES = ['af', 'zu', 'xh', 'st', 'tn', 'ts', 've', 'ss', 'nr', 'nso'];

/**
 * Detect language from text
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { code: 'en', name: 'English', confidence: 0.5, engine: 'hunyuan' };
  }
  
  const results = [];
  
  // Check each language pattern
  for (const [code, config] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = text.match(new RegExp(config.pattern, 'g'));
    if (matches) {
      const ratio = matches.length / text.length;
      results.push({
        code,
        name: config.name,
        engine: config.engine,
        matches: matches.length,
        confidence: Math.min(ratio * 5, 0.95) // Scale up, cap at 95%
      });
    }
  }
  
  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);
  
  // Return best match or default to English
  if (results.length > 0 && results[0].confidence > 0.1) {
    return results[0];
  }
  
  return { code: 'en', name: 'English', confidence: 0.8, engine: 'hunyuan' };
}

/**
 * Get recommended OCR engine for language
 */
export function getEngineForLanguage(langCode) {
  // South African languages use HunyuanOCR
  if (SA_LANGUAGES.includes(langCode)) {
    return 'hunyuan';
  }
  
  const config = LANGUAGE_PATTERNS[langCode];
  return config?.engine || 'hunyuan';
}

/**
 * Detect multiple languages in text
 */
export function detectMultipleLanguages(text) {
  if (!text) return [];
  
  const detected = [];
  
  for (const [code, config] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = text.match(new RegExp(config.pattern, 'g'));
    if (matches && matches.length > 3) {
      detected.push({
        code,
        name: config.name,
        engine: config.engine,
        count: matches.length,
        percentage: (matches.length / text.length * 100).toFixed(1)
      });
    }
  }
  
  return detected.sort((a, b) => b.count - a.count);
}

/**
 * API Handler
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text, detectMultiple } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No text provided'
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    if (detectMultiple) {
      const languages = detectMultipleLanguages(text);
      return new Response(JSON.stringify({
        success: true,
        languages,
        recommendedEngine: languages[0]?.engine || 'hunyuan'
      }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    const result = detectLanguage(text);
    return new Response(JSON.stringify({
      success: true,
      ...result,
      recommendedEngine: result.engine
    }), { status: 200, headers: { 'Content-Type': 'application/json' }});

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}

