# 🔧 Component Porting Example: Invoice System → CogniCore React

This document shows **exactly how** to port components from the invoice system to CogniCore.

---

## Example 1: Modal Component

### Invoice System (HTML + Vanilla JS)

```html
<!-- COMPLETE-INVOICE-SYSTEM.html -->
<div id="customerModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Add Customer</h2>
            <button class="modal-close" onclick="closeModal('customerModal')">×</button>
        </div>
        <div class="modal-body">
            <form id="customerForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="customerName" class="form-control" required>
                </div>
                <!-- More fields... -->
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('customerModal')">Cancel</button>
            <button class="btn btn-primary" onclick="saveCustomer()">Save</button>
        </div>
    </div>
</div>

<style>
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal.active {
    display: flex;
}

.modal-content {
    background: var(--card-bg);
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}
/* ... more styles ... */
</style>

<script>
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    modal.style.display = 'none';
}
</script>
```

### CogniCore (React + TypeScript)

```typescript
// src/components/Modal/Modal.tsx
import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '600px'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```

```css
/* src/components/Modal/Modal.css */
/* Copy styles directly from invoice system! */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

/* ... rest of styles from invoice system ... */
```

**Usage in CogniCore:**

```typescript
// src/pages/Customers/AddCustomerModal.tsx
import { Modal } from '@/components/Modal';
import { useState } from 'react';

export const AddCustomerModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSave = async () => {
    // Call API instead of localStorage
    await api.post('/customers', formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Customer"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </>
      }
    >
      <form>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        {/* More fields... */}
      </form>
    </Modal>
  );
};
```

---

## Example 2: Customer Management

### Invoice System (Vanilla JS)

```javascript
// COMPLETE-INVOICE-SYSTEM.html
let customers = JSON.parse(localStorage.getItem('aweh_customers') || '[]');

function saveCustomer() {
    const customer = {
        id: Date.now(),
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        pricingTier: document.getElementById('customerTier').value
    };
    
    customers.push(customer);
    localStorage.setItem('aweh_customers', JSON.stringify(customers));
    updateCustomerTable();
    closeModal('customerModal');
}
```

### CogniCore (React + API)

```typescript
// src/services/api/customers.ts
import { apiClient } from './client';

export interface Customer {
  id: string;
  company_id: string;  // ← Multi-tenant!
  name: string;
  email: string;
  phone: string;
  // No pricingTier - that's company-level now
}

export const customersApi = {
  async getAll(): Promise<Customer[]> {
    const { data } = await apiClient.get('/customers');
    return data;
  },

  async create(customer: Omit<Customer, 'id' | 'company_id'>): Promise<Customer> {
    const { data } = await apiClient.post('/customers', customer);
    return data;
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const { data } = await apiClient.put(`/customers/${id}`, customer);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  }
};
```

```typescript
// src/pages/Customers/CustomersPage.tsx
import { useState, useEffect } from 'react';
import { customersApi, Customer } from '@/services/api/customers';
import { AddCustomerModal } from './AddCustomerModal';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData) => {
    await customersApi.create(customerData);
    await loadCustomers(); // Refresh list
    setIsModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Customers</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          ➕ Add Customer
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>
                  <button className="btn btn-sm">Edit</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddCustomer}
      />
    </div>
  );
};
```

---

## Key Takeaways

### ✅ What Stays the Same:
1. **CSS styles** - Copy directly!
2. **HTML structure** - Convert to JSX
3. **UI/UX patterns** - Keep the same flow
4. **Form layouts** - Same structure
5. **Button styles** - Same classes

### 🔄 What Changes:
1. **Data storage** - LocalStorage → API calls
2. **State management** - Global vars → React hooks
3. **Event handlers** - onclick → onClick with React
4. **Multi-tenancy** - Add company_id everywhere
5. **Authentication** - Add user context

### 🆕 What's New:
1. **TypeScript** - Type safety
2. **React hooks** - useState, useEffect
3. **API client** - Axios/Fetch
4. **Error handling** - Try/catch
5. **Loading states** - Better UX

---

## Next Steps

1. **Extract all CSS** from invoice system → Create theme.css
2. **Port components one by one** - Start with simplest (Button, Input)
3. **Build API client** - Axios with auth interceptors
4. **Create page layouts** - Dashboard, Customers, Settings
5. **Add authentication** - Login, register, protected routes

**Need help with a specific component?** Just ask! 🚀

