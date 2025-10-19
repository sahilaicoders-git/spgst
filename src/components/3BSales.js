import React, { useState, useEffect } from 'react';
import { Receipt, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import './3BSales.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const ThreeBSales = ({ salesEntries, selectedClient, selectedMonth }) => {
  const [dbSalesEntries, setDbSalesEntries] = useState([]);
  const [dbB2CSalesEntries, setDbB2CSalesEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dbManager = new ClientDatabaseManager();

  // Filter sales entries from props (for backward compatibility)
  const propSalesEntries = salesEntries || [];
  
  // Use database entries if available, otherwise fall back to prop entries
  const allSalesEntries = dbSalesEntries.length > 0 ? dbSalesEntries : propSalesEntries;

  // Load all sales from database when client or month changes
  useEffect(() => {
    if (selectedClient && selectedMonth) {
      loadSalesFromDB();
    }
  }, [selectedClient, selectedMonth]);

  const loadSalesFromDB = async () => {
    if (!selectedClient || !selectedMonth) return;
    
    setIsLoading(true);
    try {
      // Load B2B sales
      const b2bSales = await dbManager.getClientSales(selectedClient.id, {
        month: selectedMonth
      });
      setDbSalesEntries(b2bSales);

      // Load B2C sales
      const b2cSales = await dbManager.getClientB2CSales(selectedClient.id, {
        month: selectedMonth
      });
      setDbB2CSalesEntries(b2cSales);
    } catch (error) {
      console.error('Error loading sales from database:', error);
      setDbSalesEntries([]);
      setDbB2CSalesEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate 3B sales summary
  const calculate3BSales = () => {
    const summary = {
      totalInvoices: 0,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      totalInvoiceValue: 0,
      b2bSales: 0,
      b2cSales: 0,
      exportSales: 0,
      exemptSales: 0,
      nilRatedSales: 0,
      nonGSTSales: 0
    };

    // Process B2B sales
    allSalesEntries.forEach(entry => {
      summary.totalInvoices += 1;
      summary.totalTaxableValue += parseFloat(entry.taxableValue || 0);
      summary.totalCGST += parseFloat(entry.centralTax || 0);
      summary.totalSGST += parseFloat(entry.stateTax || 0);
      summary.totalIGST += parseFloat(entry.integratedTax || 0);
      summary.totalCess += parseFloat(entry.cess || 0);
      summary.totalInvoiceValue += parseFloat(entry.invoiceValue || 0);

      // Categorize by transaction type
      const transactionType = entry.transactionType || 'B2B';
      const gstRate = parseFloat(entry.taxRate || 0);
      
      if (transactionType === 'B2B') {
        summary.b2bSales += parseFloat(entry.taxableValue || 0);
      } else if (transactionType === 'B2C') {
        summary.b2cSales += parseFloat(entry.taxableValue || 0);
      }

      // Categorize by GST rate
      if (gstRate === 0) {
        if (entry.taxableValue > 0) {
          summary.nilRatedSales += parseFloat(entry.taxableValue || 0);
        } else {
          summary.exemptSales += parseFloat(entry.taxableValue || 0);
        }
      }
    });

    // Process B2C sales
    dbB2CSalesEntries.forEach(entry => {
      summary.totalInvoices += 1;
      summary.totalTaxableValue += parseFloat(entry.taxableValue || 0);
      summary.totalCGST += parseFloat(entry.centralTax || 0);
      summary.totalSGST += parseFloat(entry.stateTax || 0);
      summary.totalIGST += parseFloat(entry.integratedTax || 0);
      summary.totalCess += parseFloat(entry.cess || 0);
      summary.totalInvoiceValue += parseFloat(entry.invoiceValue || 0);

      // B2C sales are always B2C
      summary.b2cSales += parseFloat(entry.taxableValue || 0);

      // Categorize by GST rate
      const gstRate = parseFloat(entry.gstRate || 0);
      if (gstRate === 0) {
        if (entry.taxableValue > 0) {
          summary.nilRatedSales += parseFloat(entry.taxableValue || 0);
        } else {
          summary.exemptSales += parseFloat(entry.taxableValue || 0);
        }
      }
    });

    return summary;
  };

  const salesSummary = calculate3BSales();

  // Format month year for display
  const formatMonthYear = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="three-b-sales">
      <div className="three-b-header">
        <div className="header-left">
          <div className="header-icon">
            <Receipt size={32} />
          </div>
          <div className="header-content">
            <h2>3B Sales Summary</h2>
            <p>Total sales amount and GST details for {formatMonthYear(selectedMonth)}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Invoice Value</div>
            <div className="card-value">₹{salesSummary.totalInvoiceValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="summary-card secondary">
          <div className="card-icon">
            <Calculator size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Taxable Value</div>
            <div className="card-value">₹{salesSummary.totalTaxableValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Invoices</div>
            <div className="card-value">{salesSummary.totalInvoices}</div>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="card-icon">
            <Receipt size={24} />
          </div>
          <div className="card-content">
            <div className="card-label">Total GST</div>
            <div className="card-value">₹{(salesSummary.totalCGST + salesSummary.totalSGST + salesSummary.totalIGST).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="breakdown-section">
        <h3>Sales Breakdown</h3>
        {isLoading && <div className="loading-indicator">Loading sales data...</div>}
        
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <h4>Transaction Types</h4>
            <div className="breakdown-item">
              <span className="label">B2B Sales:</span>
              <span className="value">₹{salesSummary.b2bSales.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">B2C Sales:</span>
              <span className="value">₹{salesSummary.b2cSales.toFixed(2)}</span>
            </div>
          </div>

          <div className="breakdown-card">
            <h4>GST Components</h4>
            <div className="breakdown-item">
              <span className="label">CGST:</span>
              <span className="value">₹{salesSummary.totalCGST.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">SGST:</span>
              <span className="value">₹{salesSummary.totalSGST.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">IGST:</span>
              <span className="value">₹{salesSummary.totalIGST.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Cess:</span>
              <span className="value">₹{salesSummary.totalCess.toFixed(2)}</span>
            </div>
          </div>

          <div className="breakdown-card">
            <h4>Special Categories</h4>
            <div className="breakdown-item">
              <span className="label">Nil Rated:</span>
              <span className="value">₹{salesSummary.nilRatedSales.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Exempt:</span>
              <span className="value">₹{salesSummary.exemptSales.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Export:</span>
              <span className="value">₹{salesSummary.exportSales.toFixed(2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Non-GST:</span>
              <span className="value">₹{salesSummary.nonGSTSales.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="summary-table-container">
        <h3>3B Sales Summary Table</h3>
        <div className="table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Taxable Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Cess</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Sales</strong></td>
                <td>₹{salesSummary.totalTaxableValue.toFixed(2)}</td>
                <td>₹{salesSummary.totalCGST.toFixed(2)}</td>
                <td>₹{salesSummary.totalSGST.toFixed(2)}</td>
                <td>₹{salesSummary.totalIGST.toFixed(2)}</td>
                <td>₹{salesSummary.totalCess.toFixed(2)}</td>
                <td><strong>₹{salesSummary.totalInvoiceValue.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ThreeBSales;
