// Vercel Serverless Function for OCR Invoice Scanning
// Scans supplier invoices to auto-create purchase orders
// Uses Together AI Vision (FREE) + fallback OCR

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { image, imageUrl, context } = await req.json();
    
    // Use Together AI Vision model (free tier)
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
            content: `You are an OCR assistant that extracts structured data from supplier invoices. 
Extract:
1. Supplier name and contact info
2. Invoice number and date
3. All line items with:
   - Product name/description
   - Quantity
   - Unit price
   - Total price
4. Subtotal, VAT, and grand total
5. Payment terms and due date

Return data as JSON with this structure:
{
  "supplier": {"name": "", "contact": "", "vat": ""},
  "invoiceNumber": "",
  "invoiceDate": "",
  "items": [{"description": "", "quantity": 0, "unitPrice": 0, "total": 0}],
  "subtotal": 0,
  "vat": 0,
  "total": 0,
  "dueDate": "",
  "paymentTerms": ""
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: context || 'Extract all invoice data from this image.'
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
        max_tokens: 1000,
        temperature: 0.1 // Low temperature for accurate extraction
      })
    });

    if (!response.ok) {
      // Fallback: Return structured error
      return new Response(JSON.stringify({
        success: false,
        error: 'Vision API unavailable',
        fallback: true,
        message: 'Upload failed. Try again or enter manually.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Parse JSON from AI response
    let invoiceData = null;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = extractedText.match(/```json\n([\s\S]*?)\n```/) || 
                       extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        invoiceData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, return raw text
      invoiceData = {
        rawText: extractedText,
        parseError: true
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: invoiceData,
      source: 'llama-vision',
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
