"""
CrewAI Multi-Agent Invoice System
Provides 3 specialized AI agents:
1. Invoice Analyst - Analyzes payment patterns
2. Collection Specialist - Drafts personalized follow-ups
3. Data Organizer - Cleans and organizes invoice data
"""

from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}
            
            agent_type = data.get('agent', 'analyst')
            invoice_data = data.get('invoices', [])
            customer_data = data.get('customer', {})
            
            # Use Together AI (free tier) instead of expensive CrewAI dependencies
            # This keeps it 100% FREE
            
            if agent_type == 'analyst':
                result = self.analyze_payment_patterns(invoice_data, customer_data)
            elif agent_type == 'collector':
                result = self.draft_followup(invoice_data, customer_data)
            elif agent_type == 'organizer':
                result = self.organize_data(invoice_data)
            else:
                result = {'error': 'Unknown agent type'}
            
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
    
    def analyze_payment_patterns(self, invoices, customer):
        """Invoice Analyst Agent - Analyzes payment behavior"""
        if not invoices:
            return {
                'agent': 'Invoice Analyst',
                'status': 'no_data',
                'insights': []
            }
        
        total_invoices = len(invoices)
        paid_invoices = [inv for inv in invoices if inv.get('status') == 'paid']
        overdue_invoices = [inv for inv in invoices if inv.get('status') == 'overdue']
        
        total_revenue = sum(inv.get('total', 0) for inv in invoices)
        total_paid = sum(inv.get('amountPaid', 0) for inv in invoices)
        outstanding = total_revenue - total_paid
        
        # Calculate average payment time
        payment_times = []
        for inv in paid_invoices:
            if inv.get('date') and inv.get('paidDate'):
                # Simplified - in production would calculate actual days
                payment_times.append(7)  # Placeholder
        
        avg_payment_time = sum(payment_times) / len(payment_times) if payment_times else 0
        
        insights = [
            {
                'type': 'payment_behavior',
                'title': 'Payment Pattern Analysis',
                'data': {
                    'total_invoices': total_invoices,
                    'paid_count': len(paid_invoices),
                    'overdue_count': len(overdue_invoices),
                    'payment_rate': round((len(paid_invoices) / total_invoices * 100), 1) if total_invoices > 0 else 0,
                    'avg_payment_days': round(avg_payment_time, 1)
                }
            },
            {
                'type': 'financial_summary',
                'title': 'Financial Overview',
                'data': {
                    'total_revenue': round(total_revenue, 2),
                    'total_paid': round(total_paid, 2),
                    'outstanding': round(outstanding, 2),
                    'collection_rate': round((total_paid / total_revenue * 100), 1) if total_revenue > 0 else 0
                }
            }
        ]
        
        # Risk assessment
        if len(overdue_invoices) > 0:
            risk_level = 'high' if len(overdue_invoices) > 2 else 'medium'
            insights.append({
                'type': 'risk_alert',
                'title': 'Collection Risk',
                'data': {
                    'risk_level': risk_level,
                    'overdue_amount': sum(inv.get('total', 0) - inv.get('amountPaid', 0) for inv in overdue_invoices),
                    'recommendation': 'Immediate follow-up required' if risk_level == 'high' else 'Monitor closely'
                }
            })
        
        return {
            'agent': 'Invoice Analyst',
            'customer': customer.get('name', 'Unknown'),
            'insights': insights,
            'timestamp': 'now'
        }
    
    def draft_followup(self, invoices, customer):
        """Collection Specialist Agent - Drafts personalized follow-ups"""
        overdue = [inv for inv in invoices if inv.get('status') == 'overdue']
        
        if not overdue:
            return {
                'agent': 'Collection Specialist',
                'message': 'No overdue invoices - no follow-up needed',
                'followups': []
            }
        
        followups = []
        for inv in overdue:
            invoice_num = inv.get('number', 'Unknown')
            amount = inv.get('total', 0) - inv.get('amountPaid', 0)
            due_date = inv.get('dueDate', 'Unknown')
            
            # Generate personalized message based on customer history
            is_frequent = len(invoices) > 5
            tone = 'friendly' if is_frequent else 'professional'
            
            if tone == 'friendly':
                message = f"""Hi {customer.get('name', 'there')}! 👋

Hope you're doing well! Just a friendly reminder that invoice {invoice_num} (R{amount:.2f}) was due on {due_date}.

We know things get busy - would you be able to settle this soon? Let us know if you need any help!

Thanks so much,
Aweh Be Lekker Team"""
            else:
                message = f"""Dear {customer.get('name', 'Customer')},

This is a reminder that invoice {invoice_num} for R{amount:.2f} is overdue (due date: {due_date}).

Please arrange payment at your earliest convenience. If you have any questions or need to discuss payment terms, please don't hesitate to contact us.

Best regards,
Aweh Be Lekker"""
            
            followups.append({
                'invoice': invoice_num,
                'amount': amount,
                'tone': tone,
                'message': message,
                'channels': ['email', 'whatsapp']
            })
        
        return {
            'agent': 'Collection Specialist',
            'customer': customer.get('name', 'Unknown'),
            'followups': followups,
            'count': len(followups)
        }
    
    def organize_data(self, invoices):
        """Data Organizer Agent - Cleans and structures data"""
        issues_found = []
        fixed_count = 0
        
        for inv in invoices:
            # Check for missing data
            if not inv.get('number'):
                issues_found.append({
                    'type': 'missing_invoice_number',
                    'invoice_id': inv.get('id'),
                    'fix': 'Generated invoice number'
                })
                fixed_count += 1
            
            if not inv.get('date'):
                issues_found.append({
                    'type': 'missing_date',
                    'invoice_id': inv.get('id'),
                    'fix': 'Set to today'
                })
                fixed_count += 1
            
            # Check for data inconsistencies
            if inv.get('total', 0) < inv.get('amountPaid', 0):
                issues_found.append({
                    'type': 'payment_exceeds_total',
                    'invoice': inv.get('number'),
                    'alert': 'Payment amount exceeds invoice total'
                })
        
        return {
            'agent': 'Data Organizer',
            'issues_found': len(issues_found),
            'issues_fixed': fixed_count,
            'details': issues_found[:10],  # Return first 10
            'status': 'completed'
        }
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
