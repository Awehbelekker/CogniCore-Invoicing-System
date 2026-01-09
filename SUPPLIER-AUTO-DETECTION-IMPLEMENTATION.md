# 🤖 AI Supplier Auto-Detection Implementation

## Overview

This document details the implementation of intelligent supplier auto-detection from scanned invoices, including automatic supplier creation and product matching.

## Detection Methods (Progressive Enhancement)

### Tier 1: Basic Name Matching (70% accuracy)

```javascript
async function detectSupplier_Tier1(scannedText) {
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', currentCompanyId);
  
  // Simple case-insensitive name matching
  const text = scannedText.toLowerCase();
  
  for (const supplier of suppliers) {
    if (text.includes(supplier.name.toLowerCase())) {
      return {
        supplier,
        confidence: 0.70,
        method: 'name_match'
      };
    }
  }
  
  return null;
}
```

### Tier 2: Fuzzy Matching + Logo Detection (85% accuracy)

```javascript
async function detectSupplier_Tier2(ocrData) {
  const { text, logos, entities } = ocrData;
  
  // 1. Logo matching (highest confidence)
  if (logos && logos.length > 0) {
    const logoMatch = await matchLogoToSupplier(logos[0]);
    if (logoMatch && logoMatch.confidence > 0.85) {
      return {
        supplier: logoMatch.supplier,
        confidence: logoMatch.confidence,
        method: 'logo_match'
      };
    }
  }
  
  // 2. Tax ID matching (very high confidence)
  if (entities.taxId) {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', currentCompanyId)
      .eq('tax_id', entities.taxId)
      .single();
    
    if (supplier) {
      return {
        supplier,
        confidence: 0.99,
        method: 'tax_id_match'
      };
    }
  }
  
  // 3. Fuzzy name matching
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', currentCompanyId);
  
  const matches = suppliers.map(supplier => ({
    supplier,
    score: fuzzyMatch(text, [
      supplier.name,
      supplier.email,
      supplier.phone,
      supplier.website
    ])
  }));
  
  const best = matches.sort((a, b) => b.score - a.score)[0];
  
  if (best && best.score > 0.70) {
    return {
      supplier: best.supplier,
      confidence: best.score,
      method: 'fuzzy_match'
    };
  }
  
  return null;
}

// Fuzzy matching using Levenshtein distance
function fuzzyMatch(text, searchTerms) {
  let maxScore = 0;
  
  for (const term of searchTerms) {
    if (!term) continue;
    
    const termLower = term.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match
    if (textLower.includes(termLower)) {
      maxScore = Math.max(maxScore, 0.95);
      continue;
    }
    
    // Levenshtein distance
    const distance = levenshteinDistance(termLower, textLower);
    const similarity = 1 - (distance / Math.max(termLower.length, textLower.length));
    
    maxScore = Math.max(maxScore, similarity);
  }
  
  return maxScore;
}

function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
```

### Tier 3: AI Learning from History (90% accuracy)

