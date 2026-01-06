// WhatsApp Message Status Webhook for ConiCore
// Receives delivery status updates from WhatsApp Cloud API

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'conicore_whatsapp_2024';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WhatsApp webhook verified');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).json({ error: 'Verification failed' });
        }
    }

    // Handle incoming webhooks (POST request with status updates)
    if (req.method === 'POST') {
        try {
            const body = req.body;

            // Log the webhook for debugging
            console.log('WhatsApp Webhook received:', JSON.stringify(body, null, 2));

            // Extract status updates
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (value?.statuses) {
                // Message status update
                for (const status of value.statuses) {
                    const messageId = status.id;
                    const recipientId = status.recipient_id;
                    const messageStatus = status.status; // sent, delivered, read, failed
                    const timestamp = status.timestamp;

                    console.log(`Message ${messageId} to ${recipientId}: ${messageStatus}`);

                    // Here you could store status in a database
                    // For now, we just log it
                    
                    if (messageStatus === 'failed') {
                        const errorCode = status.errors?.[0]?.code;
                        const errorMessage = status.errors?.[0]?.message;
                        console.error(`Message failed: ${errorCode} - ${errorMessage}`);
                    }
                }
            }

            if (value?.messages) {
                // Incoming message (reply from user)
                for (const message of value.messages) {
                    const from = message.from;
                    const messageType = message.type;
                    const text = message.text?.body;

                    console.log(`Incoming message from ${from}: ${text}`);

                    // Here you could handle auto-replies or forward to admin
                }
            }

            // Always return 200 to acknowledge receipt
            return res.status(200).json({ status: 'received' });

        } catch (error) {
            console.error('Webhook error:', error);
            // Still return 200 to prevent Meta from retrying
            return res.status(200).json({ status: 'error logged' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
