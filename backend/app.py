from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
import uuid
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Database configuration
MAIN_DATABASE = 'gst_clients.db'
CLIENT_DB_DIR = 'client_databases'

# Create client database directory if it doesn't exist
if not os.path.exists(CLIENT_DB_DIR):
    os.makedirs(CLIENT_DB_DIR)

def init_db():
    """Initialize the main SQLite database with clients table"""
    conn = sqlite3.connect(MAIN_DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            business_name TEXT NOT NULL,
            indian_fyear TEXT NOT NULL,
            gst_type TEXT NOT NULL,
            gst_no TEXT NOT NULL,
            address TEXT,
            contact TEXT,
            return_frequency TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get main database connection"""
    conn = sqlite3.connect(MAIN_DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def sanitize_filename(name):
    """Sanitize client name for use as filename"""
    # Remove special characters and replace spaces with underscores
    sanitized = re.sub(r'[^\w\s-]', '', name)
    sanitized = re.sub(r'[-\s]+', '_', sanitized)
    return sanitized.lower()

def get_client_db_path(client_name):
    """Get the database file path for a specific client"""
    sanitized_name = sanitize_filename(client_name)
    return os.path.join(CLIENT_DB_DIR, f"{sanitized_name}.db")

def init_client_db(client_name):
    """Initialize a new SQLite database for a specific client"""
    db_path = get_client_db_path(client_name)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create purchases table for the client
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS purchases (
            id TEXT PRIMARY KEY,
            supplier_gstin TEXT NOT NULL,
            supplier_name TEXT NOT NULL,
            invoice_number TEXT NOT NULL,
            invoice_type TEXT NOT NULL,
            invoice_date TEXT NOT NULL,
            invoice_value REAL NOT NULL,
            place_of_supply TEXT NOT NULL,
            reverse_charge TEXT NOT NULL,
            taxable_value REAL NOT NULL,
            integrated_tax REAL NOT NULL,
            central_tax REAL NOT NULL,
            state_tax REAL NOT NULL,
            cess REAL NOT NULL,
            itc_available TEXT NOT NULL,
            tax_rate TEXT NOT NULL,
            month TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create sales table for the client
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            customer_gstin TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            invoice_number TEXT NOT NULL,
            invoice_type TEXT NOT NULL,
            invoice_date TEXT NOT NULL,
            invoice_value REAL NOT NULL,
            place_of_supply TEXT NOT NULL,
            reverse_charge TEXT NOT NULL,
            taxable_value REAL NOT NULL,
            integrated_tax REAL NOT NULL,
            central_tax REAL NOT NULL,
            state_tax REAL NOT NULL,
            cess REAL NOT NULL,
            tax_rate TEXT NOT NULL,
            month TEXT NOT NULL,
            transaction_type TEXT DEFAULT 'B2B',
            hsn_code TEXT,
            quantity REAL,
            unit_price REAL,
            ecommerce_gstin TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create B2C sales table for the client
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS b2c_sales (
            id TEXT PRIMARY KEY,
            month TEXT NOT NULL,
            supply_type TEXT NOT NULL,
            place_of_supply TEXT,
            gst_rate TEXT NOT NULL,
            taxable_value REAL NOT NULL,
            central_tax REAL NOT NULL,
            state_tax REAL NOT NULL,
            integrated_tax REAL NOT NULL,
            invoice_value REAL NOT NULL,
            hsn_code TEXT,
            quantity REAL,
            unit_price REAL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create GST returns table for the client
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gst_returns (
            id TEXT PRIMARY KEY,
            return_type TEXT NOT NULL,
            period TEXT NOT NULL,
            filing_date TEXT,
            status TEXT DEFAULT 'pending',
            total_taxable_value REAL DEFAULT 0,
            total_tax_payable REAL DEFAULT 0,
            total_tax_paid REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    return db_path

def get_client_db_connection(client_name):
    """Get database connection for a specific client"""
    db_path = get_client_db_path(client_name)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def generate_client_id():
    """Generate unique client ID"""
    return f"CLI_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"

@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients"""
    try:
        conn = get_db_connection()
        clients = conn.execute('SELECT * FROM clients ORDER BY created_at DESC').fetchall()
        conn.close()
        
        clients_list = []
        for client in clients:
            clients_list.append({
                'id': client['id'],
                'clientName': client['client_name'],
                'businessName': client['business_name'],
                'indianFYear': client['indian_fyear'],
                'gstType': client['gst_type'],
                'gstNo': client['gst_no'],
                'address': client['address'],
                'contact': client['contact'],
                'returnFrequency': client['return_frequency'],
                'createdAt': client['created_at'],
                'updatedAt': client['updated_at']
            })
        
        return jsonify(clients_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients', methods=['POST'])
def add_client():
    """Add a new client"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['clientName', 'businessName', 'indianFYear', 'gstType', 'gstNo', 'returnFrequency']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Generate unique ID
        client_id = generate_client_id()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO clients (id, client_name, business_name, indian_fyear, gst_type, gst_no, address, contact, return_frequency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            client_id,
            data['clientName'],
            data['businessName'],
            data['indianFYear'],
            data['gstType'],
            data['gstNo'],
            data.get('address', ''),
            data.get('contact', ''),
            data['returnFrequency']
        ))
        
        conn.commit()
        conn.close()
        
        # Create client-specific database
        try:
            db_path = init_client_db(data['clientName'])
            print(f"Created client database: {db_path}")
        except Exception as e:
            print(f"Warning: Could not create client database: {e}")
        
        return jsonify({
            'id': client_id,
            'clientName': data['clientName'],
            'businessName': data['businessName'],
            'indianFYear': data['indianFYear'],
            'gstType': data['gstType'],
            'gstNo': data['gstNo'],
            'address': data.get('address', ''),
            'contact': data.get('contact', ''),
            'returnFrequency': data['returnFrequency'],
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>', methods=['PUT'])
def update_client(client_id):
    """Update an existing client"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if client exists
        client = cursor.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        if not client:
            conn.close()
            return jsonify({'error': 'Client not found'}), 404
        
        # Update client
        cursor.execute('''
            UPDATE clients 
            SET client_name = ?, business_name = ?, indian_fyear = ?, gst_type = ?, 
                gst_no = ?, address = ?, contact = ?, return_frequency = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('clientName', client['client_name']),
            data.get('businessName', client['business_name']),
            data.get('indianFYear', client['indian_fyear']),
            data.get('gstType', client['gst_type']),
            data.get('gstNo', client['gst_no']),
            data.get('address', client['address']),
            data.get('contact', client['contact']),
            data.get('returnFrequency', client['return_frequency']),
            client_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Client updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Delete a client"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if client exists
        client = cursor.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        if not client:
            conn.close()
            return jsonify({'error': 'Client not found'}), 404
        
        # Delete client
        cursor.execute('DELETE FROM clients WHERE id = ?', (client_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Client deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/database', methods=['GET'])
def get_client_database_info(client_id):
    """Get information about a client's database"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        db_path = get_client_db_path(client['client_name'])
        db_exists = os.path.exists(db_path)
        
        return jsonify({
            'clientId': client_id,
            'clientName': client['client_name'],
            'databasePath': db_path,
            'databaseExists': db_exists,
            'databaseSize': os.path.getsize(db_path) if db_exists else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/database', methods=['POST'])
def create_client_database(client_id):
    """Create database for an existing client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        db_path = init_client_db(client['client_name'])
        
        return jsonify({
            'message': 'Client database created successfully',
            'databasePath': db_path
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/purchases', methods=['GET'])
def get_client_purchases(client_id):
    """Get purchases for a specific client, optionally filtered by month"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Get month filter from query params
        month = request.args.get('month')
        
        client_conn = get_client_db_connection(client['client_name'])
        
        if month:
            purchases = client_conn.execute(
                'SELECT * FROM purchases WHERE month = ? ORDER BY invoice_date DESC, created_at DESC',
                (month,)
            ).fetchall()
        else:
            purchases = client_conn.execute('SELECT * FROM purchases ORDER BY invoice_date DESC, created_at DESC').fetchall()
        
        client_conn.close()
        
        purchases_list = []
        for purchase in purchases:
            purchases_list.append({
                'id': purchase['id'],
                'supplierGSTIN': purchase['supplier_gstin'],
                'supplierName': purchase['supplier_name'],
                'invoiceNumber': purchase['invoice_number'],
                'invoiceType': purchase['invoice_type'],
                'invoiceDate': purchase['invoice_date'],
                'invoiceValue': purchase['invoice_value'],
                'placeOfSupply': purchase['place_of_supply'],
                'reverseCharge': purchase['reverse_charge'],
                'taxableValue': purchase['taxable_value'],
                'integratedTax': purchase['integrated_tax'],
                'centralTax': purchase['central_tax'],
                'stateTax': purchase['state_tax'],
                'cess': purchase['cess'],
                'itcAvailable': purchase['itc_available'],
                'taxRate': purchase['tax_rate'],
                'month': purchase['month'],
                'status': purchase['status'],
                'createdAt': purchase['created_at'],
                'updatedAt': purchase['updated_at']
            })
        
        return jsonify(purchases_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/purchases', methods=['POST'])
def add_client_purchase(client_id):
    """Add a new purchase entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['supplierGSTIN', 'supplierName', 'invoiceNumber', 'month']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        purchase_id = f"PUR_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        cursor.execute('''
            INSERT INTO purchases (
                id, supplier_gstin, supplier_name, invoice_number, invoice_type, 
                invoice_date, invoice_value, place_of_supply, reverse_charge, 
                taxable_value, integrated_tax, central_tax, state_tax, cess, 
                itc_available, tax_rate, month, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            purchase_id,
            data['supplierGSTIN'],
            data['supplierName'],
            data['invoiceNumber'],
            data.get('invoiceType', 'Regular'),
            data.get('invoiceDate', ''),
            float(data.get('invoiceValue', 0)),
            data.get('placeOfSupply', ''),
            data.get('reverseCharge', 'No'),
            float(data.get('taxableValue', 0)),
            float(data.get('integratedTax', 0)),
            float(data.get('centralTax', 0)),
            float(data.get('stateTax', 0)),
            float(data.get('cess', 0)),
            data.get('itcAvailable', 'Yes'),
            data.get('calculatedTaxRate', '0'),
            data['month'],
            data.get('status', 'active')
        ))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({
            'id': purchase_id,
            'message': 'Purchase added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/purchases/<purchase_id>', methods=['PUT'])
def update_client_purchase(client_id, purchase_id):
    """Update a purchase entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        # Check if purchase exists
        purchase = cursor.execute('SELECT * FROM purchases WHERE id = ?', (purchase_id,)).fetchone()
        if not purchase:
            client_conn.close()
            return jsonify({'error': 'Purchase not found'}), 404
        
        cursor.execute('''
            UPDATE purchases SET
                supplier_gstin = ?, supplier_name = ?, invoice_number = ?, 
                invoice_type = ?, invoice_date = ?, invoice_value = ?, 
                place_of_supply = ?, reverse_charge = ?, taxable_value = ?, 
                integrated_tax = ?, central_tax = ?, state_tax = ?, cess = ?, 
                itc_available = ?, tax_rate = ?, month = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('supplierGSTIN', purchase['supplier_gstin']),
            data.get('supplierName', purchase['supplier_name']),
            data.get('invoiceNumber', purchase['invoice_number']),
            data.get('invoiceType', purchase['invoice_type']),
            data.get('invoiceDate', purchase['invoice_date']),
            float(data.get('invoiceValue', purchase['invoice_value'])),
            data.get('placeOfSupply', purchase['place_of_supply']),
            data.get('reverseCharge', purchase['reverse_charge']),
            float(data.get('taxableValue', purchase['taxable_value'])),
            float(data.get('integratedTax', purchase['integrated_tax'])),
            float(data.get('centralTax', purchase['central_tax'])),
            float(data.get('stateTax', purchase['state_tax'])),
            float(data.get('cess', purchase['cess'])),
            data.get('itcAvailable', purchase['itc_available']),
            data.get('calculatedTaxRate', purchase['tax_rate']),
            data.get('month', purchase['month']),
            data.get('status', purchase['status']),
            purchase_id
        ))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({'message': 'Purchase updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/purchases/<purchase_id>', methods=['DELETE'])
def delete_client_purchase(client_id, purchase_id):
    """Delete a purchase entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        # Check if purchase exists
        purchase = cursor.execute('SELECT * FROM purchases WHERE id = ?', (purchase_id,)).fetchone()
        if not purchase:
            client_conn.close()
            return jsonify({'error': 'Purchase not found'}), 404
        
        cursor.execute('DELETE FROM purchases WHERE id = ?', (purchase_id,))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({'message': 'Purchase deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/purchases/bulk', methods=['POST'])
def bulk_add_client_purchases(client_id):
    """Bulk add purchase entries for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        purchases = data.get('purchases', [])
        
        if not purchases:
            return jsonify({'error': 'No purchases provided'}), 400
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        added_count = 0
        for purchase_data in purchases:
            try:
                purchase_id = f"PUR_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"
                
                cursor.execute('''
                    INSERT INTO purchases (
                        id, supplier_gstin, supplier_name, invoice_number, invoice_type, 
                        invoice_date, invoice_value, place_of_supply, reverse_charge, 
                        taxable_value, integrated_tax, central_tax, state_tax, cess, 
                        itc_available, tax_rate, month, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    purchase_id,
                    purchase_data.get('supplierGSTIN', ''),
                    purchase_data.get('supplierName', ''),
                    purchase_data.get('invoiceNumber', ''),
                    purchase_data.get('invoiceType', 'Regular'),
                    purchase_data.get('invoiceDate', ''),
                    float(purchase_data.get('invoiceValue', 0)),
                    purchase_data.get('placeOfSupply', ''),
                    purchase_data.get('reverseCharge', 'No'),
                    float(purchase_data.get('taxableValue', 0)),
                    float(purchase_data.get('integratedTax', 0)),
                    float(purchase_data.get('centralTax', 0)),
                    float(purchase_data.get('stateTax', 0)),
                    float(purchase_data.get('cess', 0)),
                    purchase_data.get('itcAvailable', 'Yes'),
                    purchase_data.get('calculatedTaxRate', '0'),
                    purchase_data.get('month', ''),
                    purchase_data.get('status', 'active')
                ))
                added_count += 1
            except Exception as e:
                print(f"Error adding purchase: {e}")
                continue
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({
            'message': f'Successfully added {added_count} purchases',
            'count': added_count
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# B2B Sales API Endpoints

@app.route('/api/clients/<client_id>/sales', methods=['GET'])
def get_client_sales(client_id):
    """Get sales for a specific client, optionally filtered by month and transaction type"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Get filters from query params
        month = request.args.get('month')
        transaction_type = request.args.get('transaction_type', 'B2B')
        
        client_conn = get_client_db_connection(client['client_name'])
        
        if month and transaction_type:
            sales = client_conn.execute(
                'SELECT * FROM sales WHERE month = ? AND transaction_type = ? ORDER BY invoice_date DESC, created_at DESC',
                (month, transaction_type)
            ).fetchall()
        elif month:
            sales = client_conn.execute(
                'SELECT * FROM sales WHERE month = ? ORDER BY invoice_date DESC, created_at DESC',
                (month,)
            ).fetchall()
        elif transaction_type:
            sales = client_conn.execute(
                'SELECT * FROM sales WHERE transaction_type = ? ORDER BY invoice_date DESC, created_at DESC',
                (transaction_type,)
            ).fetchall()
        else:
            sales = client_conn.execute('SELECT * FROM sales ORDER BY invoice_date DESC, created_at DESC').fetchall()
        
        client_conn.close()
        
        sales_list = []
        for sale in sales:
            sales_list.append({
                'id': sale['id'],
                'customerGSTIN': sale['customer_gstin'],
                'customerName': sale['customer_name'],
                'invoiceNumber': sale['invoice_number'],
                'invoiceType': sale['invoice_type'],
                'invoiceDate': sale['invoice_date'],
                'invoiceValue': sale['invoice_value'],
                'placeOfSupply': sale['place_of_supply'],
                'reverseCharge': sale['reverse_charge'],
                'taxableValue': sale['taxable_value'],
                'integratedTax': sale['integrated_tax'],
                'centralTax': sale['central_tax'],
                'stateTax': sale['state_tax'],
                'cess': sale['cess'],
                'taxRate': sale['tax_rate'],
                'month': sale['month'],
                'transactionType': sale['transaction_type'],
                'hsnCode': sale['hsn_code'],
                'quantity': sale['quantity'],
                'unitPrice': sale['unit_price'],
                'ecommerceGSTIN': sale['ecommerce_gstin'],
                'status': sale['status'],
                'createdAt': sale['created_at'],
                'updatedAt': sale['updated_at']
            })
        
        return jsonify(sales_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/sales', methods=['POST'])
def add_client_sale(client_id):
    """Add a new sale entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['customerName', 'invoiceNumber', 'month']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # For B2B transactions, GSTIN is required
        if data.get('transactionType') == 'B2B' and not data.get('customerGSTIN'):
            return jsonify({'error': 'customerGSTIN is required for B2B transactions'}), 400
        
        sale_id = f"SAL_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        cursor.execute('''
            INSERT INTO sales (
                id, customer_gstin, customer_name, invoice_number, invoice_type, 
                invoice_date, invoice_value, place_of_supply, reverse_charge, 
                taxable_value, integrated_tax, central_tax, state_tax, cess, 
                tax_rate, month, transaction_type, hsn_code, quantity, 
                unit_price, ecommerce_gstin, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            sale_id,
            data['customerGSTIN'],
            data['customerName'],
            data['invoiceNumber'],
            data.get('invoiceType', 'Regular'),
            data.get('invoiceDate', ''),
            float(data.get('invoiceValue', 0)),
            data.get('placeOfSupply', ''),
            data.get('reverseCharge', 'No'),
            float(data.get('taxableValue', 0)),
            float(data.get('integratedTax', 0)),
            float(data.get('centralTax', 0)),
            float(data.get('stateTax', 0)),
            float(data.get('cess', 0)),
            data.get('taxRate', '0'),
            data['month'],
            data.get('transactionType', 'B2B'),
            data.get('hsnCode', ''),
            float(data.get('quantity', 0)) if data.get('quantity') else None,
            float(data.get('unitPrice', 0)) if data.get('unitPrice') else None,
            data.get('ecommerceGSTIN', ''),
            data.get('status', 'active')
        ))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({
            'id': sale_id,
            'message': 'Sale added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/sales/<sale_id>', methods=['PUT'])
def update_client_sale(client_id, sale_id):
    """Update a sale entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        # Check if sale exists
        sale = cursor.execute('SELECT * FROM sales WHERE id = ?', (sale_id,)).fetchone()
        if not sale:
            client_conn.close()
            return jsonify({'error': 'Sale not found'}), 404
        
        cursor.execute('''
            UPDATE sales SET
                customer_gstin = ?, customer_name = ?, invoice_number = ?, 
                invoice_type = ?, invoice_date = ?, invoice_value = ?, 
                place_of_supply = ?, reverse_charge = ?, taxable_value = ?, 
                integrated_tax = ?, central_tax = ?, state_tax = ?, cess = ?, 
                tax_rate = ?, month = ?, transaction_type = ?, hsn_code = ?, 
                quantity = ?, unit_price = ?, ecommerce_gstin = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('customerGSTIN', sale['customer_gstin']),
            data.get('customerName', sale['customer_name']),
            data.get('invoiceNumber', sale['invoice_number']),
            data.get('invoiceType', sale['invoice_type']),
            data.get('invoiceDate', sale['invoice_date']),
            float(data.get('invoiceValue', sale['invoice_value'])),
            data.get('placeOfSupply', sale['place_of_supply']),
            data.get('reverseCharge', sale['reverse_charge']),
            float(data.get('taxableValue', sale['taxable_value'])),
            float(data.get('integratedTax', sale['integrated_tax'])),
            float(data.get('centralTax', sale['central_tax'])),
            float(data.get('stateTax', sale['state_tax'])),
            float(data.get('cess', sale['cess'])),
            data.get('taxRate', sale['tax_rate']),
            data.get('month', sale['month']),
            data.get('transactionType', sale['transaction_type']),
            data.get('hsnCode', sale['hsn_code']),
            float(data.get('quantity', sale['quantity'])) if data.get('quantity') else sale['quantity'],
            float(data.get('unitPrice', sale['unit_price'])) if data.get('unitPrice') else sale['unit_price'],
            data.get('ecommerceGSTIN', sale['ecommerce_gstin']),
            data.get('status', sale['status']),
            sale_id
        ))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({'message': 'Sale updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/sales/<sale_id>', methods=['DELETE'])
def delete_client_sale(client_id, sale_id):
    """Delete a sale entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        # Check if sale exists
        sale = cursor.execute('SELECT * FROM sales WHERE id = ?', (sale_id,)).fetchone()
        if not sale:
            client_conn.close()
            return jsonify({'error': 'Sale not found'}), 404
        
        cursor.execute('DELETE FROM sales WHERE id = ?', (sale_id,))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({'message': 'Sale deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/sales/bulk', methods=['POST'])
def bulk_add_client_sales(client_id):
    """Bulk add sale entries for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        sales = data.get('sales', [])
        
        if not sales:
            return jsonify({'error': 'No sales provided'}), 400
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        added_count = 0
        for sale_data in sales:
            try:
                sale_id = f"SAL_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"
                
                cursor.execute('''
                    INSERT INTO sales (
                        id, customer_gstin, customer_name, invoice_number, invoice_type, 
                        invoice_date, invoice_value, place_of_supply, reverse_charge, 
                        taxable_value, integrated_tax, central_tax, state_tax, cess, 
                        tax_rate, month, transaction_type, hsn_code, quantity, 
                        unit_price, ecommerce_gstin, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    sale_id,
                    sale_data.get('customerGSTIN', ''),
                    sale_data.get('customerName', ''),
                    sale_data.get('invoiceNumber', ''),
                    sale_data.get('invoiceType', 'Regular'),
                    sale_data.get('invoiceDate', ''),
                    float(sale_data.get('invoiceValue', 0)),
                    sale_data.get('placeOfSupply', ''),
                    sale_data.get('reverseCharge', 'No'),
                    float(sale_data.get('taxableValue', 0)),
                    float(sale_data.get('integratedTax', 0)),
                    float(sale_data.get('centralTax', 0)),
                    float(sale_data.get('stateTax', 0)),
                    float(sale_data.get('cess', 0)),
                    sale_data.get('taxRate', '0'),
                    sale_data.get('month', ''),
                    sale_data.get('transactionType', 'B2B'),
                    sale_data.get('hsnCode', ''),
                    float(sale_data.get('quantity', 0)) if sale_data.get('quantity') else None,
                    float(sale_data.get('unitPrice', 0)) if sale_data.get('unitPrice') else None,
                    sale_data.get('ecommerceGSTIN', ''),
                    sale_data.get('status', 'active')
                ))
                added_count += 1
            except Exception as e:
                print(f"Error adding sale: {e}")
                continue
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({
            'message': f'Successfully added {added_count} sales',
            'count': added_count
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# B2C Sales API Endpoints

@app.route('/api/clients/<client_id>/b2c-sales', methods=['GET'])
def get_client_b2c_sales(client_id):
    """Get B2C sales for a specific client, optionally filtered by month"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Get month filter from query params
        month = request.args.get('month')
        
        client_conn = get_client_db_connection(client['client_name'])
        
        if month:
            b2c_sales = client_conn.execute(
                'SELECT * FROM b2c_sales WHERE month = ? ORDER BY created_at DESC',
                (month,)
            ).fetchall()
        else:
            b2c_sales = client_conn.execute('SELECT * FROM b2c_sales ORDER BY created_at DESC').fetchall()
        
        client_conn.close()
        
        b2c_sales_list = []
        for sale in b2c_sales:
            b2c_sales_list.append({
                'id': sale['id'],
                'month': sale['month'],
                'supplyType': sale['supply_type'],
                'placeOfSupply': sale['place_of_supply'],
                'gstRate': sale['gst_rate'],
                'taxableValue': sale['taxable_value'],
                'centralTax': sale['central_tax'],
                'stateTax': sale['state_tax'],
                'integratedTax': sale['integrated_tax'],
                'invoiceValue': sale['invoice_value'],
                'hsnCode': sale['hsn_code'],
                'quantity': sale['quantity'],
                'unitPrice': sale['unit_price'],
                'status': sale['status'],
                'createdAt': sale['created_at'],
                'updatedAt': sale['updated_at']
            })
        
        return jsonify(b2c_sales_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/b2c-sales', methods=['POST'])
def add_client_b2c_sale(client_id):
    """Add a new B2C sale entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['month', 'supplyType', 'gstRate', 'taxableValue']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        b2c_sale_id = f"B2C_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        cursor.execute('''
            INSERT INTO b2c_sales (
                id, month, supply_type, place_of_supply, gst_rate, 
                taxable_value, central_tax, state_tax, integrated_tax, 
                invoice_value, hsn_code, quantity, unit_price, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            b2c_sale_id,
            data['month'],
            data['supplyType'],
            data.get('placeOfSupply', ''),
            data['gstRate'],
            float(data['taxableValue']),
            float(data.get('centralTax', 0)),
            float(data.get('stateTax', 0)),
            float(data.get('integratedTax', 0)),
            float(data.get('invoiceValue', data['taxableValue'])),
            data.get('hsnCode', ''),
            float(data.get('quantity', 0)) if data.get('quantity') else None,
            float(data.get('unitPrice', 0)) if data.get('unitPrice') else None,
            data.get('status', 'active')
        ))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({
            'id': b2c_sale_id,
            'message': 'B2C sale added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/b2c-sales/<b2c_sale_id>', methods=['PUT'])
def update_client_b2c_sale(client_id, b2c_sale_id):
    """Update a B2C sale entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        # Check if B2C sale exists
        b2c_sale = cursor.execute('SELECT * FROM b2c_sales WHERE id = ?', (b2c_sale_id,)).fetchone()
        if not b2c_sale:
            client_conn.close()
            return jsonify({'error': 'B2C sale not found'}), 404
        
        cursor.execute('''
            UPDATE b2c_sales SET
                month = ?, supply_type = ?, place_of_supply = ?, gst_rate = ?, 
                taxable_value = ?, central_tax = ?, state_tax = ?, integrated_tax = ?, 
                invoice_value = ?, hsn_code = ?, quantity = ?, unit_price = ?, 
                status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('month', b2c_sale['month']),
            data.get('supplyType', b2c_sale['supply_type']),
            data.get('placeOfSupply', b2c_sale['place_of_supply']),
            data.get('gstRate', b2c_sale['gst_rate']),
            float(data.get('taxableValue', b2c_sale['taxable_value'])),
            float(data.get('centralTax', b2c_sale['central_tax'])),
            float(data.get('stateTax', b2c_sale['state_tax'])),
            float(data.get('integratedTax', b2c_sale['integrated_tax'])),
            float(data.get('invoiceValue', b2c_sale['invoice_value'])),
            data.get('hsnCode', b2c_sale['hsn_code']),
            float(data.get('quantity', b2c_sale['quantity'])) if data.get('quantity') else b2c_sale['quantity'],
            float(data.get('unitPrice', b2c_sale['unit_price'])) if data.get('unitPrice') else b2c_sale['unit_price'],
            data.get('status', b2c_sale['status']),
            b2c_sale_id
        ))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({'message': 'B2C sale updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/b2c-sales/<b2c_sale_id>', methods=['DELETE'])
def delete_client_b2c_sale(client_id, b2c_sale_id):
    """Delete a B2C sale entry for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        # Check if B2C sale exists
        b2c_sale = cursor.execute('SELECT * FROM b2c_sales WHERE id = ?', (b2c_sale_id,)).fetchone()
        if not b2c_sale:
            client_conn.close()
            return jsonify({'error': 'B2C sale not found'}), 404
        
        cursor.execute('DELETE FROM b2c_sales WHERE id = ?', (b2c_sale_id,))
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({'message': 'B2C sale deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<client_id>/b2c-sales/bulk', methods=['POST'])
def bulk_add_client_b2c_sales(client_id):
    """Bulk add B2C sale entries for a client"""
    try:
        conn = get_db_connection()
        client = conn.execute('SELECT * FROM clients WHERE id = ?', (client_id,)).fetchone()
        conn.close()
        
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        data = request.get_json()
        b2c_sales = data.get('b2cSales', [])
        
        if not b2c_sales:
            return jsonify({'error': 'No B2C sales provided'}), 400
        
        client_conn = get_client_db_connection(client['client_name'])
        cursor = client_conn.cursor()
        
        added_count = 0
        for sale_data in b2c_sales:
            try:
                b2c_sale_id = f"B2C_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8].upper()}"
                
                cursor.execute('''
                    INSERT INTO b2c_sales (
                        id, month, supply_type, place_of_supply, gst_rate, 
                        taxable_value, central_tax, state_tax, integrated_tax, 
                        invoice_value, hsn_code, quantity, unit_price, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    b2c_sale_id,
                    sale_data.get('month', ''),
                    sale_data.get('supplyType', ''),
                    sale_data.get('placeOfSupply', ''),
                    sale_data.get('gstRate', ''),
                    float(sale_data.get('taxableValue', 0)),
                    float(sale_data.get('centralTax', 0)),
                    float(sale_data.get('stateTax', 0)),
                    float(sale_data.get('integratedTax', 0)),
                    float(sale_data.get('invoiceValue', 0)),
                    sale_data.get('hsnCode', ''),
                    float(sale_data.get('quantity', 0)) if sale_data.get('quantity') else None,
                    float(sale_data.get('unitPrice', 0)) if sale_data.get('unitPrice') else None,
                    sale_data.get('status', 'active')
                ))
                added_count += 1
            except Exception as e:
                print(f"Error adding B2C sale: {e}")
                continue
        
        client_conn.commit()
        client_conn.close()
        
        return jsonify({
            'message': f'Successfully added {added_count} B2C sales',
            'count': added_count
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'GST Software Backend is running'})

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully!")
    print("Starting Flask server...")
    app.run(debug=True, host='127.0.0.1', port=5001)