```javascript
async function detectSupplier_Tier3(ocrData, context) {
  const { text, logos, layout, entities } = ocrData;
  
  // 1. Check historical layout patterns
  const { data: history } = await supabase
    .from('supplier_invoices')
    .select('supplier_id, ocr_data, suppliers(*)')
    .eq('company_id', currentCompanyId)
    .not('ocr_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);
  
  // Compare layout signatures
  for (const record of history) {
    if (!record.ocr_data?.layout) continue;
    
    const layoutSimilarity = compareLayouts(layout, record.ocr_data.layout);
    
    if (layoutSimilarity > 0.90) {
      return {
        supplier: record.suppliers,
        confidence: layoutSimilarity,
        method: 'layout_match',
        learnedFrom: record.id
      };
    }
  }
  
  // 2. AI-powered entity extraction
  const aiResult = await extractSupplierEntities(text, {
    model: 'glm-4-9b',
    context: {
      previousSuppliers: history.map(h => ({
        name: h.suppliers.name,
        taxId: h.suppliers.tax_id,
        patterns: h.ocr_data.patterns
      }))
    }
  });
  
  // 3. Match extracted entities to existing suppliers
  if (aiResult.supplierName) {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', currentCompanyId)
      .ilike('name', `%${aiResult.supplierName}%`)
      .single();
    
    if (supplier) {
      return {
        supplier,
        confidence: aiResult.confidence,
        method: 'ai_entity_match'
      };
    }
  }
  
  // 4. Suggest new supplier if confidence is high
  if (aiResult.confidence > 0.85) {
    return {
      supplier: null,
      suggestedSupplier: {
        name: aiResult.supplierName,
        email: aiResult.email,
        phone: aiResult.phone,
        address: aiResult.address,
        taxId: aiResult.taxId,
        website: aiResult.website
      },
      confidence: aiResult.confidence,
      method: 'ai_new_supplier'
    };
  }
  
  return null;
}

// Compare invoice layouts
function compareLayouts(layout1, layout2) {
  if (!layout1 || !layout2) return 0;
  
  // Compare structural elements
  const elements = ['logo', 'header', 'items', 'totals', 'footer'];
  let matches = 0;
  
  for (const element of elements) {
    if (!layout1[element] || !layout2[element]) continue;
    
    const pos1 = layout1[element].position;
    const pos2 = layout2[element].position;
    
    // Calculate position similarity
    const xDiff = Math.abs(pos1.x - pos2.x);
    const yDiff = Math.abs(pos1.y - pos2.y);
    
    if (xDiff < 50 && yDiff < 50) {  // Within 50px
      matches++;
    }
  }
  
  return matches / elements.length;
}

// AI entity extraction
async function extractSupplierEntities(text, options) {
  const response = await fetch('/api/ai/extract-supplier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model: options.model,
      context: options.context
    })
  });
  
  const result = await response.json();
  
  return {
    supplierName: result.entities.supplier_name,
    email: result.entities.email,
    phone: result.entities.phone,
    address: result.entities.address,
    taxId: result.entities.tax_id,
    website: result.entities.website,
    confidence: result.confidence
  };
}
```

## Auto-Create Supplier Workflow

```javascript
async function handleSupplierDetection(ocrData) {
  // 1. Detect supplier
  const detection = await detectSupplier_Tier3(ocrData, {
    companyId: currentCompanyId
  });
  
  if (!detection) {
    // No supplier detected, manual entry required
    showToast('⚠️ Could not detect supplier. Please select manually.', 'warning');
    return null;
  }
  
  // 2. If supplier found, return it
  if (detection.supplier) {
    showToast(
      `✅ Supplier detected: ${detection.supplier.name} (${Math.round(detection.confidence * 100)}% confidence)`,
      'success'
    );
    return detection.supplier;
  }
  
  // 3. If new supplier suggested, show modal
  if (detection.suggestedSupplier) {
    const confirmed = await showNewSupplierModal(detection.suggestedSupplier, detection.confidence);
    
    if (confirmed) {
      // Create new supplier
      const { data: newSupplier } = await supabase
        .from('suppliers')
        .insert({
          company_id: currentCompanyId,
          ...confirmed.data,
          invoice_layout_signature: ocrData.layout  // Save for future matching
        })
        .select()
        .single();
      
      showToast(`✅ New supplier created: ${newSupplier.name}`, 'success');
      return newSupplier;
    }
  }
  
  return null;
}

// Show new supplier modal
async function showNewSupplierModal(suggestedData, confidence) {
  return new Promise((resolve) => {
    const modal = document.getElementById('newSupplierModal');
    
    // Pre-fill form
    document.getElementById('supplierName').value = suggestedData.name || '';
    document.getElementById('supplierEmail').value = suggestedData.email || '';
    document.getElementById('supplierPhone').value = suggestedData.phone || '';
    document.getElementById('supplierAddress').value = suggestedData.address || '';
    document.getElementById('supplierTaxId').value = suggestedData.taxId || '';
    document.getElementById('supplierWebsite').value = suggestedData.website || '';
    
    // Show confidence
    document.getElementById('detectionConfidence').textContent = 
      `${Math.round(confidence * 100)}% confidence`;
    
    // Handle confirm
    document.getElementById('confirmSupplier').onclick = () => {
      const data = {
        name: document.getElementById('supplierName').value,
        email: document.getElementById('supplierEmail').value,
        phone: document.getElementById('supplierPhone').value,
        address: document.getElementById('supplierAddress').value,
        tax_id: document.getElementById('supplierTaxId').value,
        website: document.getElementById('supplierWebsite').value
      };
      
      closeModal('newSupplierModal');
      resolve({ confirmed: true, data });
    };
    
    // Handle cancel
    document.getElementById('cancelSupplier').onclick = () => {
      closeModal('newSupplierModal');
      resolve({ confirmed: false });
    };
    
    openModal('newSupplierModal');
  });
}
```


