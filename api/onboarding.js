/**
 * AI-Powered Client Onboarding API
 * Handles automated client registration, approval workflow, and invoice generation
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * POST /api/onboarding/submit
 * Submit new client application from landing page
 */
router.post('/submit', async (req, res) => {
    try {
        const { companyName, contactName, email, phone, plan, price, requirements } = req.body;

        // Validate required fields
        if (!companyName || !contactName || !email || !plan || !price) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Create application record
        const application = {
            id: `APP-${Date.now()}`,
            companyName,
            contactName,
            email,
            phone,
            plan,
            price,
            requirements,
            status: 'pending_approval',
            createdAt: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        };

        // Save to database (using MongoDB/PostgreSQL in production)
        // For now, we'll use a simple in-memory store or file system
        await saveApplication(application);

        // Send confirmation email to client
        await sendClientConfirmationEmail(application);

        // Notify admin of new application
        await notifyAdminNewApplication(application);

        // AI Analysis: Check for fraud/spam indicators
        const aiAnalysis = await analyzeApplication(application);
        
        if (aiAnalysis.riskScore > 0.8) {
            application.status = 'flagged_for_review';
            application.aiFlags = aiAnalysis.flags;
            await updateApplication(application);
        }

        res.json({
            success: true,
            message: 'Application submitted successfully',
            applicationId: application.id,
            estimatedReviewTime: '24 hours'
        });

    } catch (error) {
        console.error('Onboarding submission error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

/**
 * POST /api/onboarding/approve/:applicationId
 * Admin approves client application and generates invoice
 */
router.post('/approve/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { adminId, customPrice, notes } = req.body;

        // Get application
        const application = await getApplication(applicationId);
        
        if (!application) {
            return res.status(404).json({ 
                success: false, 
                message: 'Application not found' 
            });
        }

        if (application.status !== 'pending_approval') {
            return res.status(400).json({ 
                success: false, 
                message: 'Application already processed' 
            });
        }

        // Create Stripe customer
        const customer = await stripe.customers.create({
            email: application.email,
            name: application.companyName,
            phone: application.phone,
            metadata: {
                applicationId: application.id,
                plan: application.plan
            }
        });

        // Create Stripe subscription invoice
        const finalPrice = customPrice || application.price;
        
        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: 'send_invoice',
            days_until_due: 7,
            metadata: {
                applicationId: application.id,
                plan: application.plan
            }
        });

        // Add invoice item
        await stripe.invoiceItems.create({
            customer: customer.id,
            invoice: invoice.id,
            amount: finalPrice * 100, // Convert to cents
            currency: 'zar',
            description: `CogniCore ${application.plan} Plan - Monthly Subscription`
        });

        // Finalize and send invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.sendInvoice(invoice.id);

        // Update application status
        application.status = 'approved';
        application.approvedAt = new Date().toISOString();
        application.approvedBy = adminId;
        application.stripeCustomerId = customer.id;
        application.stripeInvoiceId = invoice.id;
        application.invoiceUrl = finalizedInvoice.hosted_invoice_url;
        application.notes = notes;
        
        await updateApplication(application);

        // Send approval email with payment link
        await sendApprovalEmail(application);

        // Log activity
        await logActivity({
            type: 'application_approved',
            applicationId: application.id,
            adminId,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Application approved and invoice sent',
            invoiceUrl: finalizedInvoice.hosted_invoice_url,
            customerId: customer.id
        });

    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing approval'
        });
    }
});

/**
 * POST /api/onboarding/reject/:applicationId
 * Admin rejects client application
 */
router.post('/reject/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { adminId, reason } = req.body;

        const application = await getApplication(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        application.status = 'rejected';
        application.rejectedAt = new Date().toISOString();
        application.rejectedBy = adminId;
        application.rejectionReason = reason;

        await updateApplication(application);

        // Send rejection email (optional)
        if (req.body.sendEmail) {
            await sendRejectionEmail(application);
        }

        res.json({
            success: true,
            message: 'Application rejected'
        });

    } catch (error) {
        console.error('Rejection error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing rejection'
        });
    }
});

