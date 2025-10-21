import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  Building,
  Users,
  Package,
  FileText,
  Receipt
} from 'lucide-react';
import B2BSales from './B2BSales';
import B2CSales from './B2CSales';
import HSNSales from './HSNSales';
import DocumentWiseSales from './DocumentWiseSales';
import ThreeBSales from './3BSales';
import './SalesPage.css';

const SalesPage = ({ selectedClients, selectedMonth }) => {
  const [salesEntries, setSalesEntries] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [activeView, setActiveView] = useState('b2b'); // b2b, b2c, hsn, document, 3b
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [newEntry, setNewEntry] = useState({
    customerName: '',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceType: 'Regular',
    invoiceValue: '',
    taxableValue: '',
    centralTax: '',
    stateTax: '',
    integratedTax: '',
    hsnCode: '',
    quantity: '',
    transactionType: 'B2B'
  });

  // Format month year for display
  const formatMonthYear = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  // Load sales from database
  const loadSalesFromDatabase = async () => {
    if (!selectedClients || selectedClients.length === 0) return;

    try {
      const client = selectedClients[0];
      
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${client.id}/sales?month=${selectedMonth}`);
      
      if (response.ok) {
        const data = await response.json();
        setSalesEntries(data || []);
      } else {
        console.error('Failed to load sales from database');
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  // Save sales to database
  const saveSalesToDatabase = async (entries) => {
    if (!selectedClients || selectedClients.length === 0) return false;

    try {
      const client = selectedClients[0];
      
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${client.id}/sales/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: entries })
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving sales:', error);
      return false;
    }
  };

  // Save single sale to database
  const saveSaleToDatabase = async (entry) => {
    if (!selectedClients || selectedClients.length === 0) return null;

    try {
      const client = selectedClients[0];
      
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${client.id}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error saving sale:', error);
      return null;
    }
  };

  // Update sale in database
  const updateSaleInDatabase = async (id, entry) => {
    if (!selectedClients || selectedClients.length === 0) return false;

    try {
      const client = selectedClients[0];
      
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${client.id}/sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating sale:', error);
      return false;
    }
  };

  // Delete sale from database
  const deleteSaleFromDatabase = async (id) => {
    if (!selectedClients || selectedClients.length === 0) return false;

    try {
      const client = selectedClients[0];
      
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${client.id}/sales/${id}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting sale:', error);
      return false;
    }
  };

  // Load sales on mount
  useEffect(() => {
    loadSalesFromDatabase();
  }, [selectedMonth, selectedClients]);

  // Handle file import
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const entry = {};
        headers.forEach((header, index) => {
          entry[header.replace(/[^a-z0-9]/g, '')] = values[index].trim();
        });
        data.push(entry);
      }
    }

      // Process data
      const processedData = data.map((entry, index) => ({
          customerName: entry.customername || entry.customerName || '',
          invoiceNumber: entry.invoicenumber || entry.invoiceNumber || '',
          invoiceDate: entry.invoicedate || entry.invoiceDate || '',
          invoiceType: entry.invoicetype || entry.invoiceType || 'Regular',
          invoiceValue: entry.invoicevalue || entry.invoiceValue || '',
          taxableValue: entry.taxablevalue || entry.taxableValue || '',
          centralTax: entry.centraltax || entry.centralTax || '',
          stateTax: entry.statetax || entry.stateTax || '',
          integratedTax: entry.integratedtax || entry.integratedTax || '',
          hsnCode: entry.hsncode || entry.hsnCode || '',
          quantity: entry.quantity || '',
          transactionType: entry.transactiontype || entry.transactionType || 'B2B',
          id: `sale_${Date.now()}_${index}`,
        status: 'imported'
      }));

      // Save to database
      const saved = await saveSalesToDatabase(processedData);
      
      if (saved) {
        await loadSalesFromDatabase();
        alert(`Successfully imported ${processedData.length} sales entries!`);
      } else {
        setSalesEntries(prev => [...prev, ...processedData]);
        alert(`Imported ${processedData.length} entries locally (database save failed)`);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to import file. Please check the format.');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle manual entry addition
  const handleAddEntry = async () => {
    if (!newEntry.customerName || !newEntry.invoiceNumber) {
      alert('Please fill in required fields: Customer Name and Invoice Number');
      return;
    }

    const entry = {
      ...newEntry,
      id: `sale_${Date.now()}`,
      status: 'manual'
    };

    const savedId = await saveSaleToDatabase(entry);
    
    if (savedId) {
      await loadSalesFromDatabase();
    } else {
      setSalesEntries(prev => [...prev, entry]);
    }

    setNewEntry({
      customerName: '',
      invoiceNumber: '',
      invoiceDate: '',
      invoiceType: 'Regular',
      invoiceValue: '',
      taxableValue: '',
      centralTax: '',
      stateTax: '',
      integratedTax: '',
      hsnCode: '',
      quantity: '',
      transactionType: 'B2B'
    });
    setShowAddForm(false);
  };

  // Handle entry editing
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setNewEntry(entry);
    setShowAddForm(true);
  };

  // Handle entry update
  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    const updatedEntry = {
      ...newEntry,
      status: 'updated'
    };

    const updated = await updateSaleInDatabase(editingEntry.id, updatedEntry);
    
    if (updated) {
      await loadSalesFromDatabase();
    } else {
      updatedEntry.id = editingEntry.id;
      setSalesEntries(prev => 
        prev.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        )
      );
    }

    setEditingEntry(null);
    setNewEntry({
      customerName: '',
      invoiceNumber: '',
      invoiceDate: '',
      invoiceType: 'Regular',
      invoiceValue: '',
      taxableValue: '',
      centralTax: '',
      stateTax: '',
      integratedTax: '',
      hsnCode: '',
      quantity: '',
      transactionType: 'B2B'
    });
    setShowAddForm(false);
  };

  // Handle entry deletion
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const deleted = await deleteSaleFromDatabase(id);
      
      if (deleted) {
        await loadSalesFromDatabase();
      } else {
        setSalesEntries(prev => prev.filter(entry => entry.id !== id));
      }
    }
  };

  // Handle B2B data import
  const handleB2BDataImport = async (b2bData) => {
    try {
      // Save to database
      const saved = await saveSalesToDatabase(b2bData);
      
      if (saved) {
        await loadSalesFromDatabase();
      } else {
        setSalesEntries(prev => [...prev, ...b2bData]);
      }
    } catch (error) {
      console.error('Error saving B2B data:', error);
      throw error;
    }
  };

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'b2b' ? 'active' : ''}`}
            onClick={() => setActiveView('b2b')}
          >
            <Building size={16} />
            B2B Sales
          </button>
          <button
            className={`view-tab ${activeView === 'b2c' ? 'active' : ''}`}
            onClick={() => setActiveView('b2c')}
          >
            <Users size={16} />
            B2C Sales
          </button>
          <button
            className={`view-tab ${activeView === 'hsn' ? 'active' : ''}`}
            onClick={() => setActiveView('hsn')}
          >
            <Package size={16} />
            HSN Summary
          </button>
          <button
            className={`view-tab ${activeView === 'document' ? 'active' : ''}`}
            onClick={() => setActiveView('document')}
          >
            <FileText size={16} />
            Document-wise
          </button>
          <button
            className={`view-tab ${activeView === '3b' ? 'active' : ''}`}
            onClick={() => setActiveView('3b')}
          >
            <Receipt size={16} />
            3B Sales
          </button>
        </div>
      </div>

      {/* Hidden file input for imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {showAddForm && (
        <div className="add-form-overlay">
          <div className="add-form">
            <div className="form-header">
              <h3>{editingEntry ? 'Edit Sale Entry' : 'Add New Sale Entry'}</h3>
              <button 
                className="close-form-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  setNewEntry({
                    customerName: '',
                    invoiceNumber: '',
                    invoiceDate: '',
                    invoiceValue: '',
                    taxableValue: '',
                    centralTax: '',
                    stateTax: '',
                    integratedTax: '',
                    transactionType: 'B2B'
                  });
                }}
              >
                <X />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Transaction Type</label>
                <select
                  value={newEntry.transactionType}
                  onChange={(e) => setNewEntry({ ...newEntry, transactionType: e.target.value })}
                >
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>

              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={newEntry.customerName}
                  onChange={(e) => setNewEntry({ ...newEntry, customerName: e.target.value })}
                  placeholder="Customer Name"
                />
              </div>

              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  value={newEntry.invoiceNumber}
                  onChange={(e) => setNewEntry({ ...newEntry, invoiceNumber: e.target.value })}
                  placeholder="INV/2024/001"
                />
              </div>

              <div className="form-group">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={newEntry.invoiceDate}
                  onChange={(e) => setNewEntry({ ...newEntry, invoiceDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Invoice Type</label>
                <select
                  value={newEntry.invoiceType}
                  onChange={(e) => setNewEntry({ ...newEntry, invoiceType: e.target.value })}
                >
                  <option value="Regular">Regular</option>
                  <option value="SEZ">SEZ</option>
                  <option value="Export">Export</option>
                  <option value="Deemed Export">Deemed Export</option>
                </select>
              </div>

              <div className="form-group">
                <label>HSN Code</label>
                <input
                  type="text"
                  value={newEntry.hsnCode}
                  onChange={(e) => setNewEntry({ ...newEntry, hsnCode: e.target.value })}
                  placeholder="8517"
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={newEntry.quantity}
                  onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })}
                  placeholder="1"
                />
              </div>

              <div className="form-group">
                <label>Taxable Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.taxableValue}
                  onChange={(e) => setNewEntry({ ...newEntry, taxableValue: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>CGST Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.centralTax}
                  onChange={(e) => setNewEntry({ ...newEntry, centralTax: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>SGST Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.stateTax}
                  onChange={(e) => setNewEntry({ ...newEntry, stateTax: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>IGST Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.integratedTax}
                  onChange={(e) => setNewEntry({ ...newEntry, integratedTax: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Invoice Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.invoiceValue}
                  onChange={(e) => setNewEntry({ ...newEntry, invoiceValue: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={editingEntry ? handleUpdateEntry : handleAddEntry}
              >
                <Save size={16} />
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sales-content">
        {activeView === 'b2b' && <B2BSales salesEntries={salesEntries} onImportB2BData={handleB2BDataImport} selectedClient={selectedClients?.[0]} selectedMonth={selectedMonth} />}
        {activeView === 'b2c' && <B2CSales salesEntries={salesEntries} selectedClient={selectedClients?.[0]} selectedMonth={selectedMonth} />}
        {activeView === 'hsn' && (
          <HSNSales 
            salesEntries={salesEntries} 
            selectedClient={selectedClients?.[0]}
            selectedMonth={selectedMonth}
          />
        )}
        {activeView === 'document' && <DocumentWiseSales salesEntries={salesEntries} />}
        {activeView === '3b' && (
          <ThreeBSales 
            salesEntries={salesEntries} 
            selectedClient={selectedClients?.[0]}
            selectedMonth={selectedMonth}
          />
        )}
      </div>
    </div>
  );
};

export default SalesPage;

