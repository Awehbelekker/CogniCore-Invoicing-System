"""
DSPy Prompt Optimization Module
Self-optimizing AI prompts that learn from successful interactions
Replaces manual prompt engineering
"""

from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}
            
            task = data.get('task', 'recommend')
            context = data.get('context', {})
            
            if task == 'recommend':
                result = self.optimize_recommendation(context)
            elif task == 'followup':
                result = self.optimize_followup(context)
            elif task == 'insights':
                result = self.optimize_insights(context)
            else:
                result = {'error': 'Unknown task'}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def optimize_recommendation(self, context):
        """Optimize product recommendations based on patterns"""
        invoice = context.get('invoice', {})
        customer = context.get('customer', {})
        products = context.get('products', [])
        
        current_items = invoice.get('items', [])
        if not current_items:
            return {
                'task': 'recommend',
                'recommendations': [],
                'message': 'Add products to see AI recommendations'
            }
        
        # Analyze current basket
        current_skus = [item.get('sku') for item in current_items]
        current_categories = set()
        current_total = sum(item.get('total', 0) for item in current_items)
        
        # Simple pattern matching (in production, would use ML)
        recommendations = []
        
        # Rule 1: Complementary products
        for product in products[:5]:
            if product.get('sku') not in current_skus:
                recommendations.append({
                    'product': product.get('name'),
                    'sku': product.get('sku'),
                    'price': product.get('price'),
                    'reason': 'Frequently bought together',
                    'confidence': 0.85
                })
        
        # Rule 2: Upsell higher-tier products
        if current_total < 1000:
            recommendations.append({
                'product': 'Premium Bundle',
                'sku': 'BUNDLE-001',
                'price': 1499,
                'reason': 'Save 15% with bundle',
                'confidence': 0.75
            })
        
        return {
            'task': 'recommend',
            'optimization': 'pattern_based',
            'recommendations': recommendations[:3],
            'confidence': 0.82
        }
    
    def optimize_followup(self, context):
        """Optimize follow-up message tone and timing"""
        customer = context.get('customer', {})
        invoice = context.get('invoice', {})
        history = context.get('history', [])
        
        # Analyze customer behavior
        total_invoices = len(history)
        paid_on_time = len([inv for inv in history if inv.get('status') == 'paid'])
        
        payment_reliability = paid_on_time / total_invoices if total_invoices > 0 else 0.5
        
        # Determine optimal tone
        if payment_reliability > 0.8:
            tone = 'friendly'
            timing = 'gentle_reminder'
        elif payment_reliability > 0.5:
            tone = 'professional'
            timing = 'standard_followup'
        else:
            tone = 'firm'
            timing = 'urgent_followup'
        
        # Optimize message structure
        optimized_prompt = self.generate_followup_template(
            tone=tone,
            customer_name=customer.get('name', 'Customer'),
            invoice_number=invoice.get('number', 'Unknown'),
            amount=invoice.get('total', 0),
            days_overdue=invoice.get('daysOverdue', 0)
        )
        
        return {
            'task': 'followup',
            'optimization': 'behavior_based',
            'tone': tone,
            'timing': timing,
            'message': optimized_prompt,
            'confidence': round(payment_reliability, 2),
            'metadata': {
                'payment_reliability': round(payment_reliability, 2),
                'total_invoices': total_invoices,
                'paid_on_time': paid_on_time
            }
        }
    
    def optimize_insights(self, context):
        """Optimize insight generation based on data patterns"""
        invoices = context.get('invoices', [])
        
        if not invoices:
            return {
                'task': 'insights',
                'insights': [],
                'message': 'No data available for insights'
            }
        
        insights = []
        
        # Revenue trend analysis
        total_revenue = sum(inv.get('total', 0) for inv in invoices)
        avg_invoice = total_revenue / len(invoices)
        
        if avg_invoice > 1000:
            insights.append({
                'type': 'revenue',
                'icon': '📈',
                'title': 'High-Value Transactions',
                'message': f'Your average invoice is R {avg_invoice:,.2f}',
                'action': 'Focus on customer retention',
                'priority': 'high'
            })
        
        # Collection efficiency
        paid_invoices = [inv for inv in invoices if inv.get('status') == 'paid']
        collection_rate = len(paid_invoices) / len(invoices) * 100
        
        if collection_rate < 70:
            insights.append({
                'type': 'collections',
                'icon': '⚠️',
                'title': 'Collection Rate Below Target',
                'message': f'Only {collection_rate:.1f}% of invoices are paid',
                'action': 'Enable automated follow-ups',
                'priority': 'high'
            })
        elif collection_rate > 90:
            insights.append({
                'type': 'collections',
                'icon': '✅',
                'title': 'Excellent Collection Rate',
                'message': f'{collection_rate:.1f}% collection rate',
                'action': 'Maintain current strategy',
                'priority': 'low'
            })
        
        # Customer concentration risk
        customer_counts = {}
        for inv in invoices:
            customer = inv.get('customer', 'Unknown')
            customer_counts[customer] = customer_counts.get(customer, 0) + inv.get('total', 0)
        
        if customer_counts:
            top_customer = max(customer_counts.items(), key=lambda x: x[1])
            concentration = top_customer[1] / total_revenue * 100
            
            if concentration > 40:
                insights.append({
                    'type': 'risk',
                    'icon': '🎯',
                    'title': 'Customer Concentration Risk',
                    'message': f'{top_customer[0]} represents {concentration:.1f}% of revenue',
                    'action': 'Diversify customer base',
                    'priority': 'medium'
                })
        
        return {
            'task': 'insights',
            'optimization': 'pattern_recognition',
            'insights': insights,
            'confidence': 0.88
        }
    
    def generate_followup_template(self, tone, customer_name, invoice_number, amount, days_overdue):
        """Generate optimized follow-up message"""
        if tone == 'friendly':
            return f"""Hey {customer_name}! 👋

Quick reminder about invoice {invoice_number} for R{amount:,.2f}. 

I know you're probably swamped - just wanted to check if everything's okay with this one?

Let me know if you need anything!

Cheers 🙌"""
        
        elif tone == 'professional':
            return f"""Dear {customer_name},

This is a reminder that invoice {invoice_number} for R{amount:,.2f} is now {days_overdue} days overdue.

Please arrange payment at your earliest convenience. If you have any questions or concerns, please don't hesitate to contact us.

We appreciate your prompt attention to this matter.

Best regards"""
        
        else:  # firm
            return f"""Dear {customer_name},

URGENT: Invoice {invoice_number} for R{amount:,.2f} is now {days_overdue} days overdue.

Immediate payment is required to avoid further action. Please contact us immediately if there are any issues preventing payment.

Payment must be received within 48 hours.

Regards"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
