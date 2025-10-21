import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar, Building, TrendingUp, Calculator, Package, CreditCard, AlertCircle } from 'lucide-react';
import './ReportPage.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const ReportPage = ({ selectedClient, selectedMonth }) => {
  const [reportData, setReportData] = useState({
    // Basic Details
    gstin: '',
    legalName: '',
    tradeName: '',
    period: '',
    
    // Sales Summary
    b2bSales: [],
    b2cSales: [],
    exportSales: [],
    
    // Purchase Summary
    purchases: [],
    
    // HSN Summary
    hsnOutward: [],
    hsnInward: [],
    
    // ITC Summary
    itcSummary: {
      totalITC: 0,
      cgstITC: 0,
      sgstITC: 0,
      igstITC: 0,
      cessITC: 0,
      utilizedITC: 0,
      carryForwardITC: 0
    },
    
    // Tax Summary
    taxSummary: {
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      totalTaxLiability: 0,
      totalTaxPaid: 0
    },
    
    // Document Summary
    documentSummary: {
      invoicesIssued: 0,
      creditNotesIssued: 0,
      debitNotesIssued: 0,
      invoicesReceived: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('summary');
  const dbManager = new ClientDatabaseManager();

  // Load report data when client or month changes
  useEffect(() => {
    if (selectedClient && selectedMonth) {
      loadReportData();
    }
  }, [selectedClient, selectedMonth]);

  const loadReportData = async () => {
    if (!selectedClient || !selectedMonth) return;
    
    setIsLoading(true);
    try {
      // Load all data sources
      const [sales, b2cSales, purchases] = await Promise.all([
        dbManager.getClientSales(selectedClient.id, { month: selectedMonth }),
        dbManager.getClientB2CSales(selectedClient.id, { month: selectedMonth }),
        dbManager.getClientPurchases(selectedClient.id, { month: selectedMonth })
      ]);

      // Process and calculate report data
      const processedData = processReportData(sales, b2cSales, purchases);
      setReportData(processedData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processReportData = (sales, b2cSales, purchases) => {
    // Basic Details
    const basicDetails = {
      gstin: selectedClient.gstNo || '',
      legalName: selectedClient.clientName || '',
      tradeName: selectedClient.businessName || selectedClient.clientName || '',
      period: formatMonthYear(selectedMonth)
    };

    // Sales Summary
    const b2bSales = sales.filter(sale => sale.transactionType === 'B2B');
    const exportSales = sales.filter(sale => sale.placeOfSupply?.includes('Export') || sale.placeOfSupply?.includes('SEZ'));

    // HSN Summary - Outward Supplies
    const hsnOutwardMap = {};
    [...b2bSales, ...b2cSales].forEach(sale => {
      const hsn = sale.hsnCode || 'Not Specified';
      const gstRate = sale.taxRate || '0';
      const key = `${hsn}-${gstRate}`;
      
      if (!hsnOutwardMap[key]) {
        hsnOutwardMap[key] = {
          hsnCode: hsn,
          description: getHSNDescription(hsn),
          uqc: sale.unit || 'NOS',
          totalQuantity: 0,
          totalValue: 0,
          taxableValue: 0,
          taxRate: gstRate,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0
        };
      }
      
      hsnOutwardMap[key].totalQuantity += parseFloat(sale.quantity || 0);
      hsnOutwardMap[key].totalValue += parseFloat(sale.invoiceValue || 0);
      hsnOutwardMap[key].taxableValue += parseFloat(sale.taxableValue || 0);
      hsnOutwardMap[key].cgstAmount += parseFloat(sale.centralTax || 0);
      hsnOutwardMap[key].sgstAmount += parseFloat(sale.stateTax || 0);
      hsnOutwardMap[key].igstAmount += parseFloat(sale.integratedTax || 0);
      hsnOutwardMap[key].cessAmount += parseFloat(sale.cess || 0);
    });

    // HSN Summary - Inward Supplies
    const hsnInwardMap = {};
    purchases.forEach(purchase => {
      const hsn = purchase.hsnCode || 'Not Specified';
      const gstRate = purchase.taxRate || '0';
      const key = `${hsn}-${gstRate}`;
      
      if (!hsnInwardMap[key]) {
        hsnInwardMap[key] = {
          hsnCode: hsn,
          description: getHSNDescription(hsn),
          uqc: purchase.unit || 'NOS',
          totalQuantity: 0,
          totalValue: 0,
          taxableValue: 0,
          taxRate: gstRate,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0
        };
      }
      
      hsnInwardMap[key].totalQuantity += parseFloat(purchase.quantity || 0);
      hsnInwardMap[key].totalValue += parseFloat(purchase.invoiceValue || 0);
      hsnInwardMap[key].taxableValue += parseFloat(purchase.taxableValue || 0);
      hsnInwardMap[key].cgstAmount += parseFloat(purchase.centralTax || 0);
      hsnInwardMap[key].sgstAmount += parseFloat(purchase.stateTax || 0);
      hsnInwardMap[key].igstAmount += parseFloat(purchase.integratedTax || 0);
      hsnInwardMap[key].cessAmount += parseFloat(purchase.cess || 0);
    });

    // Tax Summary (Calculate FIRST before ITC)
    const taxSummary = {
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      totalTaxLiability: 0,
      totalTaxPaid: 0
    };

    [...b2bSales, ...b2cSales].forEach(sale => {
      taxSummary.totalTaxableValue += parseFloat(sale.taxableValue || 0);
      taxSummary.totalCGST += parseFloat(sale.centralTax || 0);
      taxSummary.totalSGST += parseFloat(sale.stateTax || 0);
      taxSummary.totalIGST += parseFloat(sale.integratedTax || 0);
      taxSummary.totalCess += parseFloat(sale.cess || 0);
    });

    taxSummary.totalTaxLiability = taxSummary.totalCGST + taxSummary.totalSGST + taxSummary.totalIGST + taxSummary.totalCess;
    taxSummary.totalTaxPaid = taxSummary.totalTaxLiability; // Assuming all tax is paid

    // ITC Summary (Calculate AFTER tax summary)
    const itcSummary = {
      totalITC: 0,
      cgstITC: 0,
      sgstITC: 0,
      igstITC: 0,
      cessITC: 0,
      utilizedITC: 0,
      carryForwardITC: 0
    };

    purchases.forEach(purchase => {
      if (purchase.itcEligible !== false) {
        itcSummary.cgstITC += parseFloat(purchase.centralTax || 0);
        itcSummary.sgstITC += parseFloat(purchase.stateTax || 0);
        itcSummary.igstITC += parseFloat(purchase.integratedTax || 0);
        itcSummary.cessITC += parseFloat(purchase.cess || 0);
      }
    });

    itcSummary.totalITC = itcSummary.cgstITC + itcSummary.sgstITC + itcSummary.igstITC + itcSummary.cessITC;
    
    // Calculate utilized ITC based on tax liability
    const utilizedCGST = Math.min(itcSummary.cgstITC, taxSummary.totalCGST);
    const utilizedSGST = Math.min(itcSummary.sgstITC, taxSummary.totalSGST);
    const utilizedIGST = Math.min(itcSummary.igstITC, taxSummary.totalIGST);
    const utilizedCess = Math.min(itcSummary.cessITC, taxSummary.totalCess);
    
    itcSummary.utilizedITC = utilizedCGST + utilizedSGST + utilizedIGST + utilizedCess;
    itcSummary.carryForwardITC = itcSummary.totalITC - itcSummary.utilizedITC;

    // Document Summary
    const documentSummary = {
      invoicesIssued: b2bSales.length + b2cSales.length,
      creditNotesIssued: 0, // Would need separate tracking
      debitNotesIssued: 0, // Would need separate tracking
      invoicesReceived: purchases.length
    };

    return {
      ...basicDetails,
      b2bSales,
      b2cSales,
      exportSales,
      purchases,
      hsnOutward: Object.values(hsnOutwardMap),
      hsnInward: Object.values(hsnInwardMap),
      itcSummary,
      taxSummary,
      documentSummary
    };
  };

  const getHSNDescription = (hsnCode) => {
    const hsnDescriptions = {
      '1234': 'Electronics',
      '5678': 'Textiles',
      '9999': 'General Goods',
      'Not Specified': 'Not Specified'
    };
    return hsnDescriptions[hsnCode] || 'Other Goods';
  };

  const formatMonthYear = (monthYear) => {
    if (!monthYear) return 'Select Month';
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    alert('PDF export functionality will be implemented');
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    alert('Excel export functionality will be implemented');
  };

  const printReport = () => {
    window.print();
  };

  const sections = [
    { id: 'summary', label: 'Summary', icon: TrendingUp },
    { id: 'gstr3b', label: 'GSTR-3B Format', icon: FileText },
    { id: 'sales', label: 'Sales Details', icon: Package },
    { id: 'purchases', label: 'Purchase Details', icon: CreditCard },
    { id: 'hsn', label: 'HSN Summary', icon: FileText },
    { id: 'itc', label: 'ITC Summary', icon: Calculator },
    { id: 'tax', label: 'Tax Summary', icon: AlertCircle }
  ];

  return (
    <div className="report-page">
      {/* Header */}
      <div className="report-header">
        <div className="header-left">
          <div className="header-icon">
            <FileText size={32} />
          </div>
          <div className="header-content">
            <h1>GST Report - GSTR-3B</h1>
            <p>Comprehensive GST return for {reportData.period}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={exportToPDF}>
            <Download size={16} />
            PDF
          </button>
          <button className="action-btn" onClick={exportToExcel}>
            <Download size={16} />
            Excel
          </button>
          <button className="action-btn" onClick={printReport}>
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Basic Details */}
      <div className="basic-details">
        <h2>Basic Details</h2>
        <div className="details-grid">
          <div className="detail-item">
            <label>GSTIN:</label>
            <span>{reportData.gstin}</span>
          </div>
          <div className="detail-item">
            <label>Legal Name:</label>
            <span>{reportData.legalName}</span>
          </div>
          <div className="detail-item">
            <label>Trade Name:</label>
            <span>{reportData.tradeName}</span>
          </div>
          <div className="detail-item">
            <label>Period:</label>
            <span>{reportData.period}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="report-navigation">
        {sections.map(section => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              className={`nav-btn ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <IconComponent size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="report-content">
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span>Loading report data...</span>
          </div>
        )}

        {/* GSTR-3B Format Section */}
        {activeSection === 'gstr3b' && (
          <div className="gstr3b-section">
            <div className="gstr3b-header">
              <h3>GSTR-3B Return - {reportData.period}</h3>
              <div className="gstr3b-info">
                <span>GSTIN: {reportData.gstin}</span>
                <span>Legal Name: {reportData.legalName}</span>
              </div>
            </div>
            
            <div className="gstr3b-container">
              {/* Section 3.1 - Outward taxable supplies */}
              <div className="gstr3b-table-section">
                <h4>3.1 Outward taxable supplies (other than zero rated, nil rated, exempted and non-GST supplies)</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nature of Supplies</th>
                        <th>Total Taxable Value</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Outward taxable supplies (other than zero rated, nil rated, exempted and non-GST supplies)</td>
                        <td>₹{reportData.taxSummary.totalTaxableValue.toFixed(2)}</td>
                        <td>₹{reportData.taxSummary.totalIGST.toFixed(2)}</td>
                        <td>₹{reportData.taxSummary.totalCGST.toFixed(2)}</td>
                        <td>₹{reportData.taxSummary.totalSGST.toFixed(2)}</td>
                        <td>₹{reportData.taxSummary.totalCess.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3.2 - Outward taxable supplies (zero rated) */}
              <div className="gstr3b-table-section">
                <h4>3.2 Outward taxable supplies (zero rated)</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nature of Supplies</th>
                        <th>Total Taxable Value</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Outward taxable supplies (zero rated)</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4 - Eligible ITC */}
              <div className="gstr3b-table-section">
                <h4>4. Eligible ITC</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Details</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>(A) ITC Available (whether in full or part)</td>
                        <td>₹{reportData.itcSummary.igstITC.toFixed(2)}</td>
                        <td>₹{reportData.itcSummary.cgstITC.toFixed(2)}</td>
                        <td>₹{reportData.itcSummary.sgstITC.toFixed(2)}</td>
                        <td>₹{reportData.itcSummary.cessITC.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>(B) ITC Reversed</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                      <tr className="total-row">
                        <td>(C) Net ITC Available (A) - (B)</td>
                        <td>₹{reportData.itcSummary.igstITC.toFixed(2)}</td>
                        <td>₹{reportData.itcSummary.cgstITC.toFixed(2)}</td>
                        <td>₹{reportData.itcSummary.sgstITC.toFixed(2)}</td>
                        <td>₹{reportData.itcSummary.cessITC.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5 - ITC Utilized */}
              <div className="gstr3b-table-section">
                <h4>5. ITC Utilized</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Details</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>(A) ITC Utilized</td>
                        <td>₹{Math.min(reportData.itcSummary.igstITC, reportData.taxSummary.totalIGST).toFixed(2)}</td>
                        <td>₹{Math.min(reportData.itcSummary.cgstITC, reportData.taxSummary.totalCGST).toFixed(2)}</td>
                        <td>₹{Math.min(reportData.itcSummary.sgstITC, reportData.taxSummary.totalSGST).toFixed(2)}</td>
                        <td>₹{Math.min(reportData.itcSummary.cessITC, reportData.taxSummary.totalCess).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 6 - Exempt, nil rated and non-GST outward supplies */}
              <div className="gstr3b-table-section">
                <h4>6. Exempt, nil rated and non-GST outward supplies</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nature of Supplies</th>
                        <th>Total Taxable Value</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Exempt, nil rated and non-GST outward supplies</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 7 - Interest and Late Fee */}
              <div className="gstr3b-table-section">
                <h4>7. Interest and Late Fee</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Details</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Interest on delayed payment</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                      <tr>
                        <td>Late fee</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 8 - Payment of Tax */}
              <div className="gstr3b-table-section">
                <h4>8. Payment of Tax</h4>
                <div className="gstr3b-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Details</th>
                        <th>Integrated Tax</th>
                        <th>Central Tax</th>
                        <th>State/UT Tax</th>
                        <th>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Tax Payable</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalIGST - reportData.itcSummary.igstITC).toFixed(2)}</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalCGST - reportData.itcSummary.cgstITC).toFixed(2)}</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalSGST - reportData.itcSummary.sgstITC).toFixed(2)}</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalCess - reportData.itcSummary.cessITC).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Interest</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                      <tr>
                        <td>Late fee</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                        <td>₹0.00</td>
                      </tr>
                      <tr className="total-row">
                        <td>Total</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalIGST - reportData.itcSummary.igstITC).toFixed(2)}</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalCGST - reportData.itcSummary.cgstITC).toFixed(2)}</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalSGST - reportData.itcSummary.sgstITC).toFixed(2)}</td>
                        <td>₹{Math.max(0, reportData.taxSummary.totalCess - reportData.itcSummary.cessITC).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {activeSection === 'summary' && (
          <div className="summary-section">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-icon">
                  <Package size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">Total Sales</div>
                  <div className="card-value">₹{reportData.taxSummary.totalTaxableValue.toFixed(2)}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">
                  <CreditCard size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">Total Purchases</div>
                  <div className="card-value">₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.taxableValue || 0), 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">
                  <Calculator size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">Total ITC</div>
                  <div className="card-value">₹{reportData.itcSummary.totalITC.toFixed(2)}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">
                  <AlertCircle size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">Tax Liability</div>
                  <div className="card-value">₹{reportData.taxSummary.totalTaxLiability.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="document-summary">
              <h3>Document Summary</h3>
              <div className="doc-summary-grid">
                <div className="doc-item">
                  <span className="label">Invoices Issued:</span>
                  <span className="value">{reportData.documentSummary.invoicesIssued}</span>
                </div>
                <div className="doc-item">
                  <span className="label">Invoices Received:</span>
                  <span className="value">{reportData.documentSummary.invoicesReceived}</span>
                </div>
                <div className="doc-item">
                  <span className="label">Credit Notes:</span>
                  <span className="value">{reportData.documentSummary.creditNotesIssued}</span>
                </div>
                <div className="doc-item">
                  <span className="label">Debit Notes:</span>
                  <span className="value">{reportData.documentSummary.debitNotesIssued}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Details Section */}
        {activeSection === 'sales' && (
          <div className="sales-section">
            <h3>Sales Details</h3>
            
            {/* Sales Summary Cards */}
            <div className="sales-summary-grid">
              {/* B2B Total Card */}
              <div className="sales-summary-card b2b-card">
                <div className="card-header">
                  <div className="card-icon">
                    <Package size={24} />
                  </div>
                  <h4>B2B Sales Total</h4>
                </div>
                <div className="card-body">
                  <div className="summary-row">
                    <span>Total Invoices:</span>
                    <strong>{reportData.b2bSales.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Taxable Value:</span>
                    <strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.taxableValue || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>CGST:</span>
                    <strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.centralTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>SGST:</span>
                    <strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.stateTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>IGST:</span>
                    <strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.integratedTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Cess:</span>
                    <strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.cess || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total Amount:</span>
                    <strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.invoiceValue || 0), 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* B2C Total Card */}
              <div className="sales-summary-card b2c-card">
                <div className="card-header">
                  <div className="card-icon">
                    <Package size={24} />
                  </div>
                  <h4>B2C Sales Total</h4>
                </div>
                <div className="card-body">
                  <div className="summary-row">
                    <span>Total Invoices:</span>
                    <strong>{reportData.b2cSales.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Taxable Value:</span>
                    <strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.taxableValue || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>CGST:</span>
                    <strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.centralTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>SGST:</span>
                    <strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.stateTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>IGST:</span>
                    <strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.integratedTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Cess:</span>
                    <strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.cess || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total Amount:</span>
                    <strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.invoiceValue || 0), 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* GST Rate-wise Breakup for B2B */}
            <div className="rate-breakup-section">
              <h4>B2B Sales - GST Rate-wise Breakup</h4>
              <div className="rate-breakup-table">
                <table>
                  <thead>
                    <tr>
                      <th>GST Rate</th>
                      <th>No. of Invoices</th>
                      <th>Taxable Value</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>IGST</th>
                      <th>Cess</th>
                      <th>Total Tax</th>
                      <th>Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group B2B sales by tax rate
                      const rateGroups = {};
                      reportData.b2bSales.forEach(sale => {
                        const rate = sale.taxRate || '0';
                        if (!rateGroups[rate]) {
                          rateGroups[rate] = {
                            count: 0,
                            taxableValue: 0,
                            cgst: 0,
                            sgst: 0,
                            igst: 0,
                            cess: 0,
                            total: 0
                          };
                        }
                        rateGroups[rate].count++;
                        rateGroups[rate].taxableValue += parseFloat(sale.taxableValue || 0);
                        rateGroups[rate].cgst += parseFloat(sale.centralTax || 0);
                        rateGroups[rate].sgst += parseFloat(sale.stateTax || 0);
                        rateGroups[rate].igst += parseFloat(sale.integratedTax || 0);
                        rateGroups[rate].cess += parseFloat(sale.cess || 0);
                        rateGroups[rate].total += parseFloat(sale.invoiceValue || 0);
                      });

                      // Sort by rate
                      const sortedRates = Object.keys(rateGroups).sort((a, b) => parseFloat(b) - parseFloat(a));

                      return sortedRates.map(rate => {
                        const group = rateGroups[rate];
                        const totalTax = group.cgst + group.sgst + group.igst + group.cess;
                        return (
                          <tr key={rate}>
                            <td><strong>{rate}%</strong></td>
                            <td>{group.count}</td>
                            <td>₹{group.taxableValue.toFixed(2)}</td>
                            <td>₹{group.cgst.toFixed(2)}</td>
                            <td>₹{group.sgst.toFixed(2)}</td>
                            <td>₹{group.igst.toFixed(2)}</td>
                            <td>₹{group.cess.toFixed(2)}</td>
                            <td>₹{totalTax.toFixed(2)}</td>
                            <td>₹{group.total.toFixed(2)}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>{reportData.b2bSales.length}</strong></td>
                      <td><strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.taxableValue || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.centralTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.stateTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.integratedTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.cess || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{(reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.centralTax || 0) + parseFloat(s.stateTax || 0) + parseFloat(s.integratedTax || 0) + parseFloat(s.cess || 0), 0)).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2bSales.reduce((sum, s) => sum + parseFloat(s.invoiceValue || 0), 0).toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* GST Rate-wise Breakup for B2C */}
            <div className="rate-breakup-section">
              <h4>B2C Sales - GST Rate-wise Breakup</h4>
              <div className="rate-breakup-table">
                <table>
                  <thead>
                    <tr>
                      <th>GST Rate</th>
                      <th>No. of Invoices</th>
                      <th>Taxable Value</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>IGST</th>
                      <th>Cess</th>
                      <th>Total Tax</th>
                      <th>Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group B2C sales by tax rate
                      const rateGroups = {};
                      reportData.b2cSales.forEach(sale => {
                        const rate = sale.taxRate || '0';
                        if (!rateGroups[rate]) {
                          rateGroups[rate] = {
                            count: 0,
                            taxableValue: 0,
                            cgst: 0,
                            sgst: 0,
                            igst: 0,
                            cess: 0,
                            total: 0
                          };
                        }
                        rateGroups[rate].count++;
                        rateGroups[rate].taxableValue += parseFloat(sale.taxableValue || 0);
                        rateGroups[rate].cgst += parseFloat(sale.centralTax || 0);
                        rateGroups[rate].sgst += parseFloat(sale.stateTax || 0);
                        rateGroups[rate].igst += parseFloat(sale.integratedTax || 0);
                        rateGroups[rate].cess += parseFloat(sale.cess || 0);
                        rateGroups[rate].total += parseFloat(sale.invoiceValue || 0);
                      });

                      // Sort by rate
                      const sortedRates = Object.keys(rateGroups).sort((a, b) => parseFloat(b) - parseFloat(a));

                      return sortedRates.map(rate => {
                        const group = rateGroups[rate];
                        const totalTax = group.cgst + group.sgst + group.igst + group.cess;
                        return (
                          <tr key={rate}>
                            <td><strong>{rate}%</strong></td>
                            <td>{group.count}</td>
                            <td>₹{group.taxableValue.toFixed(2)}</td>
                            <td>₹{group.cgst.toFixed(2)}</td>
                            <td>₹{group.sgst.toFixed(2)}</td>
                            <td>₹{group.igst.toFixed(2)}</td>
                            <td>₹{group.cess.toFixed(2)}</td>
                            <td>₹{totalTax.toFixed(2)}</td>
                            <td>₹{group.total.toFixed(2)}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>{reportData.b2cSales.length}</strong></td>
                      <td><strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.taxableValue || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.centralTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.stateTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.integratedTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.cess || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{(reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.centralTax || 0) + parseFloat(s.stateTax || 0) + parseFloat(s.integratedTax || 0) + parseFloat(s.cess || 0), 0)).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.b2cSales.reduce((sum, s) => sum + parseFloat(s.invoiceValue || 0), 0).toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Details Section */}
        {activeSection === 'purchases' && (
          <div className="purchases-section">
            <h3>Purchase Details</h3>
            
            {/* Purchase Summary Cards */}
            <div className="purchase-summary-grid">
              {/* B2B Total Card */}
              <div className="purchase-summary-card b2b-card">
                <div className="card-header">
                  <div className="card-icon">
                    <CreditCard size={24} />
                  </div>
                  <h4>B2B Purchases Total</h4>
                </div>
                <div className="card-body">
                  <div className="summary-row">
                    <span>Total Invoices:</span>
                    <strong>{reportData.purchases.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Taxable Value:</span>
                    <strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.taxableValue || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>CGST:</span>
                    <strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.centralTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>SGST:</span>
                    <strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.stateTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>IGST:</span>
                    <strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.integratedTax || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Cess:</span>
                    <strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.cess || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total Amount:</span>
                    <strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.invoiceValue || 0), 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* GST Rate-wise Breakup */}
            <div className="rate-breakup-section">
              <h4>GST Rate-wise Breakup</h4>
              <div className="rate-breakup-table">
                <table>
                  <thead>
                    <tr>
                      <th>GST Rate</th>
                      <th>No. of Invoices</th>
                      <th>Taxable Value</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>IGST</th>
                      <th>Cess</th>
                      <th>Total Tax</th>
                      <th>Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Group purchases by tax rate
                      const rateGroups = {};
                      reportData.purchases.forEach(purchase => {
                        const rate = purchase.taxRate || '0';
                        if (!rateGroups[rate]) {
                          rateGroups[rate] = {
                            count: 0,
                            taxableValue: 0,
                            cgst: 0,
                            sgst: 0,
                            igst: 0,
                            cess: 0,
                            total: 0
                          };
                        }
                        rateGroups[rate].count++;
                        rateGroups[rate].taxableValue += parseFloat(purchase.taxableValue || 0);
                        rateGroups[rate].cgst += parseFloat(purchase.centralTax || 0);
                        rateGroups[rate].sgst += parseFloat(purchase.stateTax || 0);
                        rateGroups[rate].igst += parseFloat(purchase.integratedTax || 0);
                        rateGroups[rate].cess += parseFloat(purchase.cess || 0);
                        rateGroups[rate].total += parseFloat(purchase.invoiceValue || 0);
                      });

                      // Sort by rate
                      const sortedRates = Object.keys(rateGroups).sort((a, b) => parseFloat(b) - parseFloat(a));

                      return sortedRates.map(rate => {
                        const group = rateGroups[rate];
                        const totalTax = group.cgst + group.sgst + group.igst + group.cess;
                        return (
                          <tr key={rate}>
                            <td><strong>{rate}%</strong></td>
                            <td>{group.count}</td>
                            <td>₹{group.taxableValue.toFixed(2)}</td>
                            <td>₹{group.cgst.toFixed(2)}</td>
                            <td>₹{group.sgst.toFixed(2)}</td>
                            <td>₹{group.igst.toFixed(2)}</td>
                            <td>₹{group.cess.toFixed(2)}</td>
                            <td>₹{totalTax.toFixed(2)}</td>
                            <td>₹{group.total.toFixed(2)}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>{reportData.purchases.length}</strong></td>
                      <td><strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.taxableValue || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.centralTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.stateTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.integratedTax || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.cess || 0), 0).toFixed(2)}</strong></td>
                      <td><strong>₹{(reportData.purchases.reduce((sum, p) => sum + parseFloat(p.centralTax || 0) + parseFloat(p.stateTax || 0) + parseFloat(p.integratedTax || 0) + parseFloat(p.cess || 0), 0)).toFixed(2)}</strong></td>
                      <td><strong>₹{reportData.purchases.reduce((sum, p) => sum + parseFloat(p.invoiceValue || 0), 0).toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HSN Summary Section */}
        {activeSection === 'hsn' && (
          <div className="hsn-section">
            <div className="section-header">
              <h3>HSN Summary</h3>
              <div className="section-tabs">
                <button className="tab-btn active">Outward Supplies</button>
                <button className="tab-btn">Inward Supplies</button>
              </div>
            </div>
            
            <div className="hsn-table">
              <table>
                <thead>
                  <tr>
                    <th>HSN Code</th>
                    <th>Description</th>
                    <th>UQC</th>
                    <th>Quantity</th>
                    <th>Taxable Value</th>
                    <th>Tax Rate</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.hsnOutward.map((hsn, index) => (
                    <tr key={index}>
                      <td>{hsn.hsnCode}</td>
                      <td>{hsn.description}</td>
                      <td>{hsn.uqc}</td>
                      <td>{hsn.totalQuantity.toFixed(2)}</td>
                      <td>₹{hsn.taxableValue.toFixed(2)}</td>
                      <td>{hsn.taxRate}%</td>
                      <td>₹{hsn.cgstAmount.toFixed(2)}</td>
                      <td>₹{hsn.sgstAmount.toFixed(2)}</td>
                      <td>₹{hsn.igstAmount.toFixed(2)}</td>
                      <td>₹{hsn.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ITC Summary Section */}
        {activeSection === 'itc' && (
          <div className="itc-section">
            <h3>Input Tax Credit Summary</h3>
            
            {/* Outward GST Summary */}
            <div className="itc-subsection">
              <h4>Outward GST Tax Liability</h4>
              <div className="outward-gst-grid">
                <div className="gst-card">
                  <div className="gst-label">CGST Payable</div>
                  <div className="gst-value">₹{reportData.taxSummary.totalCGST.toFixed(2)}</div>
                </div>
                <div className="gst-card">
                  <div className="gst-label">SGST Payable</div>
                  <div className="gst-value">₹{reportData.taxSummary.totalSGST.toFixed(2)}</div>
                </div>
                <div className="gst-card">
                  <div className="gst-label">IGST Payable</div>
                  <div className="gst-value">₹{reportData.taxSummary.totalIGST.toFixed(2)}</div>
                </div>
                <div className="gst-card total">
                  <div className="gst-label">Total Tax Liability</div>
                  <div className="gst-value">₹{reportData.taxSummary.totalTaxLiability.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Inward Supply ITC Details */}
            <div className="itc-subsection">
              <h4>Inward Supply ITC Details</h4>
              <div className="inward-itc-grid">
              <div className="itc-card">
                <div className="card-label">Total ITC Available</div>
                <div className="card-value">₹{reportData.itcSummary.totalITC.toFixed(2)}</div>
                  <div className="card-breakdown">
                    <div className="breakdown-item">
                      <span>CGST ITC:</span>
                      <span>₹{reportData.itcSummary.cgstITC.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>SGST ITC:</span>
                      <span>₹{reportData.itcSummary.sgstITC.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>IGST ITC:</span>
                      <span>₹{reportData.itcSummary.igstITC.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Cess ITC:</span>
                      <span>₹{reportData.itcSummary.cessITC.toFixed(2)}</span>
                    </div>
                  </div>
              </div>
                
              <div className="itc-card">
                  <div className="card-label">ITC Utilized</div>
                  <div className="card-value">₹{reportData.itcSummary.utilizedITC.toFixed(2)}</div>
                  <div className="card-breakdown">
                    <div className="breakdown-item">
                      <span>Against CGST:</span>
                      <span>₹{Math.min(reportData.itcSummary.cgstITC, reportData.taxSummary.totalCGST).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Against SGST:</span>
                      <span>₹{Math.min(reportData.itcSummary.sgstITC, reportData.taxSummary.totalSGST).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Against IGST:</span>
                      <span>₹{Math.min(reportData.itcSummary.igstITC, reportData.taxSummary.totalIGST).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Against Cess:</span>
                      <span>₹{Math.min(reportData.itcSummary.cessITC, reportData.taxSummary.totalCess).toFixed(2)}</span>
                    </div>
                  </div>
              </div>
                
              <div className="itc-card">
                  <div className="card-label">ITC Balance</div>
                  <div className="card-value">₹{reportData.itcSummary.carryForwardITC.toFixed(2)}</div>
                  <div className="card-breakdown">
                    <div className="breakdown-item">
                      <span>CGST Balance:</span>
                      <span>₹{Math.max(0, reportData.itcSummary.cgstITC - reportData.taxSummary.totalCGST).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>SGST Balance:</span>
                      <span>₹{Math.max(0, reportData.itcSummary.sgstITC - reportData.taxSummary.totalSGST).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>IGST Balance:</span>
                      <span>₹{Math.max(0, reportData.itcSummary.igstITC - reportData.taxSummary.totalIGST).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Cess Balance:</span>
                      <span>₹{Math.max(0, reportData.itcSummary.cessITC - reportData.taxSummary.totalCess).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ITC Utilization Summary */}
            <div className="itc-subsection">
              <h4>ITC Utilization Summary</h4>
              <div className="utilization-summary">
                <div className="util-item">
                  <div className="util-label">Total Tax Liability</div>
                  <div className="util-value">₹{reportData.taxSummary.totalTaxLiability.toFixed(2)}</div>
                </div>
                <div className="util-item">
                  <div className="util-label">ITC Available</div>
                  <div className="util-value">₹{reportData.itcSummary.totalITC.toFixed(2)}</div>
                </div>
                <div className="util-item">
                  <div className="util-label">ITC Utilized</div>
                  <div className="util-value">₹{reportData.itcSummary.utilizedITC.toFixed(2)}</div>
                </div>
                <div className="util-item">
                  <div className="util-label">Net Tax Payable</div>
                  <div className="util-value">₹{Math.max(0, reportData.taxSummary.totalTaxLiability - reportData.itcSummary.totalITC).toFixed(2)}</div>
                </div>
                <div className="util-item">
                  <div className="util-label">ITC Carry Forward</div>
                  <div className="util-value">₹{reportData.itcSummary.carryForwardITC.toFixed(2)}</div>
                </div>
              </div>
              </div>

            {/* Detailed ITC Table */}
            <div className="itc-subsection">
              <h4>Detailed ITC Breakdown by Purchase</h4>
              <div className="itc-details-table">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Supplier</th>
                      <th>Invoice Date</th>
                      <th>Taxable Value</th>
                      <th>CGST ITC</th>
                      <th>SGST ITC</th>
                      <th>IGST ITC</th>
                      <th>Cess ITC</th>
                      <th>Total ITC</th>
                      <th>ITC Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.purchases.map((purchase, index) => {
                      const cgstITC = purchase.itcEligible !== false ? parseFloat(purchase.centralTax || 0) : 0;
                      const sgstITC = purchase.itcEligible !== false ? parseFloat(purchase.stateTax || 0) : 0;
                      const igstITC = purchase.itcEligible !== false ? parseFloat(purchase.integratedTax || 0) : 0;
                      const cessITC = purchase.itcEligible !== false ? parseFloat(purchase.cess || 0) : 0;
                      const totalITC = cgstITC + sgstITC + igstITC + cessITC;
                      
                      return (
                        <tr key={index}>
                          <td>{purchase.invoiceNumber}</td>
                          <td>{purchase.supplierName}</td>
                          <td>{purchase.invoiceDate}</td>
                          <td>₹{parseFloat(purchase.taxableValue || 0).toFixed(2)}</td>
                          <td>₹{cgstITC.toFixed(2)}</td>
                          <td>₹{sgstITC.toFixed(2)}</td>
                          <td>₹{igstITC.toFixed(2)}</td>
                          <td>₹{cessITC.toFixed(2)}</td>
                          <td>₹{totalITC.toFixed(2)}</td>
                          <td>
                            <span className={`itc-status ${purchase.itcEligible !== false ? 'eligible' : 'ineligible'}`}>
                              {purchase.itcEligible !== false ? 'Eligible' : 'Ineligible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tax Summary Section */}
        {activeSection === 'tax' && (
          <div className="tax-section">
            <h3>Tax Summary</h3>
            <div className="tax-summary">
              <div className="tax-item">
                <span className="label">Total Taxable Value:</span>
                <span className="value">₹{reportData.taxSummary.totalTaxableValue.toFixed(2)}</span>
              </div>
              <div className="tax-item">
                <span className="label">CGST Payable:</span>
                <span className="value">₹{reportData.taxSummary.totalCGST.toFixed(2)}</span>
              </div>
              <div className="tax-item">
                <span className="label">SGST Payable:</span>
                <span className="value">₹{reportData.taxSummary.totalSGST.toFixed(2)}</span>
              </div>
              <div className="tax-item">
                <span className="label">IGST Payable:</span>
                <span className="value">₹{reportData.taxSummary.totalIGST.toFixed(2)}</span>
              </div>
              <div className="tax-item">
                <span className="label">Cess Payable:</span>
                <span className="value">₹{reportData.taxSummary.totalCess.toFixed(2)}</span>
              </div>
              <div className="tax-item total">
                <span className="label">Total Tax Liability:</span>
                <span className="value">₹{reportData.taxSummary.totalTaxLiability.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
