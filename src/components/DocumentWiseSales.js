import React from 'react';
import { FileText } from 'lucide-react';
import './DocumentWiseSales.css';

const DocumentWiseSales = ({ salesEntries }) => {
  // Group entries by invoice type
  const getDocumentWiseSummary = () => {
    const documentMap = {};

    salesEntries.forEach(entry => {
      const docType = entry.invoiceType || 'Regular';
      
      if (!documentMap[docType]) {
        documentMap[docType] = {
          documentType: docType,
          count: 0,
          totalValue: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0
        };
      }

      documentMap[docType].count += 1;
      documentMap[docType].totalValue += parseFloat(entry.invoiceValue || 0);
      documentMap[docType].taxableValue += parseFloat(entry.taxableValue || 0);
      documentMap[docType].cgst += parseFloat(entry.centralTax || 0);
      documentMap[docType].sgst += parseFloat(entry.stateTax || 0);
      documentMap[docType].igst += parseFloat(entry.integratedTax || 0);
    });

    return Object.values(documentMap);
  };

  const documentSummary = getDocumentWiseSummary();

  // Calculate totals
  const totals = documentSummary.reduce((acc, doc) => ({
    count: acc.count + doc.count,
    totalValue: acc.totalValue + doc.totalValue,
    taxableValue: acc.taxableValue + doc.taxableValue,
    cgst: acc.cgst + doc.cgst,
    sgst: acc.sgst + doc.sgst,
    igst: acc.igst + doc.igst
  }), { count: 0, totalValue: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 });

  return (
    <div className="document-wise-sales">
      <div className="document-header">
        <div className="header-icon">
          <FileText size={32} />
        </div>
        <div className="header-content">
          <h2>Document-wise Summary</h2>
          <p>Summary grouped by invoice types</p>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Document Types</div>
            <div className="card-value">{documentSummary.length}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Total Documents</div>
            <div className="card-value">{totals.count}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Taxable Value</div>
            <div className="card-value">₹{totals.taxableValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Total Value</div>
            <div className="card-value">₹{totals.totalValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="document-table-container">
        <h3>Document Type Details</h3>
        <div className="table-wrapper">
          <table className="document-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Count</th>
                <th>Taxable Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {documentSummary.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No document data available
                  </td>
                </tr>
              ) : (
                documentSummary.map((doc, index) => (
                  <tr key={index}>
                    <td><strong>{doc.documentType}</strong></td>
                    <td>{doc.count}</td>
                    <td>₹{doc.taxableValue.toFixed(2)}</td>
                    <td>₹{doc.cgst.toFixed(2)}</td>
                    <td>₹{doc.sgst.toFixed(2)}</td>
                    <td>₹{doc.igst.toFixed(2)}</td>
                    <td><strong>₹{doc.totalValue.toFixed(2)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
            {documentSummary.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>{totals.count}</strong></td>
                  <td><strong>₹{totals.taxableValue.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.cgst.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.sgst.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.igst.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.totalValue.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentWiseSales;
