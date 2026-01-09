# 🔄 Migration Guide: localStorage → Supabase Multi-Tenant

## Overview

This guide details the zero-downtime migration from the current Aweh Invoice System (localStorage-based) to CogniCore (Supabase multi-tenant database).

## Migration Strategy

### Phase 1: Preparation (Week 1)

**1. Database Setup**
```sql
-- Run database-schema.sql to create all tables
-- Add migration tracking table

CREATE TABLE migration_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, in_progress, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    migrated_data JSONB,  -- Track what was migrated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_migration_status_user_id ON migration_status(user_id);
CREATE INDEX idx_migration_status_status ON migration_status(status);
```

**2. Feature Flags**
```javascript
// Enable gradual rollout
const FEATURE_FLAGS = {
  enableMigration: true,
  autoMigrate: false,  // Manual trigger initially
  forceSupabase: false,  // Keep localStorage fallback
  migrationBatchSize: 100  // Migrate in batches
};
```

### Phase 2: Dual-Write Mode (Week 2-3)

**Strategy:** Write to both localStorage AND Supabase simultaneously

```javascript
class HybridStorage {
  async save(table, data) {
    // 1. Save to localStorage (instant, always works)
    const localKey = `${table}_${data.id}`;
    localStorage.setItem(localKey, JSON.stringify(data));
    
    // 2. Try to save to Supabase (async, may fail)
    if (navigator.onLine && FEATURE_FLAGS.forceSupabase) {
      try {
        const { error } = await supabase
          .from(table)
          .upsert(data);
        
        if (!error) {
          // Mark as synced
          localStorage.setItem(`${localKey}_synced`, 'true');
        }
      } catch (error) {
        console.error('Supabase save failed:', error);
        // Queue for retry
        this.addToSyncQueue(table, data);
      }
    }
  }
  
  async load(table, id) {
    // 1. Try Supabase first (if online and enabled)
    if (navigator.onLine && FEATURE_FLAGS.forceSupabase) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (data && !error) {
          // Update localStorage cache
          localStorage.setItem(`${table}_${id}`, JSON.stringify(data));
          return data;
        }
      } catch (error) {
        console.error('Supabase load failed:', error);
      }
    }
    
    // 2. Fallback to localStorage
    const cached = localStorage.getItem(`${table}_${id}`);
    return cached ? JSON.parse(cached) : null;
  }
}
```

### Phase 3: User-Triggered Migration (Week 3-4)

**Migration UI:**
```html
<!-- Show migration banner to users -->
<div id="migrationBanner" class="banner">
  <h3>🚀 Upgrade to CogniCore Cloud</h3>
  <p>Move your data to the cloud for:</p>
  <ul>
    <li>✅ Access from any device</li>
    <li>✅ Automatic backups</li>
    <li>✅ Team collaboration</li>
    <li>✅ Advanced AI features</li>
  </ul>
  <button onclick="startMigration()">Migrate Now (30 seconds)</button>
  <button onclick="dismissBanner()">Remind Me Later</button>
</div>
```

**Migration Script:**
```javascript
async function startMigration() {
  const userId = (await supabase.auth.getUser()).data.user.id;
  
  // Show progress modal
  showMigrationProgress();
  
  try {
    // 1. Create migration record
    const { data: migration } = await supabase
      .from('migration_status')
      .insert({
        user_id: userId,
        status: 'in_progress',
        started_at: new Date()
      })
      .select()
      .single();
    
    // 2. Migrate businesses
    updateProgress('Migrating businesses...', 10);
    const businesses = await migrateBusinesses(userId);
    
    // 3. Migrate customers
    updateProgress('Migrating customers...', 30);
    const customers = await migrateCustomers(userId, businesses);
    
    // 4. Migrate products
    updateProgress('Migrating products...', 50);
    const products = await migrateProducts(userId, businesses);
    
    // 5. Migrate suppliers
    updateProgress('Migrating suppliers...', 70);
    const suppliers = await migrateSuppliers(userId, businesses);
    
    // 6. Migrate invoices
    updateProgress('Migrating invoices...', 85);
    const invoices = await migrateInvoices(userId, businesses);
    
    // 7. Update migration status
    await supabase
      .from('migration_status')
      .update({
        status: 'completed',
        completed_at: new Date(),
        migrated_data: {
          businesses: businesses.length,
          customers: customers.length,
          products: products.length,
          suppliers: suppliers.length,
          invoices: invoices.length
        }
      })
      .eq('id', migration.id);
    
    // 8. Mark as migrated
    localStorage.setItem('cognicore_migrated', 'true');
    localStorage.setItem('cognicore_migration_date', new Date().toISOString());
    
    updateProgress('Migration complete!', 100);
    
    // 9. Reload app
    setTimeout(() => {
      location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Update migration status
    await supabase
      .from('migration_status')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('user_id', userId);
    
    showToast('❌ Migration failed. Please contact support.', 'error');
  }
}

async function migrateBusinesses(userId) {
  const businesses = JSON.parse(localStorage.getItem('aweh_businesses') || '[]');
  const migrated = [];
  
  for (const business of businesses) {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: business.name,
        email: business.email,
        phone: business.phone,
        website: business.website,
        address: business.address,
        tax_id: business.taxId,
        bank_name: business.bankName,
        bank_account: business.bankAccount,
        bank_account_name: business.bankAccountName,
        bank_branch: business.bankBranch,
        logo: business.logo,
        settings: business.settings || {},
        plan: 'solo',  // Start on Tier 1
        created_at: new Date(business.createdAt || Date.now())
      })
      .select()
      .single();
    
    if (!error) {
      // Create user membership
      await supabase.from('users').insert({
        company_id: data.id,
        email: (await supabase.auth.getUser()).data.user.email,
        role: 'owner',
        first_name: business.contactPerson?.split(' ')[0] || '',
        last_name: business.contactPerson?.split(' ').slice(1).join(' ') || ''
      });
      
      migrated.push({ oldId: business.id, newId: data.id, data });
    }
  }
  
  return migrated;
}

async function migrateCustomers(userId, businesses) {
  const migrated = [];
  
  for (const business of businesses) {
    const customers = JSON.parse(
      localStorage.getItem(`aweh_customers_${business.oldId}`) || '[]'
    );
    
    for (const customer of customers) {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          company_id: business.newId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          tax_id: customer.taxId,
          created_at: new Date(customer.createdAt || Date.now())
        })
        .select()
        .single();
      
      if (!error) {
        migrated.push(data);
      }
    }
  }
  
  return migrated;
}

// Similar functions for products, suppliers, invoices...
```


