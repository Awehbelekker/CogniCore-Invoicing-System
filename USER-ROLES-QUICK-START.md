# Quick Start Guide - User Roles & Business Management

## 👥 User Roles Quick Reference

### 1. **Owner** 👑
**Permission Level**: Full system access
**Best For**: Business owners
- ✅ All operations
- ✅ Create/merge businesses
- ✅ Manage all users
- ✅ System settings

**When to Assign**: Business owner, CEO

---

### 2. **Admin** 🔧
**Permission Level**: Full access except business/merge
**Best For**: System administrators
- ✅ Manage invoices/customers/products
- ✅ Manage users
- ✅ View all data
- ❌ Cannot create/merge businesses
- ❌ Cannot change system settings

**When to Assign**: System administrator, operations lead

---

### 3. **Accountant** 💼
**Permission Level**: Financial data only
**Best For**: Finance team
- ✅ View all invoices & financials
- ✅ Export reports
- ✅ Use AI features
- ❌ Cannot create/edit/delete
- ❌ Cannot manage anything

**When to Assign**: Accountant, financial analyst

---

### 4. **Manager** 📊
**Permission Level**: Operations management
**Best For**: Operations team
- ✅ Manage invoices (create/edit)
- ✅ Manage customers & products
- ✅ Edit pricing
- ✅ Use AI features
- ❌ Cannot delete data
- ❌ Cannot view all reports

**When to Assign**: Operations manager, team lead

---

### 5. **Sales** 💰
**Permission Level**: Limited to sales activities
**Best For**: Sales team
- ✅ Create quotes & invoices
- ✅ View customer data
- ✅ View own financial summary
- ✅ Use AI features
- ❌ Cannot edit others' work
- ❌ Cannot manage products

**When to Assign**: Salesperson, sales rep

---

### 6. **User** 👤
**Permission Level**: Own data only
**Best For**: General staff
- ✅ Create & view own invoices
- ✅ View own financial data
- ❌ Cannot view others' data
- ❌ Cannot manage anything

**When to Assign**: General staff member

---

### 7. **Viewer** 👁️
**Permission Level**: Read-only access
**Best For**: Stakeholders, management reporting
- ✅ View dashboard (read-only)
- ✅ View summary data
- ✅ View reports (read-only)
- ❌ Cannot create/edit/delete
- ❌ Cannot export

**When to Assign**: Stakeholder, investor, auditor

---

## 🏢 Business Management

### Creating Trading As Business

**Step 1: Add Business**
```
1. Click "Switch Business" → "Add New Business"
2. Enter business name: "Aweh Watersports"
3. Select type: Retail/Service/etc
4. Click "Link to Parent Company (Optional)"
5. Select parent: "Aweh Be Lekker"
6. ✅ Check "Share product catalog" (optional)
7. Save
```

**Result**: New subsidiary created, linked to parent, inherits settings

---

### Linking Businesses

**Parent Business Gets**:
- 👥 Shows linked count in switcher
- 🔗 Link indicator
- Shared product catalog (if enabled)

**Child Business (Trading As) Gets**:
- 🔗 Shows parent name in switcher
- Unified financial view option
- Shared products from parent (if enabled)

---

### Upgrading Trading As to Independent Entity

**Step 1: Access Business**
```
1. Go to "Switch Business"
2. Click ✏️ Edit button on trading as business
```

**Step 2: Upgrade Section Appears**
```
You'll see green "Upgrade Trading As to Registered Entity" section
- Explains what happens
- Lets you enter new registration number
```

**Step 3: Upgrade**
```
1. Enter new registration number (optional)
2. Click "Upgrade to Independent Entity"
3. Read confirmation (shows parent name)
4. Click "Yes" to confirm
```

**Result**:
- ✅ Parent link removed
- ✅ Business now independent
- ✅ All data preserved
- ✅ Registration number updated

**After Upgrade**:
- Business appears independent in switcher
- No 🔗 link indicator
- Can be merged with other businesses
- Cannot be re-linked to parent

---

## 👤 Managing Users

### Adding User with Role

**Step 1: Open User Management**
```
1. Go to Settings → Users
2. Click "Add User"
3. Fill basic info
```

**Step 2: Select Role**
```
1. Choose role from dropdown
2. Description updates automatically
3. Shows what this role can do
```

