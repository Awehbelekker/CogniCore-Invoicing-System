// Vercel Serverless Function for Business Insights
// FREE analytics and AI-powered insights

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { invoices, customers, products, timeRange } = await req.json();

    const insights = generateBusinessInsights(
      invoices || [], 
      customers || [], 
      products || [], 
      timeRange || 30
    );

    return new Response(JSON.stringify({
      insights,
      generatedAt: new Date().toISOString(),
      timeRange: timeRange || 30
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Insights generation error:', error);
    return new Response(JSON.stringify({
      insights: [],
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateBusinessInsights(invoices, customers, products, timeRange = 30) {
  const insights = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000));

  // Filter recent invoices
  const recentInvoices = invoices.filter(inv => 
    new Date(inv.date) >= startDate
  );

  // 1. Revenue Insights
  const totalRevenue = recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidRevenue = recentInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
  const outstandingRevenue = totalRevenue - paidRevenue;

  insights.push({
    type: 'revenue',
    icon: '💰',
    title: 'Revenue Overview',
    message: `R${formatNumber(Math.round(totalRevenue))} total revenue in last ${timeRange} days. R${formatNumber(Math.round(outstandingRevenue))} outstanding.`,
    value: totalRevenue,
    trend: calculateTrend(invoices, timeRange),
    priority: outstandingRevenue > totalRevenue * 0.3 ? 'high' : 'medium'
  });

  // 2. Payment Collection Rate
  const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;
  insights.push({
    type: 'collection',
    icon: '📊',
    title: 'Payment Collection Rate',
    message: `${collectionRate.toFixed(1)}% of invoices paid. ${collectionRate < 70 ? '⚠️ Consider sending payment reminders.' : '✅ Great collection rate!'}`,
    value: collectionRate,
    priority: collectionRate < 70 ? 'high' : 'low'
  });

  // 3. Top Customers
  const customerRevenue = {};
  recentInvoices.forEach(inv => {
    if (!customerRevenue[inv.customer]) {
      customerRevenue[inv.customer] = 0;
    }
    customerRevenue[inv.customer] += inv.total || 0;
  });

  const topCustomers = Object.entries(customerRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (topCustomers.length > 0) {
    insights.push({
      type: 'customers',
      icon: '🏆',
      title: 'Top Customers',
      message: `${topCustomers[0][0]} is your #1 customer with R${formatNumber(Math.round(topCustomers[0][1]))} revenue this period.`,
      value: topCustomers,
      priority: 'medium'
    });
  }

  // 4. Product Performance
  const productSales = {};
  recentInvoices.forEach(inv => {
    inv.items?.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = { quantity: 0, revenue: 0 };
      }
      productSales[item.name].quantity += item.quantity || 0;
      productSales[item.name].revenue += item.total || 0;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .slice(0, 3);

  if (topProducts.length > 0) {
    insights.push({
      type: 'products',
      icon: '📦',
      title: 'Best Selling Products',
      message: `${topProducts[0][0]} leads with R${formatNumber(Math.round(topProducts[0][1].revenue))} in sales (${topProducts[0][1].quantity} units).`,
      value: topProducts,
      priority: 'low'
    });
  }

  // 5. Overdue Invoices Alert
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    const dueDate = new Date(inv.dueDate);
    return dueDate < now;
  });

  if (overdueInvoices.length > 0) {
    const overdueAmount = overdueInvoices.reduce((sum, inv) => 
      sum + (inv.total - (inv.amountPaid || 0)), 0
    );
    insights.push({
      type: 'alert',
      icon: '⚠️',
      title: 'Overdue Invoices',
      message: `${overdueInvoices.length} overdue invoices totaling R${formatNumber(Math.round(overdueAmount))}. Consider sending AI follow-up reminders.`,
      value: overdueInvoices.length,
      priority: 'high',
      action: 'sendFollowups',
      actionLabel: 'Send AI Follow-ups'
    });
  }

  // 6. Average Invoice Value
  const avgInvoiceValue = recentInvoices.length > 0 
    ? totalRevenue / recentInvoices.length 
    : 0;
  
  insights.push({
    type: 'metric',
    icon: '📈',
    title: 'Average Invoice Value',
    message: `R${formatNumber(Math.round(avgInvoiceValue))} per invoice. ${avgInvoiceValue > 5000 ? '💪 Strong performance!' : '💡 Consider upselling with product recommendations.'}`,
    value: avgInvoiceValue,
    priority: 'low'
  });

  // 7. Best Day of Week
  const dayRevenue = {};
  recentInvoices.forEach(inv => {
    const day = new Date(inv.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayRevenue[day] = (dayRevenue[day] || 0) + (inv.total || 0);
  });

  const bestDay = Object.entries(dayRevenue)
    .sort(([,a], [,b]) => b - a)[0];

  if (bestDay) {
    insights.push({
      type: 'trend',
      icon: '📅',
      title: 'Best Sales Day',
      message: `${bestDay[0]} generates the most revenue with R${formatNumber(Math.round(bestDay[1]))}. Schedule important sales on this day!`,
      value: bestDay[0],
      priority: 'low'
    });
  }

  // 8. Cash Flow Warning
  const unpaidTotal = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total - (inv.amountPaid || 0)), 0);
  
  if (unpaidTotal > totalRevenue) {
    insights.push({
      type: 'cashflow',
      icon: '💸',
      title: 'Cash Flow Alert',
      message: `R${formatNumber(Math.round(unpaidTotal))} in unpaid invoices - more than your recent revenue. Focus on collections!`,
      value: unpaidTotal,
      priority: 'high'
    });
  }

  return insights.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

function calculateTrend(invoices, timeRange) {
  const now = new Date();
  const midpoint = new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000 / 2));
  
  const recentRevenue = invoices
    .filter(inv => new Date(inv.date) >= midpoint)
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
  const olderRevenue = invoices
    .filter(inv => {
      const date = new Date(inv.date);
      return date < midpoint && date >= new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000));
    })
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  if (olderRevenue === 0) return 'neutral';
  const change = ((recentRevenue - olderRevenue) / olderRevenue) * 100;
  
  if (change > 10) return 'up';
  if (change < -10) return 'down';
  return 'neutral';
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