/**
 * Webhook handler for Stripe payment events
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'invoice.paid':
            await handleInvoicePaid(event.data.object);
            break;
        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionCancelled(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Helper Functions

async function saveApplication(application) {
    // In production: Save to database
    // For demo: Save to file or memory
    const fs = require('fs').promises;
    const filePath = './data/applications.json';

    try {
        let applications = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            applications = JSON.parse(data);
        } catch (err) {
            // File doesn't exist yet
        }

        applications.push(application);
        await fs.writeFile(filePath, JSON.stringify(applications, null, 2));
    } catch (error) {
        console.error('Error saving application:', error);
    }
}

async function getApplication(applicationId) {
    const fs = require('fs').promises;
    const filePath = './data/applications.json';

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const applications = JSON.parse(data);
        return applications.find(app => app.id === applicationId);
    } catch (error) {
        console.error('Error getting application:', error);
        return null;
    }
}

async function updateApplication(application) {
    const fs = require('fs').promises;
    const filePath = './data/applications.json';

    try {
        const data = await fs.readFile(filePath, 'utf8');
        let applications = JSON.parse(data);

        const index = applications.findIndex(app => app.id === application.id);
        if (index !== -1) {
            applications[index] = application;
            await fs.writeFile(filePath, JSON.stringify(applications, null, 2));
        }
    } catch (error) {
        console.error('Error updating application:', error);
    }
}

async function sendClientConfirmationEmail(application) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: '✅ Application Received - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Thank You for Choosing CogniCore!</h2>

                <p>Dear ${application.contactName},</p>

                <p>We've received your application for the <strong>${application.plan}</strong> plan.</p>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Application Details:</h3>
                    <p><strong>Company:</strong> ${application.companyName}</p>
                    <p><strong>Plan:</strong> ${application.plan}</p>
                    <p><strong>Price:</strong> R ${application.price}/month</p>
                    <p><strong>Application ID:</strong> ${application.id}</p>
                </div>

                <p>Our team will review your application within 24 hours. Once approved, you'll receive a payment link to activate your account.</p>

                <p>If you have any questions, feel free to reply to this email.</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

async function notifyAdminNewApplication(application) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `🔔 New Application: ${application.companyName}`,
        html: `
            <h2>New Client Application</h2>
            <p><strong>Company:</strong> ${application.companyName}</p>
            <p><strong>Contact:</strong> ${application.contactName}</p>
            <p><strong>Email:</strong> ${application.email}</p>
            <p><strong>Phone:</strong> ${application.phone}</p>
            <p><strong>Plan:</strong> ${application.plan} (R ${application.price}/month)</p>
            <p><strong>Requirements:</strong> ${application.requirements || 'None'}</p>
            <p><strong>Application ID:</strong> ${application.id}</p>

            <p><a href="${process.env.ADMIN_PORTAL_URL}/pending-clients">Review Application</a></p>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}

async function sendApprovalEmail(application) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: '🎉 Application Approved - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Congratulations! Your Application is Approved!</h2>

                <p>Dear ${application.contactName},</p>

                <p>Great news! Your application for CogniCore has been approved.</p>

                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <h3>Next Steps:</h3>
                    <ol>
                        <li>Click the payment link below to complete your subscription</li>
                        <li>Once payment is confirmed, you'll receive your login credentials</li>
                        <li>Start creating invoices immediately!</li>
                    </ol>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${application.invoiceUrl}"
                       style="background: linear-gradient(135deg, #667eea, #764ba2);
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        💳 Complete Payment (R ${application.price})
                    </a>
                </div>

                <p>Payment is due within 7 days. If you have any questions, please don't hesitate to contact us.</p>

                <p>Welcome to CogniCore!</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
}

async function sendRejectionEmail(application) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: 'Application Update - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Application Status Update</h2>

                <p>Dear ${application.contactName},</p>

                <p>Thank you for your interest in CogniCore. After reviewing your application, we're unable to proceed at this time.</p>

                ${application.rejectionReason ? `<p><strong>Reason:</strong> ${application.rejectionReason}</p>` : ''}

                <p>If you have any questions or would like to discuss this further, please feel free to contact us.</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
}

/**
 * AI-powered application analysis
 * Checks for fraud indicators, spam, and risk factors
 */
async function analyzeApplication(application) {
    const analysis = {
        riskScore: 0,
        flags: []
    };

    // Check for disposable email domains
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com'];
    const emailDomain = application.email.split('@')[1];
    if (disposableDomains.includes(emailDomain)) {
        analysis.riskScore += 0.5;
        analysis.flags.push('Disposable email detected');
    }

    // Check for suspicious patterns in company name
    if (application.companyName.length < 3) {
        analysis.riskScore += 0.3;
        analysis.flags.push('Company name too short');
    }

    // Check for missing phone number
    if (!application.phone) {
        analysis.riskScore += 0.2;
        analysis.flags.push('No phone number provided');
    }

    // Check for duplicate applications
    const existingApps = await getAllApplications();
    const duplicates = existingApps.filter(app =>
        app.email === application.email ||
        app.companyName === application.companyName
    );

    if (duplicates.length > 0) {
        analysis.riskScore += 0.4;
        analysis.flags.push('Duplicate application detected');
    }

    // In production, you could integrate with:
    // - OpenAI for content analysis
    // - Fraud detection APIs
    // - Email verification services
    // - Phone number validation

    return analysis;
}

