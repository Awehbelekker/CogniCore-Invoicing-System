// WhatsApp Cloud API Integration for ConiCore
// Sends automated messages to clients when companies are created

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
        const { 
            recipientPhone, 
            companyName, 
            registrationUrl, 
            loginCode,
            messageType = 'registration',
            customMessage = null
        } = req.body;

        // Validate required fields
        if (!recipientPhone || !companyName || !registrationUrl || !loginCode) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['recipientPhone', 'companyName', 'registrationUrl', 'loginCode']
            });
        }

        // Get WhatsApp credentials from environment
        const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
            return res.status(500).json({ 
                error: 'WhatsApp not configured',
                message: 'Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Vercel environment variables',
                fallback: 'manual',
                manualMessage: generateMessage(companyName, registrationUrl, loginCode)
            });
        }

        // Format phone number (remove spaces, dashes, ensure country code)
        let formattedPhone = recipientPhone.replace(/[\s\-\(\)]/g, '');
        
        // Remove leading + if present (WhatsApp API doesn't want it)
        if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }
        
        // If starts with 0, assume South Africa (+27)
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '27' + formattedPhone.substring(1);
        }

        // Generate message based on type
        const messageText = customMessage || generateMessage(companyName, registrationUrl, loginCode, messageType);

        // WhatsApp Cloud API endpoint
        const whatsappUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

        // Send message
        const response = await fetch(whatsappUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedPhone,
                type: 'text',
                text: {
                    preview_url: true,
                    body: messageText
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API Error:', result);
            
            // Return specific error messages
            if (result.error?.code === 131030) {
                return res.status(400).json({
                    error: 'Recipient not on WhatsApp',
                    message: 'This phone number is not registered on WhatsApp',
                    phone: formattedPhone,
                    fallback: 'manual'
                });
            }
            
            if (result.error?.code === 131047) {
                return res.status(400).json({
                    error: 'Message template required',
                    message: 'For first-time messages, you need to use an approved template',
                    fallback: 'manual'
                });
            }

            return res.status(response.status).json({
                error: 'WhatsApp API error',
                details: result.error,
                fallback: 'manual',
                manualMessage: messageText
            });
        }

        // Success!
        return res.status(200).json({
            success: true,
            messageId: result.messages?.[0]?.id,
            recipient: formattedPhone,
            status: 'sent',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('WhatsApp send error:', error);
        return res.status(500).json({ 
            error: 'Failed to send WhatsApp message',
            message: error.message,
            fallback: 'manual'
        });
    }
}

// Generate message based on type
function generateMessage(companyName, registrationUrl, loginCode, messageType = 'registration') {
    
    if (messageType === 'registration') {
        return `🎉 *Welcome to ConiCore Invoicing!*

Hi there! Your company *${companyName}* has been registered.

📱 *Register here:*
${registrationUrl}

🔑 *Your Registration Code:*
\`${loginCode}\`

📝 *How to get started:*
1. Click the registration link above
2. Enter your email address
3. Enter code: *${loginCode}*
4. Create your password
5. Complete your company setup

Need help? Contact your administrator.

_Powered by ConiCore Technology_`;
    }
    
    if (messageType === 'reminder') {
        return `👋 *Reminder: Complete Your Registration*

Hi! You haven't completed your ConiCore registration yet.

📱 *Register here:*
${registrationUrl}

🔑 *Your Code:* \`${loginCode}\`

Don't miss out on easy invoicing!

_Powered by ConiCore Technology_`;
    }
    
    if (messageType === 'password_reset') {
        return `🔐 *Password Reset Request*

A password reset was requested for *${companyName}*.

📱 *Reset here:*
${registrationUrl}

🔑 *Verification Code:* \`${loginCode}\`

If you didn't request this, please ignore this message.

_Powered by ConiCore Technology_`;
    }
    
    // Default welcome message
    return `Welcome to ConiCore Invoicing!

Company: ${companyName}
Registration: ${registrationUrl}
Code: ${loginCode}

Powered by ConiCore`;
}
