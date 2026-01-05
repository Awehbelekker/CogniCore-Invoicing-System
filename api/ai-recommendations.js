// Vercel Serverless Function for AI Product Recommendations
// FREE smart recommendations using rule-based AI

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { customerHistory, currentItems, products, customerTier, paymentRate } = await req.json();

    // Smart rule-based recommendations (instant, free, effective)
    const recommendations = generateSmartRecommendations(
      customerHistory || [],
      currentItems || [],
      products || [],
      customerTier || 'retail',
      paymentRate || 100
    );

    return new Response(JSON.stringify({
      recommendations,
      source: 'smart-rules',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(JSON.stringify({
      recommendations: [],
      error: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateSmartRecommendations(customerHistory, currentItems, products, customerTier = 'retail', paymentRate = 100) {
  const recommendations = [];
  const currentCategories = currentItems.map(item => item.category);
  const currentSkus = currentItems.map(item => item.sku);
  
  // Filter products by customer tier
  const tierProducts = products.filter(p => {
    if (customerTier === 'platinum') return p.landedCost > 150000; // Premium only
    if (customerTier === 'gold') return p.landedCost > 80000; // Mid to high
    if (customerTier === 'silver') return p.landedCost < 200000; // Value range
    return true; // Retail gets all
  });

  // Rule 1: Frequently bought together
  const boughtTogether = {
    'Jetboards': ['Batteries', 'Charger', 'Remote Control', 'Safety Gear'],
    'eFoils': ['Battery Pack', 'Charger', 'Safety Gear', 'Board Bag', 'Wing'],
    'SUP': ['Paddle', 'Pump', 'Repair Kit', 'Board Bag', 'Leash'],
    'Batteries': ['Charger', 'Power Adapter', 'Battery Case'],
    'Accessories': ['Maintenance Kit', 'Cleaning Solution'],
  };

  currentCategories.forEach(category => {
    const related = boughtTogether[category] || [];
    related.forEach(relatedCategory => {
      const relatedProducts = products.filter(p => 
        (p.category === relatedCategory || p.name.toLowerCase().includes(relatedCategory.toLowerCase())) && 
        !currentSkus.includes(p.sku)
      );
      recommendations.push(...relatedProducts.slice(0, 2));
    });
  });

  // Rule 2: Customer purchase history patterns
  if (customerHistory && customerHistory.length > 0) {
    const previousCategories = customerHistory.map(item => item.category);
    const categoryFrequency = {};
    
    previousCategories.forEach(cat => {
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });
    
    const topCategories = Object.entries(categoryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    
    topCategories.forEach(cat => {
      const categoryProducts = products.filter(p => 
        p.category === cat && 
        !currentSkus.includes(p.sku)
      );
      recommendations.push(...categoryProducts.slice(0, 1));
    });
  }

  // Rule 3: High-margin products (only for customers with good payment history)
  if (paymentRate >= 70) {
    const highMargin = tierProducts
      .filter(p => !currentSkus.includes(p.sku))
      .sort((a, b) => {
        const marginA = (a.sellingPrice || 0) - (a.landedCost || 0);
        const marginB = (b.sellingPrice || 0) - (b.landedCost || 0);
        return marginB - marginA;
      })
      .slice(0, 2);
    
    recommendations.push(...highMargin);
  } else {
    // For lower payment rates, suggest affordable essentials only
    const essentials = tierProducts
      .filter(p => p.category === 'Accessories' && !currentSkus.includes(p.sku))
      .slice(0, 2);
    
    recommendations.push(...essentials);
  }

  // Rule 4: Popular products (if we have sales data)
  const popularProducts = products
    .filter(p => !currentSkus.includes(p.sku))
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 2);
  
  recommendations.push(...popularProducts);

  // Remove duplicates and limit to 5
  const uniqueRecommendations = Array.from(
    new Map(recommendations.map(item => [item.sku, item])).values()
  ).slice(0, 5);

  return uniqueRecommendations.map(product => ({
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.landedCost,
    reason: getRecommendationReason(product, currentCategories, customerHistory)
  }));
}

function getRecommendationReason(product, currentCategories, customerHistory) {
  // Determine why this product is recommended
  const boughtTogether = {
    'Jetboards': ['Batteries', 'Charger', 'Remote Control', 'Safety Gear'],
    'eFoils': ['Battery Pack', 'Charger', 'Safety Gear', 'Board Bag'],
    'SUP': ['Paddle', 'Pump', 'Repair Kit', 'Board Bag'],
  };

  for (const cat of currentCategories) {
    const related = boughtTogether[cat] || [];
    if (related.some(r => product.category === r || product.name.toLowerCase().includes(r.toLowerCase()))) {
      return `Frequently bought with ${cat}`;
    }
  }

  if (customerHistory?.some(item => item.category === product.category)) {
    return 'Based on your purchase history';
  }

  return 'Popular choice';
}
