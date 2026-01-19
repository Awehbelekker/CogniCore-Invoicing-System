/**
 * Client Blocking System
 * Automated payment verification and account suspension
 */

const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Email configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Automated daily check for overdue payments
 * Runs every day at 2 AM
 */
cron.schedule('0 2 * * *', async () => {
    console.log('Running automated payment check...');
    await checkOverduePayments();
});

/**
 * Check all companies for overdue payments
 */
async function checkOverduePayments() {
    const fs = require('fs').promises;
    const companiesPath = './data/companies.json';
    
    try {
        const data = await fs.readFile(companiesPath, 'utf8');
        const companies = JSON.parse(data);
        
        const now = new Date();
        const systemConfig = await getSystemConfig();
        const autoBlockDays = parseInt(systemConfig.autoBlockDays || 30);
        
        for (const company of companies) {
            if (company.status === 'blocked') continue;
            
            // Check if payment is overdue
            const lastPaymentDate = new Date(company.lastPaymentDate || company.createdAt);
            const daysSincePayment = Math.floor((now - lastPaymentDate) / (1000 * 60 * 60 * 24));
            
            // Send warnings at different intervals
            if (daysSincePayment === 7) {
                await sendPaymentReminder(company, '7 days');
            } else if (daysSincePayment === 14) {
                await sendPaymentReminder(company, '14 days');
            } else if (daysSincePayment === 21) {
                await sendPaymentWarning(company, '21 days');
            } else if (daysSincePayment >= autoBlockDays) {
                await blockCompany(company, 'Non-payment - Automatic block');
            }
        }
        
        console.log('Payment check completed');
    } catch (error) {
        console.error('Error checking overdue payments:', error);
    }
}

/**
 * Block a company account
 */
