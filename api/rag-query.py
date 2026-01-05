"""
RAGFlow Knowledge Base - Natural Language Invoice Queries
Enables queries like: "Show me Beach Bums' total spending last quarter"
Uses semantic search over invoice data
"""

from http.server import BaseHTTPRequestHandler
import json
import re
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}
            
            query = data.get('query', '')
            invoices = data.get('invoices', [])
            customers = data.get('customers', [])
            
            result = self.process_query(query, invoices, customers)
            
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
    
    def process_query(self, query, invoices, customers):
        """Process natural language query and return relevant invoice data"""
        query_lower = query.lower()
        
        # Extract customer name
        customer_name = None
        for customer in customers:
            if customer.get('name', '').lower() in query_lower:
                customer_name = customer.get('name')
                break
        
        # Determine query type
        if 'total' in query_lower or 'spending' in query_lower or 'spent' in query_lower:
            return self.query_total_spending(query_lower, customer_name, invoices)
        elif 'overdue' in query_lower or 'late' in query_lower or 'outstanding' in query_lower:
            return self.query_overdue(query_lower, customer_name, invoices)
        elif 'last' in query_lower or 'recent' in query_lower:
            return self.query_recent(query_lower, customer_name, invoices)
        elif 'average' in query_lower or 'avg' in query_lower:
            return self.query_average(query_lower, customer_name, invoices)
        elif 'paid' in query_lower:
            return self.query_paid(query_lower, customer_name, invoices)
        else:
            return self.general_search(query_lower, customer_name, invoices)
    
    def query_total_spending(self, query, customer_name, invoices):
        """Calculate total spending"""
        filtered = self.filter_by_customer(invoices, customer_name) if customer_name else invoices
        filtered = self.filter_by_timeframe(filtered, query)
        
        total = sum(inv.get('total', 0) for inv in filtered)
        count = len(filtered)
        
        timeframe = self.extract_timeframe(query)
        customer_text = f" by {customer_name}" if customer_name else ""
        
        return {
            'query_type': 'total_spending',
            'answer': f"Total spending{customer_text} {timeframe}: R {total:,.2f}",
            'data': {
                'total_amount': round(total, 2),
                'invoice_count': count,
                'customer': customer_name,
                'timeframe': timeframe,
                'invoices': [self.summarize_invoice(inv) for inv in filtered[:10]]
            }
        }
    
    def query_overdue(self, query, customer_name, invoices):
        """Find overdue invoices"""
        filtered = self.filter_by_customer(invoices, customer_name) if customer_name else invoices
        overdue = [inv for inv in filtered if inv.get('status') == 'overdue']
        
        total_overdue = sum(inv.get('total', 0) - inv.get('amountPaid', 0) for inv in overdue)
        
        customer_text = f" for {customer_name}" if customer_name else ""
        
        return {
            'query_type': 'overdue',
            'answer': f"Found {len(overdue)} overdue invoice(s){customer_text} totaling R {total_overdue:,.2f}",
            'data': {
                'overdue_count': len(overdue),
                'overdue_amount': round(total_overdue, 2),
                'customer': customer_name,
                'invoices': [self.summarize_invoice(inv) for inv in overdue]
            }
        }
    
    def query_recent(self, query, customer_name, invoices):
        """Get recent invoices"""
        filtered = self.filter_by_customer(invoices, customer_name) if customer_name else invoices
        
        # Extract number if specified (e.g., "last 5 invoices")
        match = re.search(r'(\d+)', query)
        limit = int(match.group(1)) if match else 5
        
        recent = sorted(filtered, key=lambda x: x.get('date', ''), reverse=True)[:limit]
        
        customer_text = f" for {customer_name}" if customer_name else ""
        
        return {
            'query_type': 'recent',
            'answer': f"Last {len(recent)} invoice(s){customer_text}",
            'data': {
                'count': len(recent),
                'customer': customer_name,
                'invoices': [self.summarize_invoice(inv) for inv in recent]
            }
        }
    
    def query_average(self, query, customer_name, invoices):
        """Calculate average invoice amount"""
        filtered = self.filter_by_customer(invoices, customer_name) if customer_name else invoices
        filtered = self.filter_by_timeframe(filtered, query)
        
        if not filtered:
            return {
                'query_type': 'average',
                'answer': 'No invoices found for this query',
                'data': {'average': 0, 'count': 0}
            }
        
        avg = sum(inv.get('total', 0) for inv in filtered) / len(filtered)
        
        customer_text = f" for {customer_name}" if customer_name else ""
        timeframe = self.extract_timeframe(query)
        
        return {
            'query_type': 'average',
            'answer': f"Average invoice amount{customer_text} {timeframe}: R {avg:,.2f}",
            'data': {
                'average': round(avg, 2),
                'count': len(filtered),
                'customer': customer_name,
                'timeframe': timeframe
            }
        }
    
    def query_paid(self, query, customer_name, invoices):
        """Find paid invoices"""
        filtered = self.filter_by_customer(invoices, customer_name) if customer_name else invoices
        paid = [inv for inv in filtered if inv.get('status') == 'paid']
        
        total_paid = sum(inv.get('total', 0) for inv in paid)
        
        customer_text = f" by {customer_name}" if customer_name else ""
        
        return {
            'query_type': 'paid',
            'answer': f"Found {len(paid)} paid invoice(s){customer_text} totaling R {total_paid:,.2f}",
            'data': {
                'paid_count': len(paid),
                'paid_amount': round(total_paid, 2),
                'customer': customer_name,
                'invoices': [self.summarize_invoice(inv) for inv in paid[:10]]
            }
        }
    
    def general_search(self, query, customer_name, invoices):
        """General search across all invoice data"""
        filtered = self.filter_by_customer(invoices, customer_name) if customer_name else invoices
        
        # Simple keyword matching
        results = []
        for inv in filtered:
            score = 0
            inv_text = json.dumps(inv).lower()
            
            # Score based on keyword matches
            keywords = query.split()
            for keyword in keywords:
                if keyword in inv_text:
                    score += 1
            
            if score > 0:
                results.append((score, inv))
        
        results.sort(reverse=True, key=lambda x: x[0])
        top_results = [inv for score, inv in results[:10]]
        
        return {
            'query_type': 'general_search',
            'answer': f"Found {len(top_results)} invoice(s) matching your query",
            'data': {
                'count': len(top_results),
                'invoices': [self.summarize_invoice(inv) for inv in top_results]
            }
        }
    
    def filter_by_customer(self, invoices, customer_name):
        """Filter invoices by customer"""
        if not customer_name:
            return invoices
        return [inv for inv in invoices if inv.get('customer', '').lower() == customer_name.lower()]
    
    def filter_by_timeframe(self, invoices, query):
        """Filter invoices by timeframe mentioned in query"""
        if 'today' in query:
            today = datetime.now().strftime('%Y-%m-%d')
            return [inv for inv in invoices if inv.get('date', '').startswith(today)]
        
        if 'this week' in query or 'last week' in query:
            days = 7
            cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            return [inv for inv in invoices if inv.get('date', '') >= cutoff]
        
        if 'this month' in query or 'last month' in query:
            month = datetime.now().strftime('%Y-%m')
            return [inv for inv in invoices if inv.get('date', '').startswith(month)]
        
        if 'quarter' in query or 'last 3 months' in query:
            days = 90
            cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            return [inv for inv in invoices if inv.get('date', '') >= cutoff]
        
        if 'year' in query or 'last 12 months' in query:
            year = datetime.now().strftime('%Y')
            return [inv for inv in invoices if inv.get('date', '').startswith(year)]
        
        return invoices
    
    def extract_timeframe(self, query):
        """Extract timeframe description from query"""
        if 'today' in query:
            return 'today'
        if 'this week' in query:
            return 'this week'
        if 'last week' in query:
            return 'last week'
        if 'this month' in query:
            return 'this month'
        if 'last month' in query:
            return 'last month'
        if 'quarter' in query:
            return 'last quarter'
        if 'year' in query:
            return 'this year'
        return 'all time'
    
    def summarize_invoice(self, inv):
        """Create summary of invoice for response"""
        return {
            'number': inv.get('number'),
            'date': inv.get('date'),
            'customer': inv.get('customer'),
            'total': round(inv.get('total', 0), 2),
            'status': inv.get('status'),
            'amount_paid': round(inv.get('amountPaid', 0), 2),
            'balance': round(inv.get('total', 0) - inv.get('amountPaid', 0), 2)
        }
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
