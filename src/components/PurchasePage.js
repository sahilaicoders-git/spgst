import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Download,
  AlertCircle,
  Calendar,
  Building,
  Hash,
  Users,
  Database
} from 'lucide-react';
import './PurchasePage.css';

/**
 * PurchasePage Component
 * 
 * Features:
 * - Excel file import with automatic purchase fetching
 * - Manual purchase entry addition
 * - Purchase data management and editing
 * - Automatic fetching of all purchases after Excel import
 * - Loading states for import and fetch operations
 */
const API_BASE_URL = 'http://127.0.0.1:5001/api';

const PurchasePage = ({ selectedClients, selectedMonth }) => {
  const [purchaseEntries, setPurchaseEntries] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isFetchingPurchases, setIsFetchingPurchases] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [collapsedSuppliers, setCollapsedSuppliers] = useState({});
  const [newEntry, setNewEntry] = useState({
    supplierGSTIN: '',
    supplierName: '',
    invoiceNumber: '',
    invoiceType: 'Regular',
    invoiceDate: '',
    invoiceValue: '',
    placeOfSupply: 'Maharashtra',
    reverseCharge: 'No',
    taxableValue: '',
    integratedTax: '',
    centralTax: '',
    stateTax: '',
    cess: '',
    itcAvailable: 'Yes',
    taxRate: '100%'
  });
  const fileInputRef = useRef(null);

  // Load purchases from database on component mount
  useEffect(() => {
    if (selectedClients && selectedClients.length > 0 && selectedMonth) {
      loadPurchasesFromDatabase();
    }
  }, [selectedClients, selectedMonth]);

  // Set all suppliers as collapsed by default when group view is enabled
  useEffect(() => {
    if (groupBySupplier && purchaseEntries.length > 0) {
      const groupedSuppliers = groupEntriesBySupplier();
      const defaultCollapsedState = {};
      groupedSuppliers.forEach(supplier => {
        const supplierKey = `${supplier.supplierGSTIN}_${supplier.supplierName}`;
        defaultCollapsedState[supplierKey] = true; // All collapsed by default
      });
      setCollapsedSuppliers(defaultCollapsedState);
    }
  }, [groupBySupplier, purchaseEntries]);

  const formatMonthYear = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  // Load purchases from database for selected client and month
  const loadPurchasesFromDatabase = async () => {
    if (!selectedClients || selectedClients.length === 0) return;
    
    setIsFetchingPurchases(true);
    try {
      const clientId = selectedClients[0].id;
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/purchases?month=${selectedMonth}`);
      
      if (!response.ok) {
        throw new Error('Failed to load purchases');
      }
      
      const data = await response.json();
      
      // Transform the data from database format to component format
      const transformedData = data.map(purchase => ({
        ...purchase,
        id: purchase.id,
        supplierGSTIN: purchase.supplierGSTIN,
        supplierName: purchase.supplierName,
        invoiceNumber: purchase.invoiceNumber,
        invoiceType: purchase.invoiceType,
        invoiceDate: purchase.invoiceDate,
        invoiceValue: purchase.invoiceValue,
        placeOfSupply: purchase.placeOfSupply,
        reverseCharge: purchase.reverseCharge,
        taxableValue: purchase.taxableValue,
        integratedTax: purchase.integratedTax,
        centralTax: purchase.centralTax,
        stateTax: purchase.stateTax,
        cess: purchase.cess,
        itcAvailable: purchase.itcAvailable,
        calculatedTaxRate: purchase.taxRate,
        month: purchase.month,
        status: purchase.status || 'imported'
      }));
      
      setPurchaseEntries(transformedData);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setIsFetchingPurchases(false);
    }
  };

  // Save purchases to database (bulk save after import)
  const savePurchasesToDatabase = async (purchasesData) => {
    if (!selectedClients || selectedClients.length === 0) return false;
    
    try {
      const clientId = selectedClients[0].id;
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/purchases/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchases: purchasesData }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save purchases');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving purchases:', error);
      return false;
    }
  };

  // Save single purchase to database
  const savePurchaseToDatabase = async (purchaseData) => {
    if (!selectedClients || selectedClients.length === 0) return null;
    
    try {
      const clientId = selectedClients[0].id;
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save purchase');
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error saving purchase:', error);
      return null;
    }
  };

  // Update purchase in database
  const updatePurchaseInDatabase = async (purchaseId, purchaseData) => {
    if (!selectedClients || selectedClients.length === 0) return false;
    
    try {
      const clientId = selectedClients[0].id;
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update purchase');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating purchase:', error);
      return false;
    }
  };

  // Delete purchase from database
  const deletePurchaseFromDatabase = async (purchaseId) => {
    if (!selectedClients || selectedClients.length === 0) return false;
    
    try {
      const clientId = selectedClients[0].id;
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/purchases/${purchaseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete purchase');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting purchase:', error);
      return false;
    }
  };

  // Calculate tax rate based on taxable value and GST amounts
  const calculateTaxRate = (entry) => {
    const taxableValue = parseFloat(entry.taxableValue || 0);
    const centralTax = parseFloat(entry.centralTax || 0);
    const stateTax = parseFloat(entry.stateTax || 0);
    const integratedTax = parseFloat(entry.integratedTax || 0);
    
    if (taxableValue === 0) return '0';
    
    const totalGST = centralTax + stateTax + integratedTax;
    const taxRate = (totalGST / taxableValue) * 100;
    
    // Round to nearest standard GST rate (5, 12, 18, 28) or return calculated value
    const standardRates = [0, 5, 12, 18, 28];
    const closestRate = standardRates.reduce((prev, curr) => 
      Math.abs(curr - taxRate) < Math.abs(prev - taxRate) ? curr : prev
    );
    
    // If the calculated rate is very close to a standard rate (within 0.5%), return the standard rate
    if (Math.abs(closestRate - taxRate) <= 0.5) {
      return closestRate.toString();
    }
    
    return taxRate.toFixed(2);
  };

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = `Supplier GSTIN,Supplier Name,Invoice Number,Invoice Type,Invoice Date,Invoice Value,Place of Supply,Reverse Charge,Taxable Value,Integrated Tax,Central Tax,State Tax,Cess,ITC Available,Tax Rate`;

    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'purchase-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Purchase template downloaded successfully');
  };

  // Handle Excel file import
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      // Parse CSV file
      const text = await file.text();
      console.log('CSV file content:', text);
      const lines = text.split('\n').filter(line => line.trim() !== '');
      console.log('CSV lines:', lines);
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      
      // Helper function to parse CSV line properly handling quoted fields
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };
      
      // Parse header row
      const headers = parseCSVLine(lines[0]);
      
      // Expected headers mapping
      const headerMapping = {
        'Supplier GSTIN': 'supplierGSTIN',
        'Supplier Name': 'supplierName',
        'Invoice Number': 'invoiceNumber',
        'Invoice Type': 'invoiceType',
        'Invoice Date': 'invoiceDate',
        'Invoice Value': 'invoiceValue',
        'Place of Supply': 'placeOfSupply',
        'Reverse Charge': 'reverseCharge',
        'Taxable Value': 'taxableValue',
        'Integrated Tax': 'integratedTax',
        'Central Tax': 'centralTax',
        'State Tax': 'stateTax',
        'Cess': 'cess',
        'ITC Available': 'itcAvailable',
        'Tax Rate': 'taxRate'
      };
      
      // Parse data rows
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`);
          continue;
        }
        
        const rowData = {};
        headers.forEach((header, index) => {
          const mappedKey = headerMapping[header];
          if (mappedKey) {
            rowData[mappedKey] = values[index] || '';
          }
        });
        
        // Only add rows that have required fields
        if (rowData.supplierGSTIN && rowData.supplierName && rowData.invoiceNumber) {
          // Clean up the data - remove quotes if present
          Object.keys(rowData).forEach(key => {
            if (typeof rowData[key] === 'string') {
              rowData[key] = rowData[key].replace(/^"(.*)"$/, '$1');
            }
          });
          parsedData.push(rowData);
        } else {
          console.warn(`Row ${i + 1} missing required fields. Skipping.`);
        }
      }
      
      if (parsedData.length === 0) {
        throw new Error('No valid data rows found in the CSV file');
      }
      
      console.log(`Successfully parsed ${parsedData.length} purchase entries from CSV`);
      console.log('Parsed data:', parsedData);
      
      // Add unique IDs, processing status, and calculate tax rate
      const processedData = parsedData.map((entry, index) => {
        // Extract month from invoice date (format: YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
        let entryMonth = selectedMonth; // Default to selected month if date is invalid
        
        if (entry.invoiceDate) {
          try {
            let parsedDate;
            
            // Try to parse different date formats
            if (entry.invoiceDate.includes('-')) {
              const parts = entry.invoiceDate.split('-');
              if (parts[0].length === 4) {
                // Format: YYYY-MM-DD
                parsedDate = new Date(entry.invoiceDate);
              } else {
                // Format: DD-MM-YYYY
                parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              }
            } else if (entry.invoiceDate.includes('/')) {
              const parts = entry.invoiceDate.split('/');
              // Format: DD/MM/YYYY
              parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              parsedDate = new Date(entry.invoiceDate);
            }
            
            // Extract YYYY-MM from the date
            if (!isNaN(parsedDate.getTime())) {
              const year = parsedDate.getFullYear();
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              entryMonth = `${year}-${month}`;
            }
          } catch (error) {
            console.warn(`Could not parse date: ${entry.invoiceDate}, using selected month`);
          }
        }
        
        const entryWithId = {
        ...entry,
        id: `purchase_${Date.now()}_${index}`,
        status: 'imported',
        importedAt: new Date().toISOString(),
          month: entryMonth // Use the extracted month from invoice date
        };
        
        // Calculate and add tax rate
        entryWithId.calculatedTaxRate = calculateTaxRate(entryWithId);
        
        return entryWithId;
      });

      console.log('Processed data:', processedData);
      
      // Group by month to show user which months the data belongs to
      const monthGroups = {};
      processedData.forEach(entry => {
        if (!monthGroups[entry.month]) {
          monthGroups[entry.month] = 0;
        }
        monthGroups[entry.month]++;
      });
      
      const monthSummary = Object.entries(monthGroups)
        .map(([month, count]) => `${month}: ${count} entries`)
        .join('\n');
      
      // Save to database
      const saved = await savePurchasesToDatabase(processedData);
      
      if (saved) {
        // Reload from database to ensure consistency (filtered by current selected month)
        await loadPurchasesFromDatabase();
        
        const currentMonthCount = monthGroups[selectedMonth] || 0;
        
        alert(
          `Successfully imported ${processedData.length} purchase entries!\n\n` +
          `Data distributed by month:\n${monthSummary}\n\n` +
          `Showing ${currentMonthCount} entries for selected month: ${formatMonthYear(selectedMonth)}`
        );
      } else {
        // Fallback to local state if database save fails
      setPurchaseEntries(prev => {
        const updated = [...prev, ...processedData];
        console.log('Total entries after import:', updated.length);
        return updated;
      });
        alert(`Imported ${processedData.length} entries locally (database save failed)`);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('Excel import completed successfully. Imported entries:', processedData.length);
      
    } catch (error) {
      console.error('Error importing file:', error);
      alert(`Error importing file: ${error.message}. Please check the file format and try again.`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle manual entry addition
  const handleAddEntry = async () => {
    if (!newEntry.supplierGSTIN || !newEntry.supplierName || !newEntry.invoiceNumber) {
      alert('Please fill in required fields: Supplier GSTIN, Name, and Invoice Number');
      return;
    }

    // Extract month from invoice date if available
    let entryMonth = selectedMonth; // Default to selected month
    
    if (newEntry.invoiceDate) {
      try {
        const parsedDate = new Date(newEntry.invoiceDate);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          entryMonth = `${year}-${month}`;
        }
      } catch (error) {
        console.warn('Could not parse invoice date, using selected month');
      }
    }

    const entry = {
      ...newEntry,
      status: 'manual',
      addedAt: new Date().toISOString(),
      month: entryMonth, // Use the extracted month from invoice date
      calculatedTaxRate: calculateTaxRate(newEntry)
    };

    // Save to database
    const savedId = await savePurchaseToDatabase(entry);
    
    if (savedId) {
      // Reload from database
      await loadPurchasesFromDatabase();
      
      // Notify user if entry was saved to a different month
      if (entryMonth !== selectedMonth) {
        alert(
          `Entry saved successfully!\n\n` +
          `Note: This entry was saved to ${formatMonthYear(entryMonth)} based on the invoice date.\n` +
          `You are currently viewing ${formatMonthYear(selectedMonth)}.`
        );
      }
    } else {
      // Fallback to local state
      entry.id = `purchase_${Date.now()}`;
    setPurchaseEntries(prev => [...prev, entry]);
    }
    setNewEntry({
      supplierGSTIN: '',
      supplierName: '',
      invoiceNumber: '',
      invoiceType: 'Regular',
      invoiceDate: '',
      invoiceValue: '',
      placeOfSupply: 'Maharashtra',
      reverseCharge: 'No',
      taxableValue: '',
      integratedTax: '',
      centralTax: '',
      stateTax: '',
      cess: '',
      itcAvailable: 'Yes',
      taxRate: '100%'
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

    // Extract month from invoice date if available
    let entryMonth = editingEntry.month || selectedMonth; // Keep original month if available
    
    if (newEntry.invoiceDate) {
      try {
        const parsedDate = new Date(newEntry.invoiceDate);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          entryMonth = `${year}-${month}`;
        }
      } catch (error) {
        console.warn('Could not parse invoice date, using existing month');
      }
    }

    const updatedEntry = {
      ...newEntry,
      status: 'updated',
      updatedAt: new Date().toISOString(),
      month: entryMonth, // Use the extracted month from invoice date
      calculatedTaxRate: calculateTaxRate(newEntry)
    };

    // Update in database
    const updated = await updatePurchaseInDatabase(editingEntry.id, updatedEntry);
    
    if (updated) {
      // Reload from database
      await loadPurchasesFromDatabase();
      
      // Notify user if entry was moved to a different month
      const originalMonth = editingEntry.month;
      if (entryMonth !== originalMonth && entryMonth !== selectedMonth) {
        alert(
          `Entry updated successfully!\n\n` +
          `Note: This entry was moved to ${formatMonthYear(entryMonth)} based on the invoice date.\n` +
          `You are currently viewing ${formatMonthYear(selectedMonth)}.`
        );
      }
    } else {
      // Fallback to local state
      updatedEntry.id = editingEntry.id;
    setPurchaseEntries(prev => 
      prev.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
      )
    );
    }

    setEditingEntry(null);
    setNewEntry({
      supplierGSTIN: '',
      supplierName: '',
      invoiceNumber: '',
      invoiceType: 'Regular',
      invoiceDate: '',
      invoiceValue: '',
      placeOfSupply: 'Maharashtra',
      reverseCharge: 'No',
      taxableValue: '',
      integratedTax: '',
      centralTax: '',
      stateTax: '',
      cess: '',
      itcAvailable: 'Yes',
      taxRate: '100%'
    });
    setShowAddForm(false);
  };

  // Handle entry deletion
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase entry?')) {
      // Delete from database
      const deleted = await deletePurchaseFromDatabase(id);
      
      if (deleted) {
        // Reload from database
        await loadPurchasesFromDatabase();
      } else {
        // Fallback to local state
      setPurchaseEntries(prev => prev.filter(entry => entry.id !== id));
      }
    }
  };

  // Group entries by supplier
  const groupEntriesBySupplier = () => {
    const grouped = {};
    
    purchaseEntries.forEach(entry => {
      const supplierKey = `${entry.supplierGSTIN}_${entry.supplierName}`;
      
      if (!grouped[supplierKey]) {
        grouped[supplierKey] = {
          supplierGSTIN: entry.supplierGSTIN,
          supplierName: entry.supplierName,
          entries: [],
          totals: {
            invoiceCount: 0,
            totalInvoiceValue: 0,
            totalTaxableValue: 0,
            totalCentralTax: 0,
            totalStateTax: 0,
            totalIntegratedTax: 0
          }
        };
      }
      
      grouped[supplierKey].entries.push(entry);
      grouped[supplierKey].totals.invoiceCount += 1;
      grouped[supplierKey].totals.totalInvoiceValue += parseFloat(entry.invoiceValue || 0);
      grouped[supplierKey].totals.totalTaxableValue += parseFloat(entry.taxableValue || 0);
      grouped[supplierKey].totals.totalCentralTax += parseFloat(entry.centralTax || 0);
      grouped[supplierKey].totals.totalStateTax += parseFloat(entry.stateTax || 0);
      grouped[supplierKey].totals.totalIntegratedTax += parseFloat(entry.integratedTax || 0);
    });
    
    return Object.values(grouped);
  };

  // Calculate totals
  const calculateTotals = () => {
    return purchaseEntries.reduce((totals, entry) => {
      return {
        totalInvoices: totals.totalInvoices + 1,
        totalInvoiceValue: totals.totalInvoiceValue + parseFloat(entry.invoiceValue || 0),
        totalTaxableValue: totals.totalTaxableValue + parseFloat(entry.taxableValue || 0),
        totalCentralTax: totals.totalCentralTax + parseFloat(entry.centralTax || 0),
        totalStateTax: totals.totalStateTax + parseFloat(entry.stateTax || 0),
        totalIntegratedTax: totals.totalIntegratedTax + parseFloat(entry.integratedTax || 0),
        totalCess: totals.totalCess + parseFloat(entry.cess || 0)
      };
    }, {
      totalInvoices: 0,
      totalInvoiceValue: 0,
      totalTaxableValue: 0,
      totalCentralTax: 0,
      totalStateTax: 0,
      totalIntegratedTax: 0,
      totalCess: 0
    });
  };

  const totals = calculateTotals();
  const groupedSuppliers = groupEntriesBySupplier();

  // Toggle supplier group collapse
  const toggleSupplierGroup = (supplierKey) => {
    setCollapsedSuppliers(prev => ({
      ...prev,
      [supplierKey]: !prev[supplierKey]
    }));
  };

  return (
    <div className="purchase-page">
      {/* Modern Header with Gradient */}
      <div className="purchase-header">
        <div className="header-content">
          <div className="header-badge">
            <Database size={16} />
            <span>Purchase Register</span>
          </div>
          <p className="header-subtitle">
            <Calendar size={16} />
            <span>Manage purchase entries for {formatMonthYear(selectedMonth)}</span>
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="import-btn modern-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || isFetchingPurchases}
          >
            <Upload size={18} />
            <span>{isImporting ? 'Importing...' : 'Import Excel'}</span>
            {isImporting && <div className="btn-loader"></div>}
          </button>
          
          <button 
            className="template-btn modern-btn"
            onClick={downloadTemplate}
            disabled={isImporting || isFetchingPurchases}
          >
            <Download size={18} />
            <span>Template</span>
          </button>
          
          <button 
            className="add-btn modern-btn"
            onClick={() => setShowAddForm(true)}
            disabled={isImporting || isFetchingPurchases}
          >
            <Plus size={18} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {/* Loading Indicator for Purchase Fetching */}
      {isFetchingPurchases && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Fetching all purchases from database...</p>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEntry ? 'Edit Purchase Entry' : 'Add Purchase Entry'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  setNewEntry({
                    supplierGSTIN: '',
                    supplierName: '',
                    invoiceNumber: '',
                    invoiceType: 'Regular',
                    invoiceDate: '',
                    invoiceValue: '',
                    placeOfSupply: 'Maharashtra',
                    reverseCharge: 'No',
                    taxableValue: '',
                    integratedTax: '',
                    centralTax: '',
                    stateTax: '',
                    cess: '',
                    itcAvailable: 'Yes',
                    taxRate: '100%'
                  });
                }}
              >
                <X />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Supplier GSTIN *</label>
                  <input
                    type="text"
                    value={newEntry.supplierGSTIN}
                    onChange={(e) => setNewEntry({...newEntry, supplierGSTIN: e.target.value})}
                    placeholder="27AMUPB2207Q1ZN"
                  />
                </div>
                
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    value={newEntry.supplierName}
                    onChange={(e) => setNewEntry({...newEntry, supplierName: e.target.value})}
                    placeholder="Supplier Business Name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Invoice Number *</label>
                  <input
                    type="text"
                    value={newEntry.invoiceNumber}
                    onChange={(e) => setNewEntry({...newEntry, invoiceNumber: e.target.value})}
                    placeholder="Invoice Number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Invoice Type</label>
                  <select
                    value={newEntry.invoiceType}
                    onChange={(e) => setNewEntry({...newEntry, invoiceType: e.target.value})}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Debit Note">Debit Note</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Invoice Date</label>
                  <input
                    type="date"
                    value={newEntry.invoiceDate}
                    onChange={(e) => setNewEntry({...newEntry, invoiceDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Invoice Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.invoiceValue}
                    onChange={(e) => setNewEntry({...newEntry, invoiceValue: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Taxable Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.taxableValue}
                    onChange={(e) => setNewEntry({...newEntry, taxableValue: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Central Tax (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.centralTax}
                    onChange={(e) => setNewEntry({...newEntry, centralTax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>State Tax (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.stateTax}
                    onChange={(e) => setNewEntry({...newEntry, stateTax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Integrated Tax (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.integratedTax}
                    onChange={(e) => setNewEntry({...newEntry, integratedTax: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>ITC Available</label>
                  <select
                    value={newEntry.itcAvailable}
                    onChange={(e) => setNewEntry({...newEntry, itcAvailable: e.target.value})}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={editingEntry ? handleUpdateEntry : handleAddEntry}
              >
                <Save />
                {editingEntry ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Purchase Entries Table */}
      <div className="purchase-table-container">
        <div className="table-header-simple">
          <div className="table-title">
            <h3>Purchase Entries</h3>
            <span className="entries-count">{purchaseEntries.length} entries</span>
            {groupedSuppliers.length > 0 && (
              <span className="supplier-count">{groupedSuppliers.length} suppliers</span>
            )}
          </div>
          <div className="table-actions-simple">
            <button 
              className={`group-toggle-btn-simple ${groupBySupplier ? 'active' : ''}`}
              onClick={() => setGroupBySupplier(!groupBySupplier)}
            >
              <Users size={16} />
              <span>{groupBySupplier ? 'Group Wise' : 'List View'}</span>
            </button>
            <button className="export-btn-simple">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {purchaseEntries.length === 0 ? (
          <div className="modern-empty-state">
            <div className="empty-state-icon">
              <FileSpreadsheet size={80} />
            </div>
            <h3>No Purchase Entries Yet</h3>
            <p>Get started by importing an Excel file or adding entries manually</p>
            <div className="empty-state-actions">
              <button 
                className="empty-action-btn primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} />
                Import Excel
              </button>
              <button 
                className="empty-action-btn secondary"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={18} />
                Add Manually
              </button>
            </div>
          </div>
        ) : (
        <div className="table-wrapper">
            <table className="purchase-table simple-table">
            <thead>
              <tr>
                  <th>Supplier GSTIN</th>
                  <th>Supplier Name</th>
                  <th>Invoice No.</th>
                  <th>Date</th>
                  <th>Invoice Value</th>
                  <th>Taxable Value</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Tax Rate</th>
                  <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseEntries.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    <AlertCircle size={48} />
                    <p>No purchase entries found. Import data or add manually.</p>
                  </td>
                </tr>
              ) : groupBySupplier ? (
                // Simple Grouped by supplier view
                groupedSuppliers.map((supplier) => {
                  const supplierKey = `${supplier.supplierGSTIN}_${supplier.supplierName}`;
                  const isCollapsed = collapsedSuppliers[supplierKey];
                  
                  return (
                    <React.Fragment key={supplierKey}>
                      {/* Simple Supplier Group Header */}
                      <tr className="supplier-group-header-simple">
                        <td colSpan="11">
                          <div className="supplier-group-content-simple">
                            <button 
                              className="collapse-btn-simple"
                              onClick={() => toggleSupplierGroup(supplierKey)}
                            >
                              {isCollapsed ? '▶' : '▼'}
                            </button>
                            <div className="supplier-info-simple">
                              <strong>{supplier.supplierName}</strong>
                              <span className="supplier-gstin-simple">{supplier.supplierGSTIN}</span>
                            </div>
                            <div className="supplier-totals-simple">
                              <span>{supplier.entries.length} invoices</span>
                              <span>₹{supplier.totals.totalInvoiceValue.toFixed(2)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Supplier Entries */}
                      {!isCollapsed && supplier.entries.map((entry) => (
                        <tr key={entry.id} className="grouped-entry-simple">
                          <td>{entry.supplierGSTIN}</td>
                          <td>{entry.supplierName}</td>
                          <td>{entry.invoiceNumber}</td>
                          <td>{entry.invoiceDate || 'N/A'}</td>
                          <td>₹{parseFloat(entry.invoiceValue || 0).toFixed(2)}</td>
                          <td>₹{parseFloat(entry.taxableValue || 0).toFixed(2)}</td>
                          <td>₹{parseFloat(entry.centralTax || 0).toFixed(2)}</td>
                          <td>₹{parseFloat(entry.stateTax || 0).toFixed(2)}</td>
                          <td>₹{parseFloat(entry.integratedTax || 0).toFixed(2)}</td>
                          <td>{entry.calculatedTaxRate || '0'}%</td>
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
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                // Regular list view
                purchaseEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.supplierGSTIN}</td>
                    <td>{entry.supplierName}</td>
                    <td>{entry.invoiceNumber}</td>
                    <td>{entry.invoiceDate || 'N/A'}</td>
                    <td>₹{parseFloat(entry.invoiceValue || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.taxableValue || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.centralTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.stateTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.integratedTax || 0).toFixed(2)}</td>
                    <td>{entry.calculatedTaxRate || '0'}%</td>
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
            {purchaseEntries.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan="4"><strong>Total</strong></td>
                  <td><strong>₹{totals.totalInvoiceValue.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.totalTaxableValue.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.totalCentralTax.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.totalStateTax.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.totalIntegratedTax.toFixed(2)}</strong></td>
                  <td><strong>-</strong></td>
                  <td><strong>-</strong></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default PurchasePage;
