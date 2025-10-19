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

    // ITC Summary
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
    itcSummary.utilizedITC = 0; // This would be calculated based on tax liability
    itcSummary.carryForwardITC = itcSummary.totalITC - itcSummary.utilizedITC;

    // Tax Summary
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
            <div className="section-header">
              <h3>Sales Details</h3>
              <div className="section-tabs">
                <button className="tab-btn active">B2B Sales</button>
                <button className="tab-btn">B2C Sales</button>
                <button className="tab-btn">Export Sales</button>
              </div>
            </div>
            
            <div className="sales-table">
              <table>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>GSTIN</th>
                    <th>Taxable Value</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.b2bSales.map((sale, index) => (
                    <tr key={index}>
                      <td>{sale.invoiceNumber}</td>
                      <td>{sale.invoiceDate}</td>
                      <td>{sale.customerName}</td>
                      <td>{sale.customerGSTIN}</td>
                      <td>₹{parseFloat(sale.taxableValue || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(sale.centralTax || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(sale.stateTax || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(sale.integratedTax || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(sale.invoiceValue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Purchase Details Section */}
        {activeSection === 'purchases' && (
          <div className="purchases-section">
            <h3>Purchase Details</h3>
            <div className="purchases-table">
              <table>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>GSTIN</th>
                    <th>Taxable Value</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>ITC Eligible</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.purchases.map((purchase, index) => (
                    <tr key={index}>
                      <td>{purchase.invoiceNumber}</td>
                      <td>{purchase.invoiceDate}</td>
                      <td>{purchase.supplierName}</td>
                      <td>{purchase.supplierGSTIN}</td>
                      <td>₹{parseFloat(purchase.taxableValue || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(purchase.centralTax || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(purchase.stateTax || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(purchase.integratedTax || 0).toFixed(2)}</td>
                      <td>{purchase.itcEligible !== false ? 'Yes' : 'No'}</td>
                      <td>₹{parseFloat(purchase.invoiceValue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className="itc-cards">
              <div className="itc-card">
                <div className="card-label">Total ITC Available</div>
                <div className="card-value">₹{reportData.itcSummary.totalITC.toFixed(2)}</div>
              </div>
              <div className="itc-card">
                <div className="card-label">CGST ITC</div>
                <div className="card-value">₹{reportData.itcSummary.cgstITC.toFixed(2)}</div>
              </div>
              <div className="itc-card">
                <div className="card-label">SGST ITC</div>
                <div className="card-value">₹{reportData.itcSummary.sgstITC.toFixed(2)}</div>
              </div>
              <div className="itc-card">
                <div className="card-label">IGST ITC</div>
                <div className="card-value">₹{reportData.itcSummary.igstITC.toFixed(2)}</div>
              </div>
              <div className="itc-card">
                <div className="card-label">Utilized ITC</div>
                <div className="card-value">₹{reportData.itcSummary.utilizedITC.toFixed(2)}</div>
              </div>
              <div className="itc-card">
                <div className="card-label">Carry Forward</div>
                <div className="card-value">₹{reportData.itcSummary.carryForwardITC.toFixed(2)}</div>
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
