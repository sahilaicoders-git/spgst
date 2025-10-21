import React, { useRef, useState, useEffect } from 'react';
import { Building, Upload, FileSpreadsheet, Edit, Trash2, Save, X, Plus } from 'lucide-react';
import './B2BSales.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const B2BSales = ({ salesEntries, onImportB2BData, selectedClient, selectedMonth }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [dbB2BEntries, setDbB2BEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [sundryDebtors, setSundryDebtors] = useState([]);
  const [showDebtorSuggestions, setShowDebtorSuggestions] = useState(false);
  const fileInputRef = useRef(null);
  const dbManager = new ClientDatabaseManager();

  // Initial form state
  const initialFormState = {
    customerGSTIN: '',
    customerName: '',
    placeOfSupply: '37-Andhra Pradesh',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'Regular B2B',
    reverseCharge: 'N',
    taxableValue: '',
    taxRate: '18',
    cgst: '0.00',
    sgst: '0.00',
    igst: '0.00',
    cessAmount: '0.00',
    totalInvoiceValue: '0.00',
    hsnCode: '',
    itemDescription: '',
    quantity: '',
    unit: 'PCS'
  };

  const [addFormData, setAddFormData] = useState(initialFormState);

  // Fetch sundry debtors when component mounts
  useEffect(() => {
    const fetchDebtors = async () => {
      if (!selectedClient) return;
      
      try {
        const response = await fetch(`http://127.0.0.1:5001/api/clients/${selectedClient}/sundry-debtors`);
        if (response.ok) {
          const data = await response.json();
          setSundryDebtors(data);
          console.log(`Loaded ${data.length} sundry debtors for autocomplete`);
        } else {
          console.error('Failed to fetch sundry debtors:', response.status);
        }
      } catch (error) {
        console.error('Error fetching sundry debtors:', error);
      }
    };
    
    fetchDebtors();
  }, [selectedClient]);

  // Indian States for Place of Supply
  const indianStates = [
    '01-Jammu and Kashmir', '02-Himachal Pradesh', '03-Punjab', '04-Chandigarh',
    '05-Uttarakhand', '06-Haryana', '07-Delhi', '08-Rajasthan',
    '09-Uttar Pradesh', '10-Bihar', '11-Sikkim', '12-Arunachal Pradesh',
    '13-Nagaland', '14-Manipur', '15-Mizoram', '16-Tripura',
    '17-Meghalaya', '18-Assam', '19-West Bengal', '20-Jharkhand',
    '21-Odisha', '22-Chhattisgarh', '23-Madhya Pradesh', '24-Gujarat',
    '25-Daman and Diu', '26-Dadra and Nagar Haveli', '27-Maharashtra', '29-Karnataka',
    '30-Goa', '31-Lakshadweep', '32-Kerala', '33-Tamil Nadu',
    '34-Puducherry', '35-Andaman and Nicobar Islands', '36-Telangana', '37-Andhra Pradesh',
    '38-Ladakh', '97-Other Territory'
  ];

  // Tax rates
  const taxRates = ['0', '0.25', '3', '5', '12', '18', '28'];

  // Invoice types
  const invoiceTypes = ['Regular B2B', 'SEZ with payment', 'SEZ without payment', 'Deemed Export'];

  // Units
  const units = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'PAIR', 'UNIT', 'DOZEN', 'BUNDLE'];

  // Auto-calculate taxes based on taxable value, tax rate, and place of supply
  const calculateTaxes = (taxableValue, taxRate, placeOfSupply, cessAmount = 0) => {
    const taxable = parseFloat(taxableValue) || 0;
    const rate = parseFloat(taxRate) || 0;
    const cess = parseFloat(cessAmount) || 0;
    
    // Check if inter-state (different state code) or intra-state (same state code 37)
    const isInterState = !placeOfSupply.startsWith('37-');
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    if (isInterState) {
      // Inter-state: Only IGST
      igst = (taxable * rate) / 100;
    } else {
      // Intra-state: CGST + SGST (split equally)
      const totalTax = (taxable * rate) / 100;
      cgst = totalTax / 2;
      sgst = totalTax / 2;
    }
    
    const totalInvoiceValue = taxable + cgst + sgst + igst + cess;
    
    return {
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2),
      totalInvoiceValue: totalInvoiceValue.toFixed(2)
    };
  };

  // Handle debtor selection for auto-fill
  const handleDebtorSelect = (debtor) => {
    const updatedForm = {
      ...addFormData,
      customerGSTIN: debtor.gstin,
      customerName: debtor.debtorName
    };
    
    // Auto-calculate taxes with the updated form
    const taxes = calculateTaxes(
      updatedForm.taxableValue,
      updatedForm.taxRate,
      updatedForm.placeOfSupply,
      updatedForm.cessAmount
    );
    
    setAddFormData({
      ...updatedForm,
      ...taxes
    });
    
    setShowDebtorSuggestions(false);
  };

  // Filter debtors based on input
  const getFilteredDebtors = (searchTerm) => {
    // If no search term, show all debtors (limited to 10)
    if (!searchTerm || searchTerm.length === 0) {
      return sundryDebtors.slice(0, 10);
    }
    
    // If search term is less than 2 characters but exists, still filter
    return sundryDebtors.filter(debtor =>
      debtor.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.gstin.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 suggestions
  };

  // Handle form field changes with auto-calculation
  const handleAddFormChange = (field, value) => {
    const updatedForm = { ...addFormData, [field]: value };
    
    // Show suggestions when typing in customer name
    if (field === 'customerName') {
      setShowDebtorSuggestions(true);
    }
    
    // Hide suggestions when typing in GSTIN
    if (field === 'customerGSTIN') {
      setShowDebtorSuggestions(false);
    }
    
    // Auto-calculate taxes when relevant fields change
    if (['taxableValue', 'taxRate', 'placeOfSupply', 'cessAmount'].includes(field)) {
      const calculated = calculateTaxes(
        updatedForm.taxableValue,
        updatedForm.taxRate,
        updatedForm.placeOfSupply,
        updatedForm.cessAmount
      );
      updatedForm.cgst = calculated.cgst;
      updatedForm.sgst = calculated.sgst;
      updatedForm.igst = calculated.igst;
      updatedForm.totalInvoiceValue = calculated.totalInvoiceValue;
    }
    
    setAddFormData(updatedForm);
  };

  // Validate GSTIN format
  const validateGSTIN = (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  // Handle save new B2B entry
  const handleSaveAddForm = async () => {
    // Validation
    if (!addFormData.customerGSTIN || !validateGSTIN(addFormData.customerGSTIN)) {
      alert('Please enter a valid GSTIN (15 characters)');
      return;
    }
    if (!addFormData.customerName) {
      alert('Please enter customer name');
      return;
    }
    if (!addFormData.invoiceNumber) {
      alert('Please enter invoice number');
      return;
    }
    if (!addFormData.taxableValue || parseFloat(addFormData.taxableValue) <= 0) {
      alert('Please enter a valid taxable value');
      return;
    }

    try {
      const newEntry = {
        customerGSTIN: addFormData.customerGSTIN,
        customerName: addFormData.customerName,
        placeOfSupply: addFormData.placeOfSupply,
        invoiceNumber: addFormData.invoiceNumber,
        invoiceDate: addFormData.invoiceDate,
        invoiceType: addFormData.invoiceType,
        reverseCharge: addFormData.reverseCharge,
        taxableValue: addFormData.taxableValue,
        taxRate: addFormData.taxRate,
        centralTax: addFormData.cgst,
        stateTax: addFormData.sgst,
        integratedTax: addFormData.igst,
        cessAmount: addFormData.cessAmount,
        invoiceValue: addFormData.totalInvoiceValue,
        hsnCode: addFormData.hsnCode,
        itemDescription: addFormData.itemDescription,
        quantity: addFormData.quantity,
        unit: addFormData.unit,
        transactionType: 'B2B',
        month: selectedMonth
      };

      // Save to database
      if (selectedClient && selectedMonth) {
        await dbManager.saveClientSale(selectedClient.id, newEntry);
        await loadB2BSalesFromDB();
        alert('B2B entry saved successfully!');
      }

      // Reset form and close modal
      setAddFormData(initialFormState);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving B2B entry:', error);
      alert('Failed to save B2B entry');
    }
  };

  // Filter B2B entries from props (for backward compatibility)
  const propB2BEntries = salesEntries ? salesEntries.filter(entry => entry.transactionType === 'B2B') : [];
  
  // Use database entries if available, otherwise fall back to prop entries
  const b2bEntries = dbB2BEntries.length > 0 ? dbB2BEntries : propB2BEntries;

  // Load B2B sales from database when client or month changes
  useEffect(() => {
    if (selectedClient && selectedMonth) {
      loadB2BSalesFromDB();
    }
  }, [selectedClient, selectedMonth]);

  const loadB2BSalesFromDB = async () => {
    if (!selectedClient || !selectedMonth) return;
    
    setIsLoading(true);
    try {
      const sales = await dbManager.getClientSales(selectedClient.id, {
        month: selectedMonth,
        transactionType: 'B2B'
      });
      setDbB2BEntries(sales);
    } catch (error) {
      console.error('Error loading B2B sales from database:', error);
      setDbB2BEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file import
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // Skip empty lines
        
        const values = line.split(',');
        if (values.length >= headers.length) {
          const entry = {};
          headers.forEach((header, index) => {
            const value = values[index] ? values[index].trim() : '';
            // Create clean field name for mapping
            const cleanHeader = header.replace(/[^a-z0-9]/g, '');
            entry[cleanHeader] = value;
          });
          data.push(entry);
        }
      }

      // Process B2B data
      const processedData = data.map((entry, index) => {
        // Extract values with proper field mapping
        const taxableValue = parseFloat(entry.taxablevalue || 0);
        const invoiceValue = parseFloat(entry.invoicevalue || 0);
        const cessAmount = parseFloat(entry.cessamount || 0);
        
        // Calculate tax amounts
        const totalTaxAmount = invoiceValue - taxableValue - cessAmount;
        
        // Determine if it's inter-state or intra-state based on place of supply
        const placeOfSupply = entry.placeofsupply || '';
        const isInterState = placeOfSupply && !placeOfSupply.includes('37-Andhra Pradesh');
        
        // Calculate CGST/SGST for intra-state or IGST for inter-state
        let centralTax = 0;
        let stateTax = 0;
        let integratedTax = 0;
        
        if (isInterState) {
          integratedTax = totalTaxAmount;
        } else {
          centralTax = totalTaxAmount / 2;
          stateTax = totalTaxAmount / 2;
        }
        
        return {
          customerGSTIN: entry.gstinuinofrecipient || '',
          customerName: entry.receivername || '',
          invoiceNumber: entry.invoicenumber || '',
          invoiceDate: entry.invoicedate || '',
          invoiceType: entry.invoicetype || 'Regular B2B',
          invoiceValue: invoiceValue.toString(),
          taxableValue: taxableValue.toString(),
          centralTax: centralTax.toFixed(2),
          stateTax: stateTax.toFixed(2),
          integratedTax: integratedTax.toFixed(2),
          hsnCode: '', // Not in the template
          quantity: '', // Not in the template
          placeOfSupply: placeOfSupply,
          reverseCharge: entry.reversecharge || 'N',
          taxRate: entry.rate || '',
          cessAmount: cessAmount.toString(),
          transactionType: 'B2B',
          id: `b2b_${Date.now()}_${index}`,
          status: 'imported'
        };
      });

      // Validate processed data
      const validEntries = processedData.filter(entry => 
        entry.customerName && entry.invoiceNumber && entry.invoiceValue
      );

      if (validEntries.length === 0) {
        alert('No valid B2B entries found. Please check your CSV format.');
        return;
      }

      // Save to database if client and month are selected
      if (selectedClient && selectedMonth) {
        try {
          // Prepare data for database
          const dbEntries = validEntries.map(entry => ({
            customerGSTIN: entry.customerGSTIN,
            customerName: entry.customerName,
            invoiceNumber: entry.invoiceNumber,
            invoiceType: entry.invoiceType,
            invoiceDate: entry.invoiceDate,
            invoiceValue: entry.invoiceValue,
            placeOfSupply: entry.placeOfSupply,
            reverseCharge: entry.reverseCharge,
            taxableValue: entry.taxableValue,
            centralTax: entry.centralTax,
            stateTax: entry.stateTax,
            integratedTax: entry.integratedTax,
            cess: entry.cessAmount,
            taxRate: entry.taxRate,
            month: selectedMonth,
            transactionType: 'B2B',
            hsnCode: entry.hsnCode,
            quantity: entry.quantity,
            unitPrice: entry.unitPrice,
            ecommerceGSTIN: entry.ecommerceGSTIN || '',
            status: 'active'
          }));

          const result = await dbManager.bulkAddClientSales(selectedClient.id, dbEntries);
          alert(`Successfully imported ${result.count} B2B sales entries to database!`);
          
          // Reload data from database
          await loadB2BSalesFromDB();
        } catch (error) {
          console.error('Error saving to database:', error);
          alert(`Error saving to database: ${error.message}`);
        }
      } else {
        // Call parent component's import function with processed data (fallback)
        if (onImportB2BData) {
          await onImportB2BData(validEntries);
          alert(`Successfully imported ${validEntries.length} B2B sales entries!`);
        } else {
          alert(`Successfully processed ${validEntries.length} B2B sales entries!`);
        }
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to import file. Please check the format and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  // Download B2B template
  const downloadTemplate = () => {
    const csvContent = [
      'GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice date,Invoice Value,Place Of Supply,Reverse Charge,Applicable % of Tax Rate,Invoice Type,E-Commerce GSTIN,Rate,Taxable Value,Cess Amount',
      '12GEOPS0823BBZH,ABC Company Ltd,INV/2024/001,14-Jul-24,50000,37-Andhra Pradesh,N,65,Regular B2B,,12,45000,756',
      '25AAAPP1234B5ZC,XYZ Industries,INV/2024/002,15-Jul-24,43000,25-Daman & Diu,N,,Regular B2B,,6,40000,',
      '12GEOPS0823BBZH,DEF Corporation,A/1003,16-Jul-24,55000,05-Uttarakhand,Y,,Regular B2B,,28,50000,6700'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'b2b-sales-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate B2B summary
  const getB2BSummary = () => {
    const summary = {
      totalInvoices: b2bEntries.length,
      totalInvoiceValue: 0,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalTax: 0
    };

    b2bEntries.forEach(entry => {
      summary.totalInvoiceValue += parseFloat(entry.invoiceValue || 0);
      summary.totalTaxableValue += parseFloat(entry.taxableValue || 0);
      summary.totalCGST += parseFloat(entry.centralTax || 0);
      summary.totalSGST += parseFloat(entry.stateTax || 0);
      summary.totalIGST += parseFloat(entry.integratedTax || 0);
    });

    summary.totalTax = summary.totalCGST + summary.totalSGST + summary.totalIGST;
    return summary;
  };

  // Handle edit entry
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditFormData({
      customerGSTIN: entry.customerGSTIN || '',
      customerName: entry.customerName || '',
      invoiceNumber: entry.invoiceNumber || '',
      invoiceDate: entry.invoiceDate || '',
      invoiceType: entry.invoiceType || 'Regular B2B',
      invoiceValue: entry.invoiceValue || '',
      taxableValue: entry.taxableValue || '',
      centralTax: entry.centralTax || '',
      stateTax: entry.stateTax || '',
      integratedTax: entry.integratedTax || '',
      cess: entry.cess || entry.cessAmount || '',
      taxRate: entry.taxRate || '',
      placeOfSupply: entry.placeOfSupply || '',
      reverseCharge: entry.reverseCharge || 'N'
    });
    setShowEditModal(true);
  };

  // Handle update entry
  const handleUpdateEntry = async () => {
    if (!editingEntry || !selectedClient) return;

    try {
      const updatedData = {
        ...editFormData,
        month: selectedMonth,
        transactionType: 'B2B'
      };

      await dbManager.updateClientSale(selectedClient.id, editingEntry.id, updatedData);
      
      // Reload data from database
      await loadB2BSalesFromDB();
      
      // Close modal
      setShowEditModal(false);
      setEditingEntry(null);
      setEditFormData({});
      
      alert('B2B entry updated successfully!');
    } catch (error) {
      console.error('Error updating B2B entry:', error);
      alert('Error updating entry. Please try again.');
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId) => {
    if (!selectedClient) return;
    
    if (window.confirm('Are you sure you want to delete this B2B entry?')) {
      try {
        await dbManager.deleteClientSale(selectedClient.id, entryId);
        
        // Reload data from database
        await loadB2BSalesFromDB();
        
        alert('B2B entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting B2B entry:', error);
        alert('Error deleting entry. Please try again.');
      }
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setEditFormData({});
  };

  const summary = getB2BSummary();

  // If showing add form, render it as a full page
  if (showAddModal) {
    return (
      <div className="add-b2b-page">
        <div className="add-b2b-page-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => setShowAddModal(false)}>
              <X size={24} />
              Back to B2B Sales
            </button>
          </div>
          <h2>Add New B2B Sales Entry</h2>
        </div>

        <div className="add-b2b-page-content">
          {/* Main Form Grid - All fields visible at once */}
          <div className="simple-form-grid">
            {/* Row 1 */}
            <div className="form-field">
              <label>Customer GSTIN *</label>
              <input
                type="text"
                value={addFormData.customerGSTIN}
                onChange={(e) => handleAddFormChange('customerGSTIN', e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                maxLength="15"
                className={addFormData.customerGSTIN && !validateGSTIN(addFormData.customerGSTIN) ? 'error' : ''}
              />
              {addFormData.customerGSTIN && !validateGSTIN(addFormData.customerGSTIN) && (
                <span className="error-text">Invalid GSTIN</span>
              )}
            </div>

            <div className="form-field debtor-autocomplete">
              <label>Customer Name * {sundryDebtors.length > 0 && <span className="debtor-count">({sundryDebtors.length} saved)</span>}</label>
              <input
                type="text"
                value={addFormData.customerName}
                onChange={(e) => handleAddFormChange('customerName', e.target.value)}
                onFocus={() => sundryDebtors.length > 0 && setShowDebtorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDebtorSuggestions(false), 200)}
                placeholder="Type name or click to see saved debtors"
              />
              {showDebtorSuggestions && getFilteredDebtors(addFormData.customerName).length > 0 && (
                <div className="debtor-suggestions">
                  {getFilteredDebtors(addFormData.customerName).map((debtor) => (
                    <div
                      key={debtor.id}
                      className="debtor-suggestion-item"
                      onClick={() => handleDebtorSelect(debtor)}
                    >
                      <div className="debtor-suggestion-name">{debtor.debtorName}</div>
                      <div className="debtor-suggestion-gstin">{debtor.gstin}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-field">
              <label>Invoice Number *</label>
              <input
                type="text"
                value={addFormData.invoiceNumber}
                onChange={(e) => handleAddFormChange('invoiceNumber', e.target.value)}
                placeholder="INV-001"
              />
            </div>

            <div className="form-field">
              <label>Invoice Date *</label>
              <input
                type="date"
                value={addFormData.invoiceDate}
                onChange={(e) => handleAddFormChange('invoiceDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Row 2 */}
            <div className="form-field">
              <label>Place of Supply *</label>
              <select
                value={addFormData.placeOfSupply}
                onChange={(e) => handleAddFormChange('placeOfSupply', e.target.value)}
              >
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Invoice Type</label>
              <select
                value={addFormData.invoiceType}
                onChange={(e) => handleAddFormChange('invoiceType', e.target.value)}
              >
                {invoiceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Reverse Charge</label>
              <select
                value={addFormData.reverseCharge}
                onChange={(e) => handleAddFormChange('reverseCharge', e.target.value)}
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>

            <div className="form-field">
              <label>HSN/SAC Code</label>
              <input
                type="text"
                value={addFormData.hsnCode}
                onChange={(e) => handleAddFormChange('hsnCode', e.target.value)}
                placeholder="998314"
                maxLength="8"
              />
            </div>

            {/* Row 3 - Tax Fields */}
            <div className="form-field">
              <label>Taxable Value (₹) *</label>
              <input
                type="number"
                value={addFormData.taxableValue}
                onChange={(e) => handleAddFormChange('taxableValue', e.target.value)}
                placeholder="10000.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-field">
              <label>Tax Rate (%)</label>
              <select
                value={addFormData.taxRate}
                onChange={(e) => handleAddFormChange('taxRate', e.target.value)}
              >
                {taxRates.map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>CGST (₹) - Auto</label>
              <input
                type="text"
                value={addFormData.cgst}
                readOnly
                className="readonly-field"
              />
            </div>

            <div className="form-field">
              <label>SGST (₹) - Auto</label>
              <input
                type="text"
                value={addFormData.sgst}
                readOnly
                className="readonly-field"
              />
            </div>

            {/* Row 4 */}
            <div className="form-field">
              <label>IGST (₹) - Auto</label>
              <input
                type="text"
                value={addFormData.igst}
                readOnly
                className="readonly-field"
              />
            </div>

            <div className="form-field">
              <label>Cess Amount (₹)</label>
              <input
                type="number"
                value={addFormData.cessAmount}
                onChange={(e) => handleAddFormChange('cessAmount', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-field">
              <label>Item Description</label>
              <input
                type="text"
                value={addFormData.itemDescription}
                onChange={(e) => handleAddFormChange('itemDescription', e.target.value)}
                placeholder="Product/Service description"
              />
            </div>

            <div className="form-field">
              <label>Quantity</label>
              <input
                type="number"
                value={addFormData.quantity}
                onChange={(e) => handleAddFormChange('quantity', e.target.value)}
                placeholder="1"
                step="0.01"
                min="0"
              />
            </div>

            {/* Row 5 */}
            <div className="form-field">
              <label>Unit</label>
              <select
                value={addFormData.unit}
                onChange={(e) => handleAddFormChange('unit', e.target.value)}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div className="form-field total-field">
              <label>Total Invoice Value (₹)</label>
              <div className="total-value">₹ {addFormData.totalInvoiceValue}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveAddForm}>
              <Save size={18} />
              Save B2B Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="b2b-sales">
      <div className="b2b-header">
        <div className="header-left">
          <div className="header-icon">
            <Building size={32} />
          </div>
          <div className="header-content">
            <h2>B2B Sales Summary</h2>
            <p>Business to Business transactions</p>
          </div>
        </div>
        <div className="header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <button 
            className="action-btn add-b2b-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Add B2B
          </button>
          <button 
            className="action-btn template-btn"
            onClick={downloadTemplate}
          >
            <FileSpreadsheet size={18} />
            Download Template
          </button>
          <button 
            className="action-btn import-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload size={18} />
            {isImporting ? 'Importing...' : 'Import B2B Data'}
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Total Invoices</div>
            <div className="card-value">{summary.totalInvoices}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Invoice Value</div>
            <div className="card-value">₹{summary.totalInvoiceValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Taxable Value</div>
            <div className="card-value">₹{summary.totalTaxableValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Total Tax</div>
            <div className="card-value">₹{summary.totalTax.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="b2b-table-container">
        <div className="table-header">
          <h3>B2B Transaction Details</h3>
          {isLoading && <div className="loading-indicator">Loading...</div>}
        </div>
        <div className="table-wrapper">
          <table className="b2b-table">
            <thead>
              <tr>
                <th>GSTIN</th>
                <th>Customer Name</th>
                <th>Invoice Number</th>
                <th>Invoice Date</th>
                <th>Invoice Type</th>
                <th>Place of Supply</th>
                <th>Tax Rate</th>
                <th>Taxable Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Cess</th>
                <th>Invoice Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {b2bEntries.length === 0 ? (
                <tr>
                  <td colSpan="14" className="no-data">
                    {isLoading ? 'Loading B2B transactions...' : 'No B2B transactions found'}
                  </td>
                </tr>
              ) : (
                b2bEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.customerGSTIN || '-'}</td>
                    <td>{entry.customerName}</td>
                    <td>{entry.invoiceNumber}</td>
                    <td>{entry.invoiceDate}</td>
                    <td>{entry.invoiceType || 'Regular B2B'}</td>
                    <td>{entry.placeOfSupply || '-'}</td>
                    <td>{entry.taxRate || '-'}%</td>
                    <td>₹{parseFloat(entry.taxableValue || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.centralTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.stateTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.integratedTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.cess || entry.cessAmount || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.invoiceValue || 0).toFixed(2)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditEntry(entry)}
                          title="Edit Entry"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteEntry(entry.id)}
                          title="Delete Entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan="7"><strong>TOTAL</strong></td>
                <td><strong>₹{summary.totalTaxableValue.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalCGST.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalSGST.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalIGST.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalTax.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalInvoiceValue.toFixed(2)}</strong></td>
                <td><strong>-</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit B2B Entry</h3>
              <button className="close-btn" onClick={closeEditModal}>
                <X />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer GSTIN</label>
                  <input
                    type="text"
                    value={editFormData.customerGSTIN}
                    onChange={(e) => setEditFormData({...editFormData, customerGSTIN: e.target.value})}
                    placeholder="Customer GSTIN"
                  />
                </div>
                
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})}
                    placeholder="Customer Name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Invoice Number *</label>
                  <input
                    type="text"
                    value={editFormData.invoiceNumber}
                    onChange={(e) => setEditFormData({...editFormData, invoiceNumber: e.target.value})}
                    placeholder="Invoice Number"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Invoice Date</label>
                  <input
                    type="date"
                    value={editFormData.invoiceDate}
                    onChange={(e) => setEditFormData({...editFormData, invoiceDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Invoice Type</label>
                  <select
                    value={editFormData.invoiceType}
                    onChange={(e) => setEditFormData({...editFormData, invoiceType: e.target.value})}
                  >
                    <option value="Regular B2B">Regular B2B</option>
                    <option value="Debit Note">Debit Note</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Invoice Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.invoiceValue}
                    onChange={(e) => setEditFormData({...editFormData, invoiceValue: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Taxable Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.taxableValue}
                    onChange={(e) => setEditFormData({...editFormData, taxableValue: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>CGST (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.centralTax}
                    onChange={(e) => setEditFormData({...editFormData, centralTax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>SGST (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.stateTax}
                    onChange={(e) => setEditFormData({...editFormData, stateTax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>IGST (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.integratedTax}
                    onChange={(e) => setEditFormData({...editFormData, integratedTax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Cess (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.cess}
                    onChange={(e) => setEditFormData({...editFormData, cess: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.taxRate}
                    onChange={(e) => setEditFormData({...editFormData, taxRate: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Place of Supply</label>
                  <input
                    type="text"
                    value={editFormData.placeOfSupply}
                    onChange={(e) => setEditFormData({...editFormData, placeOfSupply: e.target.value})}
                    placeholder="Place of Supply"
                  />
                </div>
                
                <div className="form-group">
                  <label>Reverse Charge</label>
                  <select
                    value={editFormData.reverseCharge}
                    onChange={(e) => setEditFormData({...editFormData, reverseCharge: e.target.value})}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeEditModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleUpdateEntry}>
                <Save />
                Update Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BSales;
