// Vercel Serverless Function for OCR Customer/Business Card Scanning
// Scans business cards or customer info to auto-create customer records
// Uses Together AI Vision (FREE)

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { image, imageUrl, context } = await req.json();
    
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
            content: `You are an OCR assistant that extracts contact information from business cards, customer documents, or invoices.

Extract:
1. Company/Business name
2. Contact person name
3. Job title/position
4. Phone number(s) (mobile and/or landline)
5. Email address
6. Physical address
7. Website
8. VAT number (if present)
9. Any other relevant info

Return as JSON:
{
  "companyName": "",
  "contactPerson": "",
  "title": "",
  "phone": "",
  "mobile": "",
  "email": "",
  "address": "",
  "city": "",
  "postalCode": "",
  "website": "",
  "vat": "",
  "notes": ""
}

If it's a business card, extract company name. If it's an invoice/document, extract customer name.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: context || 'Extract all contact information from this image.'
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
        max_tokens: 800,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Vision API unavailable',
        fallback: true,
        message: 'Scan failed. Try again or enter manually.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Parse JSON from AI response
    let customerData = null;
    try {
      const jsonMatch = extractedText.match(/```json\n([\s\S]*?)\n```/) || 
                       extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        customerData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        
        // Enrich with metadata
        customerData.source = 'ocr-scan';
        customerData.createdDate = new Date().toISOString();
        customerData.tier = 'retail'; // Default tier
        
        // Clean phone numbers (remove spaces, dashes)
        if (customerData.phone) {
          customerData.phone = customerData.phone.replace(/[\s-()]/g, '');
        }
        if (customerData.mobile) {
          customerData.mobile = customerData.mobile.replace(/[\s-()]/g, '');
        }
      }
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        rawText: extractedText,
        parseError: true,
        message: 'Could not parse customer data. Please review.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      customer: customerData,
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
      message: 'OCR processing failed.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
