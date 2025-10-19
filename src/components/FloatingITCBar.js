import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, CreditCard, Calculator, TrendingUp, AlertCircle, Plus, Calendar } from 'lucide-react';
import './FloatingITCBar.css';
import ClientDatabaseManager from '../utils/ClientDatabaseManager';

const FloatingITCBar = ({ selectedClient, selectedMonth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddOldSetoff, setShowAddOldSetoff] = useState(false);
  const [oldSetoffData, setOldSetoffData] = useState({
    month: '',
    cgst: 0,
    sgst: 0,
    igst: 0
  });
  const [itcData, setItcData] = useState({
    // Old Setoff (Carry Forward)
    oldSetoffCGST: 0,
    oldSetoffSGST: 0,
    oldSetoffIGST: 0,
    
    // Current Month Input GST (from purchases)
    inputCGST: 0,
    inputSGST: 0,
    inputIGST: 0,
    
    // Total Available ITC
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    
    // Output GST (from sales)
    outputCGST: 0,
    outputSGST: 0,
    outputIGST: 0,
    
    // Balance ITC
    balanceCGST: 0,
    balanceSGST: 0,
    balanceIGST: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const dbManager = new ClientDatabaseManager();

  // Load ITC data when client or month changes
  useEffect(() => {
    if (selectedClient && selectedMonth) {
      loadITCData();
    }
  }, [selectedClient, selectedMonth]);

  const loadITCData = async () => {
    if (!selectedClient || !selectedMonth) return;
    
    setIsLoading(true);
    try {
      // Load purchase data for Input GST calculation
      const purchases = await dbManager.getClientPurchases(selectedClient.id, {
        month: selectedMonth
      });

      // Load sales data for Output GST calculation
      const sales = await dbManager.getClientSales(selectedClient.id, {
        month: selectedMonth
      });

      // Load B2C sales data for Output GST calculation
      const b2cSales = await dbManager.getClientB2CSales(selectedClient.id, {
        month: selectedMonth
      });

      // Calculate ITC from all data sources
      const itcSummary = calculateITC(purchases, sales, b2cSales);
      setItcData(itcSummary);
    } catch (error) {
      console.error('Error loading ITC data:', error);
      setItcData({
        oldSetoffCGST: 0,
        oldSetoffSGST: 0,
        oldSetoffIGST: 0,
        inputCGST: 0,
        inputSGST: 0,
        inputIGST: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        outputCGST: 0,
        outputSGST: 0,
        outputIGST: 0,
        balanceCGST: 0,
        balanceSGST: 0,
        balanceIGST: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateITC = (purchases, sales, b2cSales) => {
    // Calculate Input GST from purchases
    let inputCGST = 0;
    let inputSGST = 0;
    let inputIGST = 0;

    purchases.forEach(purchase => {
      // Only eligible purchases for ITC (default to true if null/undefined)
      if (purchase.itcEligible !== false) {
        inputCGST += parseFloat(purchase.centralTax || 0);
        inputSGST += parseFloat(purchase.stateTax || 0);
        inputIGST += parseFloat(purchase.integratedTax || 0);
      }
    });

    // Calculate Output GST from sales
    let outputCGST = 0;
    let outputSGST = 0;
    let outputIGST = 0;

    // B2B Sales
    sales.forEach(sale => {
      outputCGST += parseFloat(sale.centralTax || 0);
      outputSGST += parseFloat(sale.stateTax || 0);
      outputIGST += parseFloat(sale.integratedTax || 0);
    });

    // B2C Sales
    b2cSales.forEach(sale => {
      outputCGST += parseFloat(sale.centralTax || 0);
      outputSGST += parseFloat(sale.stateTax || 0);
      outputIGST += parseFloat(sale.integratedTax || 0);
    });

    // Calculate totals and balances
    const totalCGST = itcData.oldSetoffCGST + inputCGST;
    const totalSGST = itcData.oldSetoffSGST + inputSGST;
    const totalIGST = itcData.oldSetoffIGST + inputIGST;

    const balanceCGST = totalCGST - outputCGST;
    const balanceSGST = totalSGST - outputSGST;
    const balanceIGST = totalIGST - outputIGST;

    return {
      oldSetoffCGST: itcData.oldSetoffCGST,
      oldSetoffSGST: itcData.oldSetoffSGST,
      oldSetoffIGST: itcData.oldSetoffIGST,
      inputCGST,
      inputSGST,
      inputIGST,
      totalCGST,
      totalSGST,
      totalIGST,
      outputCGST,
      outputSGST,
      outputIGST,
      balanceCGST,
      balanceSGST,
      balanceIGST
    };
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleITCClick = () => {
    setShowDetails(!showDetails);
  };

  const handleAddOldSetoff = () => {
    setShowAddOldSetoff(true);
  };

  const handleOldSetoffSubmit = () => {
    // Update ITC data with old setoff values
    setItcData(prev => ({
      ...prev,
      oldSetoffCGST: prev.oldSetoffCGST + parseFloat(oldSetoffData.cgst || 0),
      oldSetoffSGST: prev.oldSetoffSGST + parseFloat(oldSetoffData.sgst || 0),
      oldSetoffIGST: prev.oldSetoffIGST + parseFloat(oldSetoffData.igst || 0)
    }));

    // Reset form
    setOldSetoffData({
      month: '',
      cgst: 0,
      sgst: 0,
      igst: 0
    });
    setShowAddOldSetoff(false);
  };

  const handleOldSetoffCancel = () => {
    setOldSetoffData({
      month: '',
      cgst: 0,
      sgst: 0,
      igst: 0
    });
    setShowAddOldSetoff(false);
  };

  const formatMonthYear = (monthYear) => {
    if (!monthYear) return 'Select Month';
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  };

  return (
    <div className={`floating-itc-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Main ITC Display */}
      <div className="itc-main" onClick={handleITCClick}>
        <div className="itc-icon">
          <CreditCard size={20} />
        </div>
        <div className="itc-content">
          <div className="itc-label">Balance ITC</div>
          <div className="itc-amount">₹{((itcData.balanceCGST || 0) + (itcData.balanceSGST || 0) + (itcData.balanceIGST || 0)).toFixed(2)}</div>
          <div className="itc-month">{formatMonthYear(selectedMonth)}</div>
        </div>
        <div className="itc-toggle" onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="itc-details">
          {/* Add Old Setoff Button */}
          <div className="add-old-setoff">
            <button className="add-setoff-btn" onClick={handleAddOldSetoff}>
              <Plus size={16} />
              Add Old Setoff
            </button>
          </div>

          {/* ITC Table Layout */}
          <div className="itc-table-layout">
            <div className="itc-table-header">
              <div className="header-cell">Component</div>
              <div className="header-cell">Old Setoff</div>
              <div className="header-cell">Input GST</div>
              <div className="header-cell">Total</div>
              <div className="header-cell">Output GST</div>
              <div className="header-cell">Balance ITC</div>
            </div>
            
            <div className="itc-table-row">
              <div className="row-cell component">CGST</div>
              <div className="row-cell">₹{(itcData.oldSetoffCGST || 0).toFixed(2)}</div>
              <div className="row-cell">₹{(itcData.inputCGST || 0).toFixed(2)}</div>
              <div className="row-cell total">₹{(itcData.totalCGST || 0).toFixed(2)}</div>
              <div className="row-cell">₹{(itcData.outputCGST || 0).toFixed(2)}</div>
              <div className="row-cell balance">₹{(itcData.balanceCGST || 0).toFixed(2)}</div>
            </div>
            
            <div className="itc-table-row">
              <div className="row-cell component">SGST</div>
              <div className="row-cell">₹{(itcData.oldSetoffSGST || 0).toFixed(2)}</div>
              <div className="row-cell">₹{(itcData.inputSGST || 0).toFixed(2)}</div>
              <div className="row-cell total">₹{(itcData.totalSGST || 0).toFixed(2)}</div>
              <div className="row-cell">₹{(itcData.outputSGST || 0).toFixed(2)}</div>
              <div className="row-cell balance">₹{(itcData.balanceSGST || 0).toFixed(2)}</div>
            </div>
            
            <div className="itc-table-row">
              <div className="row-cell component">IGST</div>
              <div className="row-cell">₹{(itcData.oldSetoffIGST || 0).toFixed(2)}</div>
              <div className="row-cell">₹{(itcData.inputIGST || 0).toFixed(2)}</div>
              <div className="row-cell total">₹{(itcData.totalIGST || 0).toFixed(2)}</div>
              <div className="row-cell">₹{(itcData.outputIGST || 0).toFixed(2)}</div>
              <div className="row-cell balance">₹{(itcData.balanceIGST || 0).toFixed(2)}</div>
            </div>
          </div>

          {isLoading && (
            <div className="itc-loading">
              <div className="loading-spinner"></div>
              <span>Loading ITC data...</span>
            </div>
          )}
        </div>
      )}

      {/* Add Old Setoff Modal */}
      {showAddOldSetoff && (
        <div className="itc-modal-overlay" onClick={handleOldSetoffCancel}>
          <div className="itc-modal old-setoff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Old Setoff</h3>
              <button className="close-btn" onClick={handleOldSetoffCancel}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Month</label>
                <input
                  type="month"
                  value={oldSetoffData.month}
                  onChange={(e) => setOldSetoffData(prev => ({ ...prev, month: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>CGST Amount</label>
                <input
                  type="number"
                  value={oldSetoffData.cgst}
                  onChange={(e) => setOldSetoffData(prev => ({ ...prev, cgst: e.target.value }))}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>SGST Amount</label>
                <input
                  type="number"
                  value={oldSetoffData.sgst}
                  onChange={(e) => setOldSetoffData(prev => ({ ...prev, sgst: e.target.value }))}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>IGST Amount</label>
                <input
                  type="number"
                  value={oldSetoffData.igst}
                  onChange={(e) => setOldSetoffData(prev => ({ ...prev, igst: e.target.value }))}
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="modal-actions">
                <button className="btn-cancel" onClick={handleOldSetoffCancel}>
                  Cancel
                </button>
                <button className="btn-save" onClick={handleOldSetoffSubmit}>
                  Add Setoff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed ITC Modal */}
      {showDetails && (
        <div className="itc-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="itc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Input Tax Credit Details</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="itc-cards">
                <div className="itc-card primary">
                  <div className="card-icon">
                    <CreditCard size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Total ITC</div>
                    <div className="card-value">₹{((itcData.totalCGST || 0) + (itcData.totalSGST || 0) + (itcData.totalIGST || 0)).toFixed(2)}</div>
                  </div>
                </div>

                <div className="itc-card success">
                  <div className="card-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Available ITC</div>
                    <div className="card-value">₹{((itcData.balanceCGST || 0) + (itcData.balanceSGST || 0) + (itcData.balanceIGST || 0)).toFixed(2)}</div>
                  </div>
                </div>

                <div className="itc-card warning">
                  <div className="card-icon">
                    <Calculator size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Utilized ITC</div>
                    <div className="card-value">₹{((itcData.outputCGST || 0) + (itcData.outputSGST || 0) + (itcData.outputIGST || 0)).toFixed(2)}</div>
                  </div>
                </div>

                <div className="itc-card info">
                  <div className="card-icon">
                    <AlertCircle size={24} />
                  </div>
                  <div className="card-content">
                    <div className="card-label">Carry Forward</div>
                    <div className="card-value">₹{((itcData.balanceCGST || 0) + (itcData.balanceSGST || 0) + (itcData.balanceIGST || 0)).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="itc-table">
                <h4>ITC Component Breakdown</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CGST</td>
                      <td>₹{(itcData.inputCGST || 0).toFixed(2)}</td>
                      <td><span className="status available">Available</span></td>
                    </tr>
                    <tr>
                      <td>SGST</td>
                      <td>₹{(itcData.inputSGST || 0).toFixed(2)}</td>
                      <td><span className="status available">Available</span></td>
                    </tr>
                    <tr>
                      <td>IGST</td>
                      <td>₹{(itcData.inputIGST || 0).toFixed(2)}</td>
                      <td><span className="status available">Available</span></td>
                    </tr>
                    <tr>
                      <td>Cess</td>
                      <td>₹0.00</td>
                      <td><span className="status available">Available</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingITCBar;
