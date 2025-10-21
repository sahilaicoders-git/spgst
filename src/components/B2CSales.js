import React, { useState, useEffect } from 'react';
import { Users, Plus, Save, X, Calculator, Edit, Trash2 } from 'lucide-react';
import './B2CSales.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const B2CSales = ({ salesEntries, selectedClient, selectedMonth }) => {
  const [dbB2CEntries, setDbB2CEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const dbManager = new ClientDatabaseManager();

  // Filter B2C entries from props (for backward compatibility)
  const propB2CEntries = salesEntries ? salesEntries.filter(entry => entry.transactionType === 'B2C') : [];
  
  // Use database entries if available, otherwise fall back to prop entries
  const b2cEntries = dbB2CEntries.length > 0 ? dbB2CEntries : propB2CEntries;

  // Indian states for place of supply
  const indianStates = [
    '01-Jammu and Kashmir', '02-Himachal Pradesh', '03-Punjab', '04-Chandigarh',
    '05-Uttarakhand', '06-Haryana', '07-Delhi', '08-Rajasthan', '09-Uttar Pradesh',
    '10-Bihar', '11-Sikkim', '12-Arunachal Pradesh', '13-Nagaland', '14-Manipur',
    '15-Mizoram', '16-Tripura', '17-Meghalaya', '18-Assam', '19-West Bengal',
    '20-Jharkhand', '21-Odisha', '22-Chhattisgarh', '23-Madhya Pradesh',
    '24-Gujarat', '25-Daman and Diu', '26-Dadra and Nagar Haveli',
    '27-Maharashtra', '28-Andhra Pradesh', '29-Karnataka', '30-Goa',
    '31-Lakshadweep', '32-Kerala', '33-Tamil Nadu', '34-Puducherry',
    '35-Andaman and Nicobar Islands', '36-Telangana', '37-Andhra Pradesh'
  ];

  // Function to extract state code from GST number and get state name
  const getStateFromGSTNumber = (gstNumber) => {
    if (!gstNumber || gstNumber.length < 2) return '';
    
    // Extract first 2 digits (state code) from GST number
    const stateCode = gstNumber.substring(0, 2);
    
    // Find the state name from the state code
    const state = indianStates.find(state => state.startsWith(stateCode + '-'));
    return state || '';
  };

  // Form state
  const [formData, setFormData] = useState({
    taxableValue: '',
    gstRate: '18',
    supplyType: 'intra', // intra or inter
    placeOfSupply: selectedClient ? getStateFromGSTNumber(selectedClient.gstNo) : '',
    hsnCode: '',
    quantity: '',
    unitPrice: ''
  });

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

  // Auto-select place of supply based on client's GST state
  useEffect(() => {
    if (selectedClient && selectedClient.gstNo) {
      const clientState = getStateFromGSTNumber(selectedClient.gstNo);
      if (clientState) {
        setFormData(prev => ({
          ...prev,
          placeOfSupply: clientState
        }));
      }
    }
  }, [selectedClient]);

  // Load B2C sales from database when client or month changes
  useEffect(() => {
    if (selectedClient && selectedMonth) {
      loadB2CSalesFromDB();
    }
  }, [selectedClient, selectedMonth]);

  const loadB2CSalesFromDB = async () => {
    if (!selectedClient || !selectedMonth) return;
    
    setIsLoading(true);
    try {
      const sales = await dbManager.getClientB2CSales(selectedClient.id, {
        month: selectedMonth
      });
      setDbB2CEntries(sales);
    } catch (error) {
      console.error('Error loading B2C sales from database:', error);
      setDbB2CEntries([]);
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
    
    if (formData.supplyType === 'inter') {
      // Inter-state: IGST only
      return {
        centralTax: 0,
        stateTax: 0,
        integratedTax: totalTax,
        totalTax: totalTax,
        invoiceValue: taxableValue + totalTax
      };
    } else {
      // Intra-state: CGST + SGST
      const halfTax = totalTax / 2;
      return {
        centralTax: halfTax,
        stateTax: halfTax,
        integratedTax: 0,
        totalTax: totalTax,
        invoiceValue: taxableValue + totalTax
      };
    }
  };

  const gstCalculation = calculateGST();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedMonth) {
      alert('Please select a client and month first');
      return;
    }

    if (!formData.taxableValue) {
      alert('Please enter taxable value');
      return;
    }

    setIsSaving(true);
    try {
      const b2cSaleData = {
        month: selectedMonth,
        supplyType: formData.supplyType,
        placeOfSupply: formData.placeOfSupply,
        gstRate: formData.gstRate,
        taxableValue: parseFloat(formData.taxableValue),
        centralTax: gstCalculation.centralTax,
        stateTax: gstCalculation.stateTax,
        integratedTax: gstCalculation.integratedTax,
        invoiceValue: gstCalculation.invoiceValue,
        hsnCode: formData.hsnCode,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        status: 'active'
      };

      const result = await dbManager.addClientB2CSale(selectedClient.id, b2cSaleData);
      
      if (result) {
        alert('B2C sale added successfully!');
        // Reset form but keep the auto-selected place of supply
        const clientState = selectedClient ? getStateFromGSTNumber(selectedClient.gstNo) : '';
        setFormData({
          taxableValue: '',
          gstRate: '18',
          supplyType: 'intra',
          placeOfSupply: clientState,
          hsnCode: '',
          quantity: '',
          unitPrice: ''
        });
        setShowAddForm(false);
        await loadB2CSalesFromDB();
      }
    } catch (error) {
      console.error('Error saving B2C sale:', error);
      alert('Error saving B2C sale. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate B2C summary
  const getB2CSummary = () => {
    const summary = {
      totalInvoices: b2cEntries.length,
      totalInvoiceValue: 0,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalTax: 0
    };

    b2cEntries.forEach(entry => {
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
      supplyType: entry.supplyType || 'intra',
      placeOfSupply: entry.placeOfSupply || '',
      gstRate: entry.gstRate || '18',
      taxableValue: entry.taxableValue || '',
      hsnCode: entry.hsnCode || '',
      quantity: entry.quantity || '',
      unitPrice: entry.unitPrice || ''
    });
    setShowEditModal(true);
  };

  // Handle update entry
  const handleUpdateEntry = async () => {
    if (!editingEntry || !selectedClient) return;

    try {
      // Calculate GST amounts for the updated data
      const taxableValue = parseFloat(editFormData.taxableValue) || 0;
      const gstRate = parseFloat(editFormData.gstRate) || 0;
      
      let centralTax = 0, stateTax = 0, integratedTax = 0, totalTax = 0, invoiceValue = taxableValue;
      
      if (taxableValue > 0 && gstRate > 0) {
        totalTax = (taxableValue * gstRate) / 100;
        
        if (editFormData.supplyType === 'inter') {
          integratedTax = totalTax;
        } else {
          const halfTax = totalTax / 2;
          centralTax = halfTax;
          stateTax = halfTax;
        }
        
        invoiceValue = taxableValue + totalTax;
      }

      const updatedData = {
        month: selectedMonth,
        supplyType: editFormData.supplyType,
        placeOfSupply: editFormData.placeOfSupply,
        gstRate: editFormData.gstRate,
        taxableValue: taxableValue,
        centralTax: centralTax,
        stateTax: stateTax,
        integratedTax: integratedTax,
        invoiceValue: invoiceValue,
        hsnCode: editFormData.hsnCode,
        quantity: editFormData.quantity ? parseFloat(editFormData.quantity) : null,
        unitPrice: editFormData.unitPrice ? parseFloat(editFormData.unitPrice) : null,
        status: 'active'
      };

      await dbManager.updateClientB2CSale(selectedClient.id, editingEntry.id, updatedData);
      
      // Reload data from database
      await loadB2CSalesFromDB();
      
      // Close modal
      setShowEditModal(false);
      setEditingEntry(null);
      setEditFormData({});
      
      alert('B2C entry updated successfully!');
    } catch (error) {
      console.error('Error updating B2C entry:', error);
      alert('Error updating entry. Please try again.');
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId) => {
    if (!selectedClient) return;
    
    if (window.confirm('Are you sure you want to delete this B2C entry?')) {
      try {
        await dbManager.deleteClientB2CSale(selectedClient.id, entryId);
        
        // Reload data from database
        await loadB2CSalesFromDB();
        
        alert('B2C entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting B2C entry:', error);
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

  const summary = getB2CSummary();

  return (
    <div className="b2c-sales">
      <div className="b2c-header">
        <div className="header-left">
        <div className="header-icon">
          <Users size={32} />
        </div>
        <div className="header-content">
          <h2>B2C Sales Summary</h2>
          <p>Business to Consumer transactions</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn add-btn"
            onClick={() => setShowAddForm(true)}
            disabled={!selectedClient || !selectedMonth}
          >
            <Plus size={18} />
            Add B2C Sale
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

      {/* Add B2C Form - Full Page */}
      {showAddForm && (
        <div className="add-b2c-page">
          <div className="add-b2c-page-header">
            <div className="header-left">
              <button 
                className="back-btn"
                onClick={() => setShowAddForm(false)}
              >
                <X size={20} />
                <span>Back</span>
              </button>
              <div>
                <h2>Add B2C Sale</h2>
                <p className="month-info">Month: {selectedMonth}</p>
              </div>
            </div>
          </div>

          <div className="add-b2c-page-content">
            <form onSubmit={handleSubmit} className="b2c-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="supplyType">Supply Type *</label>
                  <select
                    id="supplyType"
                    name="supplyType"
                    value={formData.supplyType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="intra">Intra-state (CGST + SGST)</option>
                    <option value="inter">Inter-state (IGST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="placeOfSupply">Place of Supply</label>
                  <select
                    id="placeOfSupply"
                    name="placeOfSupply"
                    value={formData.placeOfSupply}
                    onChange={handleInputChange}
                  >
                    <option value="">Select state</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {formData.placeOfSupply && selectedClient && (
                    <small className="auto-selected-info">
                      ✓ Auto-selected based on client GST state
                    </small>
                  )}
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

                <div className="form-group">
                  <label htmlFor="hsnCode">HSN Code</label>
                  <input
                    type="text"
                    id="hsnCode"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleInputChange}
                    placeholder="Enter HSN code"
                  />
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
                  <label htmlFor="unitPrice">Unit Price</label>
                  <input
                    type="number"
                    id="unitPrice"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price"
                  />
                </div>
              </div>

              {/* GST Calculation Display */}
              {formData.taxableValue && (
                <div className="gst-calculation">
                  <h4><Calculator size={20} /> GST Calculation</h4>
                  <div className="calculation-grid">
                    <div className="calc-item">
                      <span>Taxable Value:</span>
                      <span>₹{parseFloat(formData.taxableValue || 0).toFixed(2)}</span>
                    </div>
                    <div className="calc-item">
                      <span>GST Rate:</span>
                      <span>{formData.gstRate}%</span>
                    </div>
                    {formData.supplyType === 'intra' ? (
                      <>
                        <div className="calc-item">
                          <span>CGST ({formData.gstRate/2}%):</span>
                          <span>₹{gstCalculation.centralTax.toFixed(2)}</span>
                        </div>
                        <div className="calc-item">
                          <span>SGST ({formData.gstRate/2}%):</span>
                          <span>₹{gstCalculation.stateTax.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="calc-item">
                        <span>IGST ({formData.gstRate}%):</span>
                        <span>₹{gstCalculation.integratedTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="calc-item total">
                      <span>Total Tax:</span>
                      <span>₹{gstCalculation.totalTax.toFixed(2)}</span>
                    </div>
                    <div className="calc-item total">
                      <span>Invoice Value:</span>
                      <span>₹{gstCalculation.invoiceValue.toFixed(2)}</span>
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
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save B2C Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="b2c-table-container">
        <div className="table-header">
        <h3>B2C Transaction Details</h3>
          {isLoading && <div className="loading-indicator">Loading...</div>}
        </div>
        <div className="table-wrapper">
          <table className="b2c-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Supply Type</th>
                <th>GST Rate</th>
                <th>Taxable Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Invoice Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {b2cEntries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    {isLoading ? 'Loading B2C transactions...' : 'No B2C transactions found'}
                  </td>
                </tr>
              ) : (
                b2cEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.month}</td>
                    <td>{entry.supplyType === 'inter' ? 'Inter-state' : 'Intra-state'}</td>
                    <td>{entry.gstRate}%</td>
                    <td>₹{parseFloat(entry.taxableValue || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.centralTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.stateTax || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(entry.integratedTax || 0).toFixed(2)}</td>
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
                <td colSpan="3"><strong>TOTAL</strong></td>
                <td><strong>₹{summary.totalTaxableValue.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalCGST.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalSGST.toFixed(2)}</strong></td>
                <td><strong>₹{summary.totalIGST.toFixed(2)}</strong></td>
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
              <div>
                <h3>Edit B2C Entry</h3>
                <p className="month-info">Month: {selectedMonth}</p>
              </div>
              <button className="close-btn" onClick={closeEditModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="editSupplyType">Supply Type *</label>
                  <select
                    id="editSupplyType"
                    name="supplyType"
                    value={editFormData.supplyType}
                    onChange={(e) => setEditFormData({...editFormData, supplyType: e.target.value})}
                    required
                  >
                    <option value="intra">Intra-state (CGST + SGST)</option>
                    <option value="inter">Inter-state (IGST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editPlaceOfSupply">Place of Supply</label>
                  <select
                    id="editPlaceOfSupply"
                    name="placeOfSupply"
                    value={editFormData.placeOfSupply}
                    onChange={(e) => setEditFormData({...editFormData, placeOfSupply: e.target.value})}
                  >
                    <option value="">Select state</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editGstRate">GST Rate *</label>
                  <select
                    id="editGstRate"
                    name="gstRate"
                    value={editFormData.gstRate}
                    onChange={(e) => setEditFormData({...editFormData, gstRate: e.target.value})}
                    required
                  >
                    {gstRates.map(rate => (
                      <option key={rate.value} value={rate.value}>{rate.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editTaxableValue">Taxable Value *</label>
                  <input
                    type="number"
                    id="editTaxableValue"
                    name="taxableValue"
                    value={editFormData.taxableValue}
                    onChange={(e) => setEditFormData({...editFormData, taxableValue: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter taxable amount"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editHsnCode">HSN Code</label>
                  <input
                    type="text"
                    id="editHsnCode"
                    name="hsnCode"
                    value={editFormData.hsnCode}
                    onChange={(e) => setEditFormData({...editFormData, hsnCode: e.target.value})}
                    placeholder="Enter HSN code"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editQuantity">Quantity</label>
                  <input
                    type="number"
                    id="editQuantity"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                    min="0"
                    step="0.01"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editUnitPrice">Unit Price</label>
                  <input
                    type="number"
                    id="editUnitPrice"
                    name="unitPrice"
                    value={editFormData.unitPrice}
                    onChange={(e) => setEditFormData({...editFormData, unitPrice: e.target.value})}
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price"
                  />
                </div>
              </div>

              {/* GST Calculation Display */}
              {editFormData.taxableValue && (
                <div className="gst-calculation">
                  <h4><Calculator size={20} /> GST Calculation</h4>
                  <div className="calculation-grid">
                    <div className="calc-item">
                      <span>Taxable Value:</span>
                      <span>₹{parseFloat(editFormData.taxableValue || 0).toFixed(2)}</span>
                    </div>
                    <div className="calc-item">
                      <span>GST Rate:</span>
                      <span>{editFormData.gstRate}%</span>
                    </div>
                    {editFormData.supplyType === 'intra' ? (
                      <>
                        <div className="calc-item">
                          <span>CGST ({editFormData.gstRate/2}%):</span>
                          <span>₹{((parseFloat(editFormData.taxableValue || 0) * parseFloat(editFormData.gstRate || 0) / 100) / 2).toFixed(2)}</span>
                        </div>
                        <div className="calc-item">
                          <span>SGST ({editFormData.gstRate/2}%):</span>
                          <span>₹{((parseFloat(editFormData.taxableValue || 0) * parseFloat(editFormData.gstRate || 0) / 100) / 2).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="calc-item">
                        <span>IGST ({editFormData.gstRate}%):</span>
                        <span>₹{((parseFloat(editFormData.taxableValue || 0) * parseFloat(editFormData.gstRate || 0) / 100)).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="calc-item total">
                      <span>Total Tax:</span>
                      <span>₹{((parseFloat(editFormData.taxableValue || 0) * parseFloat(editFormData.gstRate || 0) / 100)).toFixed(2)}</span>
                    </div>
                    <div className="calc-item total">
                      <span>Invoice Value:</span>
                      <span>₹{(parseFloat(editFormData.taxableValue || 0) + (parseFloat(editFormData.taxableValue || 0) * parseFloat(editFormData.gstRate || 0) / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
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

export default B2CSales;