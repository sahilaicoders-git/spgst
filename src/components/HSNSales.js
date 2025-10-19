import React, { useState, useEffect } from 'react';
import { Package, Plus, Save, X, Calculator, Edit } from 'lucide-react';
import './HSNSales.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const HSNSales = ({ salesEntries, selectedClient, selectedMonth }) => {
  const [dbB2BEntries, setDbB2BEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const dbManager = new ClientDatabaseManager();

  // Filter B2B entries from props (for backward compatibility)
  const propB2BEntries = salesEntries ? salesEntries.filter(entry => entry.transactionType === 'B2B') : [];
  
  // Use database entries if available, otherwise fall back to prop entries
  const b2bEntries = dbB2BEntries.length > 0 ? dbB2BEntries : propB2BEntries;

  // Form state for adding new HSN entry
  const [formData, setFormData] = useState({
    hsnCode: '',
    unit: 'NOS',
    quantity: '',
    taxableValue: '',
    gstRate: '18'
  });

  // Standard units dropdown
  const units = [
    'NOS', 'KGS', 'LTR', 'MTR', 'SQM', 'CBM', 'PCS', 'BOX', 'SET', 'PAIR',
    'DOZ', 'GROSS', 'TON', 'GRAM', 'ML', 'MM', 'CM', 'FT', 'INCH', 'YARD'
  ];

  // GST rates
  const gstRates = [
    { value: '0', label: '0%' },
    { value: '0.25', label: '0.25%' },
    { value: '3', label: '3%' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' }
  ];

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

  // Calculate GST amounts
  const calculateGST = () => {
    const taxableValue = parseFloat(formData.taxableValue) || 0;
    const gstRate = parseFloat(formData.gstRate) || 0;
    
    if (taxableValue === 0 || gstRate === 0) {
      return {
        centralTax: 0,
        stateTax: 0,
        integratedTax: 0,
        totalTax: 0,
        invoiceValue: taxableValue
      };
    }

    const totalTax = (taxableValue * gstRate) / 100;
    
    // For HSN summary, we'll use intra-state calculation (CGST + SGST)
    return {
      centralTax: totalTax / 2,
      stateTax: totalTax / 2,
      integratedTax: 0,
      totalTax: totalTax,
      invoiceValue: taxableValue + totalTax
    };
  };

  const gstCalculation = calculateGST();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedMonth) {
      alert('Please select a client and month');
      return;
    }

    if (!formData.hsnCode || !formData.taxableValue) {
      alert('HSN Code and Taxable Value are required');
      return;
    }

    setIsSaving(true);
    try {
      const saleData = {
        customerGSTIN: 'HSN-SUMMARY',
        customerName: 'HSN Summary Entry',
        invoiceNumber: `HSN-${Date.now()}`,
        invoiceType: 'Regular',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceValue: gstCalculation.invoiceValue,
        placeOfSupply: '27-Maharashtra',
        reverseCharge: 'No',
        taxableValue: parseFloat(formData.taxableValue),
        integratedTax: gstCalculation.integratedTax,
        centralTax: gstCalculation.centralTax,
        stateTax: gstCalculation.stateTax,
        cess: 0,
        taxRate: formData.gstRate,
        month: selectedMonth,
        transactionType: 'B2B',
        hsnCode: formData.hsnCode,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unitPrice: formData.taxableValue ? parseFloat(formData.taxableValue) / (formData.quantity ? parseFloat(formData.quantity) : 1) : null,
        ecommerceGSTIN: '',
        status: 'active'
      };

      const result = await dbManager.addClientSale(selectedClient.id, saleData);
      
      if (result) {
        alert('HSN entry added successfully!');
        setFormData({
          hsnCode: '',
          unit: 'NOS',
          quantity: '',
          taxableValue: '',
          gstRate: '18'
        });
        setShowAddForm(false);
        await loadB2BSalesFromDB();
      }
    } catch (error) {
      console.error('Error saving HSN entry:', error);
      alert('Error saving HSN entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle inline editing
  const handleEditClick = (hsnEntry) => {
    setEditingRow(hsnEntry);
    setEditFormData({
      hsnCode: hsnEntry.hsnCode,
      unit: hsnEntry.unit,
      quantity: hsnEntry.quantity.toString(),
      taxableValue: hsnEntry.taxableValue.toString(),
      gstRate: hsnEntry.gstRate
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedClient || !selectedMonth) {
      alert('Please select a client and month');
      return;
    }

    if (!editFormData.hsnCode || !editFormData.taxableValue) {
      alert('HSN Code and Taxable Value are required');
      return;
    }

    setIsSaving(true);
    try {
      // Calculate GST for the edited values
      const taxableValue = parseFloat(editFormData.taxableValue) || 0;
      const gstRate = parseFloat(editFormData.gstRate) || 0;
      const totalTax = (taxableValue * gstRate) / 100;
      const centralTax = totalTax / 2;
      const stateTax = totalTax / 2;
      const invoiceValue = taxableValue + totalTax;

      const saleData = {
        customerGSTIN: 'HSN-SUMMARY',
        customerName: 'HSN Summary Entry',
        invoiceNumber: `HSN-${Date.now()}`,
        invoiceType: 'Regular',
        invoiceDate: new Date().toISOString().split('T')[0],
        invoiceValue: invoiceValue,
        placeOfSupply: '27-Maharashtra',
        reverseCharge: 'No',
        taxableValue: taxableValue,
        integratedTax: 0,
        centralTax: centralTax,
        stateTax: stateTax,
        cess: 0,
        taxRate: editFormData.gstRate,
        month: selectedMonth,
        transactionType: 'B2B',
        hsnCode: editFormData.hsnCode,
        quantity: editFormData.quantity ? parseFloat(editFormData.quantity) : null,
        unitPrice: editFormData.taxableValue ? parseFloat(editFormData.taxableValue) / (editFormData.quantity ? parseFloat(editFormData.quantity) : 1) : null,
        ecommerceGSTIN: '',
        status: 'active'
      };

      const result = await dbManager.addClientSale(selectedClient.id, saleData);
      
      if (result) {
        alert('HSN entry updated successfully!');
        setEditingRow(null);
        setEditFormData({});
        await loadB2BSalesFromDB();
      }
    } catch (error) {
      console.error('Error updating HSN entry:', error);
      alert('Error updating HSN entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditFormData({});
  };

  // Calculate HSN summary grouped by GST rate
  const getHSNSummary = () => {
    const hsnMap = {};

    b2bEntries.forEach(entry => {
      const hsn = entry.hsnCode || 'Not Specified';
      const gstRate = entry.taxRate || '0';
      const key = `${hsn}-${gstRate}`;
      
      if (!hsnMap[key]) {
        hsnMap[key] = {
          hsnCode: hsn,
          gstRate: gstRate,
          unit: entry.unit || 'NOS',
          quantity: 0,
          totalValue: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0
        };
      }

      hsnMap[key].quantity += parseFloat(entry.quantity || 0);
      hsnMap[key].totalValue += parseFloat(entry.invoiceValue || 0);
      hsnMap[key].taxableValue += parseFloat(entry.taxableValue || 0);
      hsnMap[key].cgst += parseFloat(entry.centralTax || 0);
      hsnMap[key].sgst += parseFloat(entry.stateTax || 0);
      hsnMap[key].igst += parseFloat(entry.integratedTax || 0);
    });

    return Object.values(hsnMap);
  };

  const hsnSummary = getHSNSummary();

  // Calculate totals
  const totals = hsnSummary.reduce((acc, hsn) => ({
    quantity: acc.quantity + hsn.quantity,
    taxableValue: acc.taxableValue + hsn.taxableValue,
    cgst: acc.cgst + hsn.cgst,
    sgst: acc.sgst + hsn.sgst,
    igst: acc.igst + hsn.igst,
    totalValue: acc.totalValue + hsn.totalValue
  }), { quantity: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalValue: 0 });

  return (
    <div className="hsn-sales">
      <div className="hsn-header">
        <div className="header-left">
        <div className="header-icon">
          <Package size={32} />
        </div>
        <div className="header-content">
          <h2>HSN Code Summary</h2>
            <p>B2B sales grouped by HSN codes and GST rates</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn add-btn"
            onClick={() => setShowAddForm(true)}
            disabled={!selectedClient || !selectedMonth}
          >
            <Plus size={20} />
            Add HSN Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Total HSN Codes</div>
            <div className="card-value">{hsnSummary.length}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-content">
            <div className="card-label">Total Quantity</div>
            <div className="card-value">{totals.quantity.toFixed(2)}</div>
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

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add HSN Entry</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="hsn-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="hsnCode">HSN Code *</label>
                  <input
                    type="text"
                    id="hsnCode"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter HSN code"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="unit">Unit</label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gstRate">GST Rate *</label>
                  <select
                    id="gstRate"
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleInputChange}
                    required
                  >
                    {gstRates.map(rate => (
                      <option key={rate.value} value={rate.value}>{rate.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="taxableValue">Taxable Value *</label>
                  <input
                    type="number"
                    id="taxableValue"
                    name="taxableValue"
                    value={formData.taxableValue}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter taxable amount"
                  />
                </div>
              </div>

              {/* GST Calculation Display */}
              {formData.taxableValue && (
                <div className="gst-calculation">
                  <h4><Calculator size={20} /> GST Calculation</h4>
                  <div className="calculation-grid">
                    <div className="calc-item">
                      <span className="calc-label">Taxable Value:</span>
                      <span className="calc-value">₹{parseFloat(formData.taxableValue || 0).toFixed(2)}</span>
                    </div>
                    <div className="calc-item">
                      <span className="calc-label">GST Rate:</span>
                      <span className="calc-value">{formData.gstRate}%</span>
                    </div>
                    <div className="calc-item">
                      <span className="calc-label">CGST:</span>
                      <span className="calc-value">₹{gstCalculation.centralTax.toFixed(2)}</span>
                    </div>
                    <div className="calc-item">
                      <span className="calc-label">SGST:</span>
                      <span className="calc-value">₹{gstCalculation.stateTax.toFixed(2)}</span>
                    </div>
                    <div className="calc-item">
                      <span className="calc-label">Total Tax:</span>
                      <span className="calc-value">₹{gstCalculation.totalTax.toFixed(2)}</span>
                    </div>
                    <div className="calc-item">
                      <span className="calc-label">Invoice Value:</span>
                      <span className="calc-value">₹{gstCalculation.invoiceValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="btn-loader"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save HSN Entry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HSN Table */}
      <div className="hsn-table-container">
        <h3>HSN Code Details</h3>
        {isLoading && <div className="loading-indicator">Loading...</div>}
        <div className="table-wrapper">
          <table className="hsn-table">
            <thead>
              <tr>
                <th>HSN Code</th>
                <th>GST Rate</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Taxable Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Total Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hsnSummary.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    {isLoading ? 'Loading HSN data...' : 'No HSN data available'}
                  </td>
                </tr>
              ) : (
                hsnSummary.map((hsn, index) => (
                  <tr key={index}>
                    {editingRow && editingRow.hsnCode === hsn.hsnCode && editingRow.gstRate === hsn.gstRate ? (
                      // Editing mode
                      <>
                        <td>
                          <input
                            type="text"
                            name="hsnCode"
                            value={editFormData.hsnCode}
                            onChange={handleEditInputChange}
                            className="inline-input"
                          />
                        </td>
                        <td>
                          <select
                            name="gstRate"
                            value={editFormData.gstRate}
                            onChange={handleEditInputChange}
                            className="inline-select"
                          >
                            {gstRates.map(rate => (
                              <option key={rate.value} value={rate.value}>{rate.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            name="unit"
                            value={editFormData.unit}
                            onChange={handleEditInputChange}
                            className="inline-select"
                          >
                            {units.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            name="quantity"
                            value={editFormData.quantity}
                            onChange={handleEditInputChange}
                            className="inline-input"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="taxableValue"
                            value={editFormData.taxableValue}
                            onChange={handleEditInputChange}
                            className="inline-input"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>₹{((parseFloat(editFormData.taxableValue) || 0) * parseFloat(editFormData.gstRate) / 100 / 2).toFixed(2)}</td>
                        <td>₹{((parseFloat(editFormData.taxableValue) || 0) * parseFloat(editFormData.gstRate) / 100 / 2).toFixed(2)}</td>
                        <td>₹0.00</td>
                        <td>₹{((parseFloat(editFormData.taxableValue) || 0) * (1 + parseFloat(editFormData.gstRate) / 100)).toFixed(2)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-save"
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              className="btn-cancel"
                              onClick={handleCancelEdit}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Display mode
                      <>
                    <td><strong>{hsn.hsnCode}</strong></td>
                        <td>{hsn.gstRate}%</td>
                        <td>{hsn.unit}</td>
                    <td>{hsn.quantity.toFixed(2)}</td>
                    <td>₹{hsn.taxableValue.toFixed(2)}</td>
                    <td>₹{hsn.cgst.toFixed(2)}</td>
                    <td>₹{hsn.sgst.toFixed(2)}</td>
                    <td>₹{hsn.igst.toFixed(2)}</td>
                    <td><strong>₹{hsn.totalValue.toFixed(2)}</strong></td>
                        <td>
                          <button 
                            className="btn-edit"
                            onClick={() => handleEditClick(hsn)}
                            disabled={isSaving}
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {hsnSummary.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td><strong>Total</strong></td>
                  <td>-</td>
                  <td>-</td>
                  <td><strong>{totals.quantity.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.taxableValue.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.cgst.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.sgst.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.igst.toFixed(2)}</strong></td>
                  <td><strong>₹{totals.totalValue.toFixed(2)}</strong></td>
                  <td>-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default HSNSales;