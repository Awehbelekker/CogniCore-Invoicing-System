/**
 * CSV Staff Upload API
 * Bulk upload staff members from CSV file
 * Expected CSV format: name,email,role,phone,department
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvData, businessId } = req.body;

    if (!csvData || !businessId) {
      return res.status(400).json({
        error: 'Missing required fields: csvData, businessId'
      });
    }

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['name', 'email', 'role'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingHeaders.join(', ')}`,
        hint: 'CSV must have columns: name, email, role (phone and department are optional)'
      });
    }

    // Process staff members
    const results = {
      success: [],
      errors: [],
      duplicates: [],
      total: lines.length - 1
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const staffMember = {};

      headers.forEach((header, index) => {
        staffMember[header] = values[index] || '';
      });

      // Validate staff member
      const validation = validateStaffMember(staffMember, i + 1);
      
      if (!validation.valid) {
        results.errors.push({
          line: i + 1,
          data: staffMember,
          error: validation.error
        });
        continue;
      }

      // Create staff member object
      const newStaffMember = {
        id: generateStaffId(),
        businessId,
        name: staffMember.name,
        email: staffMember.email.toLowerCase(),
        role: staffMember.role,
        phone: staffMember.phone || '',
        department: staffMember.department || '',
        status: 'active',
        permissions: getRolePermissions(staffMember.role),
        createdAt: new Date().toISOString(),
        createdBy: 'CSV Upload',
        invitationSent: false
      };

      results.success.push(newStaffMember);
    }

    return res.status(200).json({
      success: true,
      message: `✅ Processed ${results.total} staff members`,
      results: {
        successful: results.success.length,
        failed: results.errors.length,
        duplicates: results.duplicates.length
      },
      data: {
        staffMembers: results.success,
        errors: results.errors,
        duplicates: results.duplicates
      },
      nextSteps: [
        'Review the imported staff members',
        'Send invitation emails to new staff',
        'Assign additional permissions if needed'
      ]
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process CSV file'
    });
  }
};

/**
 * Validate staff member data
 */
function validateStaffMember(staff, lineNumber) {
  if (!staff.name || staff.name.length < 2) {
    return { valid: false, error: 'Name is required and must be at least 2 characters' };
  }

  if (!staff.email || !isValidEmail(staff.email)) {
    return { valid: false, error: 'Valid email is required' };
  }

  if (!staff.role) {
    return { valid: false, error: 'Role is required' };
  }

  const validRoles = ['owner', 'admin', 'manager', 'accountant', 'sales', 'staff', 'viewer'];
  if (!validRoles.includes(staff.role.toLowerCase())) {
    return { 
      valid: false, 
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get default permissions for role
 */
function getRolePermissions(role) {
  const permissions = {
    owner: ['all'],
    admin: ['manage_business', 'manage_staff', 'manage_invoices', 'manage_customers', 'view_reports'],
    manager: ['manage_invoices', 'manage_customers', 'view_reports'],
    accountant: ['manage_invoices', 'view_reports'],
    sales: ['create_invoices', 'manage_customers'],
    staff: ['create_invoices', 'view_customers'],
    viewer: ['view_invoices', 'view_customers']
  };

  return permissions[role.toLowerCase()] || ['view_invoices'];
}

/**
 * Generate unique staff ID
 */
function generateStaffId() {
  return 'STAFF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

