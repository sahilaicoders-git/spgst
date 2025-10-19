import React, { useRef, useState, useEffect } from 'react';
import { Building, Upload, FileSpreadsheet } from 'lucide-react';
import './B2BSales.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const B2BSales = ({ salesEntries, onImportB2BData, selectedClient, selectedMonth }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [dbB2BEntries, setDbB2BEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const dbManager = new ClientDatabaseManager();

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

  const summary = getB2BSummary();

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
              </tr>
            </thead>
            <tbody>
              {b2bEntries.length === 0 ? (
                <tr>
                  <td colSpan="13" className="no-data">
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
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default B2BSales;
