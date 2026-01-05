// Vercel Serverless Function for OCR Price List Scanning
// Scans supplier price lists to bulk update product catalog
// Uses Together AI Vision (FREE)

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { image, imageUrl, supplier, context } = await req.json();
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY || 'FREE_TIER'}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: `You are an OCR assistant that extracts product pricing data from supplier price lists.

Extract ALL products with:
1. Product code/SKU (if available)
2. Product name/description
3. Category (if mentioned)
4. Unit price
5. Currency (default ZAR if not specified)
6. Unit of measure (e.g., "each", "per pack", etc.)
7. Any special notes (minimum order, bulk discount, etc.)

Return as JSON array:
[
  {
    "sku": "ABC123",
    "name": "Product Name",
    "category": "Category",
    "price": 0,
    "currency": "ZAR",
    "unit": "each",
    "notes": "Special conditions"
  }
]

Be thorough - extract EVERY product on the price list.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all products from this ${supplier ? supplier + ' ' : ''}price list. ${context || ''}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl || `data:image/jpeg;base64,${image}`
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
      return new Response(JSON.stringify({
        success: false,
        error: 'Vision API unavailable',
        fallback: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Parse JSON array from AI response
    let products = [];
    try {
      const jsonMatch = extractedText.match(/```json\n([\s\S]*?)\n```/) || 
                       extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (e) {
      // Return raw text if parsing fails
      return new Response(JSON.stringify({
        success: false,
        rawText: extractedText,
        parseError: true,
        message: 'Could not parse products. Please review and enter manually.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add supplier info to all products
    const enrichedProducts = products.map(p => ({
      ...p,
      supplier: supplier || 'Unknown',
      importDate: new Date().toISOString(),
      source: 'ocr-scan'
    }));

    return new Response(JSON.stringify({
      success: true,
      products: enrichedProducts,
      count: enrichedProducts.length,
      source: 'llama-vision',
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