async function getAllApplications() {
    const fs = require('fs').promises;
    const filePath = './data/applications.json';

    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function handleInvoicePaid(invoice) {
    console.log('Invoice paid:', invoice.id);

    // Find application by invoice ID
    const applications = await getAllApplications();
    const application = applications.find(app => app.stripeInvoiceId === invoice.id);

    if (!application) {
        console.error('Application not found for invoice:', invoice.id);
        return;
    }

    // Update application status
    application.status = 'active';
    application.paidAt = new Date().toISOString();
    application.subscriptionActive = true;

    await updateApplication(application);

    // Create company account
    await createCompanyAccount(application);

    // Send welcome email with login credentials
    await sendWelcomeEmail(application);

    // Log activity
    await logActivity({
        type: 'payment_received',
        applicationId: application.id,
        amount: invoice.amount_paid / 100,
        timestamp: new Date().toISOString()
    });
}

async function handlePaymentFailed(invoice) {
    console.log('Payment failed:', invoice.id);

    const applications = await getAllApplications();
    const application = applications.find(app => app.stripeInvoiceId === invoice.id);

    if (!application) return;

    application.paymentAttempts = (application.paymentAttempts || 0) + 1;
    application.lastPaymentFailure = new Date().toISOString();

    await updateApplication(application);

    // Send payment failure notification
    await sendPaymentFailureEmail(application);
}

async function handleSubscriptionCancelled(subscription) {
    console.log('Subscription cancelled:', subscription.id);

    // Block company account
    // Send cancellation confirmation
}

async function createCompanyAccount(application) {
    // Create company record in database
    const company = {
        id: `COMP-${Date.now()}`,
        name: application.companyName,
        email: application.email,
        phone: application.phone,
        plan: application.plan,
        price: application.price,
        status: 'active',
        stripeCustomerId: application.stripeCustomerId,
        createdAt: new Date().toISOString(),
        applicationId: application.id
    };

    // Save company
    const fs = require('fs').promises;
    const filePath = './data/companies.json';

    try {
        let companies = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            companies = JSON.parse(data);
        } catch (err) {
            // File doesn't exist
        }

        companies.push(company);
        await fs.writeFile(filePath, JSON.stringify(companies, null, 2));
    } catch (error) {
        console.error('Error creating company:', error);
    }

    return company;
}

async function sendWelcomeEmail(application) {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: '🎉 Welcome to CogniCore - Your Account is Ready!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Welcome to CogniCore!</h2>

                <p>Dear ${application.contactName},</p>

                <p>Your payment has been confirmed and your account is now active! 🎉</p>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Login Credentials:</h3>
                    <p><strong>Email:</strong> ${application.email}</p>
                    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                    <p style="color: #ef4444; font-size: 0.9rem;">⚠️ Please change your password after first login</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL}/login"
                       style="background: linear-gradient(135deg, #667eea, #764ba2);
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        🚀 Login to Your Dashboard
                    </a>
                </div>

                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Getting Started:</h3>
                    <ol>
                        <li>Login to your dashboard</li>
                        <li>Complete your company profile</li>
                        <li>Upload your logo and customize branding</li>
                        <li>Create your first invoice</li>
                        <li>Connect your Stripe account for payments</li>
                    </ol>
                </div>

                <p>Need help? Check out our <a href="${process.env.APP_URL}/docs">documentation</a> or contact support.</p>

                <p>We're excited to have you on board!</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}

async function sendPaymentFailureEmail(application) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: '⚠️ Payment Failed - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Payment Failed</h2>

                <p>Dear ${application.contactName},</p>

                <p>We were unable to process your payment for CogniCore subscription.</p>

                <p>Please update your payment method or try again:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${application.invoiceUrl}"
                       style="background: #ef4444;
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        💳 Retry Payment
                    </a>
                </div>

                <p>If you continue to experience issues, please contact our support team.</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending payment failure email:', error);
    }
}

async function logActivity(activity) {
    const fs = require('fs').promises;
    const filePath = './data/activity_log.json';

    try {
        let activities = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            activities = JSON.parse(data);
        } catch (err) {
            // File doesn't exist
        }

        activities.unshift(activity); // Add to beginning

        // Keep only last 1000 activities
        if (activities.length > 1000) {
            activities = activities.slice(0, 1000);
        }

        await fs.writeFile(filePath, JSON.stringify(activities, null, 2));
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

module.exports = router;