async function blockCompany(company, reason) {
    const fs = require('fs').promises;
    const companiesPath = './data/companies.json';
    const blockedPath = './data/blocked_clients.json';
    
    try {
        // Update company status
        const data = await fs.readFile(companiesPath, 'utf8');
        let companies = JSON.parse(data);
        
        const companyIndex = companies.findIndex(c => c.id === company.id);
        if (companyIndex === -1) return;
        
        companies[companyIndex].status = 'blocked';
        companies[companyIndex].blockedAt = new Date().toISOString();
        companies[companyIndex].blockReason = reason;
        companies[companyIndex].blockedBy = 'system';
        
        await fs.writeFile(companiesPath, JSON.stringify(companies, null, 2));
        
        // Add to blocked list
        let blockedClients = [];
        try {
            const blockedData = await fs.readFile(blockedPath, 'utf8');
            blockedClients = JSON.parse(blockedData);
        } catch (err) {
            // File doesn't exist
        }
        
        blockedClients.push(companies[companyIndex]);
        await fs.writeFile(blockedPath, JSON.stringify(blockedClients, null, 2));
        
        // Disable all user accounts for this company
        await disableCompanyUsers(company.id);
        
        // Send block notification
        await sendBlockNotification(companies[companyIndex]);
        
        // Notify admin
        await notifyAdminBlock(companies[companyIndex]);
        
        // Log activity
        await logActivity({
            type: 'company_blocked',
            companyId: company.id,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Company blocked: ${company.name}`);
    } catch (error) {
        console.error('Error blocking company:', error);
    }
}

/**
 * Unblock a company account
 */
router.post('/unblock/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { adminId, notes } = req.body;
        
        const fs = require('fs').promises;
        const companiesPath = './data/companies.json';
        const blockedPath = './data/blocked_clients.json';
        
        // Update company status
        const data = await fs.readFile(companiesPath, 'utf8');
        let companies = JSON.parse(data);
        
        const companyIndex = companies.findIndex(c => c.id === companyId);
        if (companyIndex === -1) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        
        companies[companyIndex].status = 'active';
        companies[companyIndex].unblockedAt = new Date().toISOString();
        companies[companyIndex].unblockedBy = adminId;
        companies[companyIndex].unblockNotes = notes;
        delete companies[companyIndex].blockedAt;
        delete companies[companyIndex].blockReason;
        
        await fs.writeFile(companiesPath, JSON.stringify(companies, null, 2));
        
        // Remove from blocked list
        const blockedData = await fs.readFile(blockedPath, 'utf8');
        let blockedClients = JSON.parse(blockedData);
        blockedClients = blockedClients.filter(c => c.id !== companyId);
        await fs.writeFile(blockedPath, JSON.stringify(blockedClients, null, 2));
        
        // Re-enable user accounts
        await enableCompanyUsers(companyId);
        
        // Send unblock notification
        await sendUnblockNotification(companies[companyIndex]);
        
        // Log activity
        await logActivity({
            type: 'company_unblocked',
            companyId: companyId,
            adminId: adminId,
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Company unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking company:', error);
        res.status(500).json({ success: false, message: 'Error unblocking company' });
    }
});

/**
 * Manual block endpoint for admin
 */
router.post('/block/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { adminId, reason } = req.body;

        const fs = require('fs').promises;
        const companiesPath = './data/companies.json';

        const data = await fs.readFile(companiesPath, 'utf8');
        const companies = JSON.parse(data);

        const company = companies.find(c => c.id === companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        await blockCompany(company, reason || 'Manual block by admin');

        res.json({ success: true, message: 'Company blocked successfully' });
    } catch (error) {
        console.error('Error blocking company:', error);
        res.status(500).json({ success: false, message: 'Error blocking company' });
    }
});

/**
 * Get blocked clients list
 */
router.get('/blocked', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const blockedPath = './data/blocked_clients.json';

        let blockedClients = [];
        try {
            const data = await fs.readFile(blockedPath, 'utf8');
            blockedClients = JSON.parse(data);
        } catch (err) {
            // File doesn't exist
        }

        res.json({ success: true, blockedClients });
    } catch (error) {
        console.error('Error getting blocked clients:', error);
        res.status(500).json({ success: false, message: 'Error retrieving blocked clients' });
    }
});

// Helper Functions

async function disableCompanyUsers(companyId) {
    const fs = require('fs').promises;
    const usersPath = './data/users.json';

    try {
        const data = await fs.readFile(usersPath, 'utf8');
        let users = JSON.parse(data);

        users = users.map(user => {
            if (user.companyId === companyId) {
                user.status = 'suspended';
                user.suspendedAt = new Date().toISOString();
                user.suspensionReason = 'Company account blocked';
            }
            return user;
        });

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error disabling company users:', error);
    }
}

async function enableCompanyUsers(companyId) {
    const fs = require('fs').promises;
    const usersPath = './data/users.json';

    try {
        const data = await fs.readFile(usersPath, 'utf8');
        let users = JSON.parse(data);

        users = users.map(user => {
            if (user.companyId === companyId && user.status === 'suspended') {
                user.status = 'active';
                delete user.suspendedAt;
                delete user.suspensionReason;
            }
            return user;
        });

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error enabling company users:', error);
    }
}

async function sendPaymentReminder(company, daysOverdue) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: company.email,
        subject: '💳 Payment Reminder - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Payment Reminder</h2>

                <p>Dear ${company.name},</p>

                <p>This is a friendly reminder that your CogniCore subscription payment is overdue by ${daysOverdue}.</p>

                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p><strong>Subscription:</strong> ${company.plan} Plan</p>
                    <p><strong>Amount Due:</strong> R ${company.price}</p>
                    <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
                </div>

                <p>Please update your payment to avoid service interruption.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL}/billing"
                       style="background: #f59e0b;
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        💳 Update Payment
                    </a>
                </div>

                <p>If you have any questions, please contact our support team.</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending payment reminder:', error);
    }
}

async function sendPaymentWarning(company, daysOverdue) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: company.email,
        subject: '⚠️ URGENT: Payment Required - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">URGENT: Payment Required</h2>

                <p>Dear ${company.name},</p>

                <p><strong>Your account will be suspended if payment is not received within 9 days.</strong></p>

                <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>⚠️ WARNING:</strong> Your payment is ${daysOverdue} days overdue.</p>
                    <p><strong>Subscription:</strong> ${company.plan} Plan</p>
                    <p><strong>Amount Due:</strong> R ${company.price}</p>
                    <p><strong>Action Required:</strong> Pay within 9 days to avoid suspension</p>
                </div>

                <p>Once your account is suspended, you will lose access to:</p>
                <ul>
                    <li>Invoice creation and management</li>
                    <li>Payment processing</li>
                    <li>Customer data</li>
                    <li>All platform features</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL}/billing"
                       style="background: #ef4444;
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        💳 PAY NOW
                    </a>
                </div>

                <p>If you're experiencing payment issues, please contact us immediately.</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending payment warning:', error);
    }
}

async function sendBlockNotification(company) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: company.email,
        subject: '🚫 Account Suspended - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Account Suspended</h2>

                <p>Dear ${company.name},</p>

                <p>Your CogniCore account has been suspended due to non-payment.</p>

                <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>Reason:</strong> ${company.blockReason}</p>
                    <p><strong>Suspended On:</strong> ${new Date(company.blockedAt).toLocaleDateString()}</p>
                    <p><strong>Outstanding Amount:</strong> R ${company.price}</p>
                </div>

                <p><strong>Your account access has been disabled.</strong></p>

                <p>To reactivate your account:</p>
                <ol>
                    <li>Pay the outstanding amount</li>
                    <li>Contact our support team</li>
                    <li>Your account will be reactivated within 24 hours of payment</li>
                </ol>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL}/billing"
                       style="background: #10b981;
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        💳 Pay & Reactivate
                    </a>
                </div>

                <p>Contact: support@cognicore.com</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending block notification:', error);
    }
}

async function sendUnblockNotification(company) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: company.email,
        subject: '✅ Account Reactivated - CogniCore',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Account Reactivated!</h2>

                <p>Dear ${company.name},</p>

                <p>Great news! Your CogniCore account has been reactivated.</p>

                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p><strong>✅ Your account is now active</strong></p>
                    <p><strong>Reactivated On:</strong> ${new Date(company.unblockedAt).toLocaleDateString()}</p>
                </div>

                <p>You now have full access to all CogniCore features.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL}/login"
                       style="background: linear-gradient(135deg, #667eea, #764ba2);
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 8px;
                              display: inline-block;
                              font-weight: bold;">
                        🚀 Login to Dashboard
                    </a>
                </div>

                <p>Thank you for your continued business!</p>

                <p>Best regards,<br>
                The CogniCore Team</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending unblock notification:', error);
    }
}

async function notifyAdminBlock(company) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `🚫 Company Blocked: ${company.name}`,
        html: `
            <h2>Company Account Blocked</h2>
            <p><strong>Company:</strong> ${company.name}</p>
            <p><strong>Reason:</strong> ${company.blockReason}</p>
            <p><strong>Blocked At:</strong> ${new Date(company.blockedAt).toLocaleString()}</p>
            <p><strong>Outstanding:</strong> R ${company.price}</p>

            <p><a href="${process.env.ADMIN_PORTAL_URL}/blocked">View Blocked Clients</a></p>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}

async function getSystemConfig() {
    const fs = require('fs').promises;
    const configPath = './data/system_config.json';

    try {
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { autoBlockDays: 30 }; // Default
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

        activities.unshift(activity);

        if (activities.length > 1000) {
            activities = activities.slice(0, 1000);
        }

        await fs.writeFile(filePath, JSON.stringify(activities, null, 2));
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

module.exports = router;