**Step 3: Set Business Access**
```
1. See list of all businesses
2. Check which businesses user can access
3. User will only see these businesses
```

**Step 4: Save**
```
1. Click "Save User"
2. User receives invite/instructions
```

---

### Role Assignment Best Practices

| Situation | Recommended Role |
|-----------|-----------------|
| Business owner | **Owner** |
| Day-to-day manager | **Admin** |
| Finance/accounting team | **Accountant** |
| Operations staff | **Manager** |
| Sales team | **Sales** |
| Part-time staff | **User** |
| External stakeholder | **Viewer** |
| Client access | **Viewer** |

---

## 🔒 Business Access Control

### What Restricted Access Means

**User can see**:
- ✅ Only businesses they're assigned to
- ✅ Invoices from assigned businesses
- ✅ Customers from assigned businesses

**User cannot see**:
- ❌ Other businesses
- ❌ Other businesses' data
- ❌ Dashboard for other businesses

---

### Multi-Business User Example

```
Employee: John (Manager)

Business Access:
  ✅ Aweh Be Lekker
  ✅ Aweh Watersports (linked)
  ❌ Aweh Rentals

John can see:
- Both Aweh Be Lekker AND Aweh Watersports
- Can switch between them
- Can use "Linked View" to see both together
- Cannot access Aweh Rentals

John cannot do:
- Merge businesses
- Change business settings
- Create new businesses
```

---

## 📊 Dashboard Views

### Current Business View
```
Shows: Only the business you're currently working in
Use: Daily operations, single business focus
```

### Linked Businesses View (Admin/Owner)
```
Shows: Current business + all linked (trading as) businesses
Use: Combined financial reporting for parent + subsidiaries
```

### All Businesses View (Owner)
```
Shows: All your businesses
Use: Full system overview, multi-business management
```

---

## 🔄 Common Workflows

### Workflow 1: Start as Trading As, Then Expand

```
1. Create "Aweh" as main business
2. Create "Aweh Watersports" as trading as (linked)
3. Create "Aweh Rentals" as trading as (linked)
4. When Watersports becomes official company:
   - Edit Watersports business
   - Click "Upgrade to Independent Entity"
   - Confirm
   - Now it's a separate legal entity
```

### Workflow 2: Separate Businesses, Same Owner

```
1. Owner has multiple businesses
2. Create all as separate (not linked)
3. Use "All Businesses" dashboard view
4. Switch between as needed
5. Roles apply per business
```

### Workflow 3: Shared Team, Multiple Businesses

```
1. Create all businesses
2. Add manager with access to all
3. Add accountant with access to finance only
4. Manager sees all, switches to work on each
5. Accountant sees all business financials in one view
```

---

## ⚠️ Important Notes

**Cannot Undo**:
- ❌ Upgrading trading as to independent (permanent)
- ❌ Removing user from business (data loss)
- ❌ Merging businesses (data is combined)

**Always Backup Before**:
- Major user changes
- Business structure changes
- Merging data between businesses

**Role Limitations**:
- Accountant cannot see products/customers
- User only sees own invoices
- Viewer is read-only only
- Sales cannot edit other employees' work

---

## 🆘 Troubleshooting

**Q: Can't see business in switcher**
A: Check your user role - you may need access assigned

**Q: Upgrade button not showing**
A: Business must be linked (have parent) to show upgrade

**Q: Permission denied error**
A: Your role doesn't have this permission - contact admin

**Q: Lost data after merge**
A: Data is combined, not deleted - it's in the target business

**Q: User can't access business**
A: Add business to their access list in user edit

---

## 💡 Tips & Tricks

**Tip 1**: Use "Linked Businesses" view to compare trading as companies  
**Tip 2**: Share products between linked businesses to reduce duplicates  
**Tip 3**: Assign accountant to all businesses for cross-business reporting  
**Tip 4**: Use Viewer role for read-only stakeholder access  
**Tip 5**: Document your business structure before upgrading entities  

---

## 📞 Support

For issues with:
- **User roles**: Check role permissions table above
- **Business access**: Verify user has business in their access list
- **Upgrade process**: Ensure business is linked before upgrading
- **Data**: Always export before major operations
- **Other**: Contact system administrator

---

**Last Updated**: 2024  
**System**: Awake Invoicing System  
**Version**: Latest with User Roles & Business Management
