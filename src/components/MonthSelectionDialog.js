import React, { useState, useEffect } from 'react';
import { X, Calendar, ArrowRight } from 'lucide-react';
import './MonthSelectionDialog.css';

const MonthSelectionDialog = ({ isOpen, onClose, onConfirm, selectedClients }) => {
  const [selectedMonthYear, setSelectedMonthYear] = useState('');

  // Get current financial year months
  const generateFYMonthOptions = () => {
    const options = [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();
    
    // Determine FY start year based on current month
    let fyStartYear;
    if (currentMonth >= 4) {
      // April or later - FY is current year to next year
      fyStartYear = currentYear;
    } else {
      // Jan-Mar - FY is previous year to current year
      fyStartYear = currentYear - 1;
    }
    
    // Generate all 12 months of the FY (April to March)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (3 + i) % 12; // Start from April (month 3 in 0-indexed)
      const yearOffset = i >= 9 ? 1 : 0; // After December, move to next year
      const fyYear = fyStartYear + yearOffset;
      const monthValue = String(monthIndex + 1).padStart(2, '0');
      const value = `${fyYear}-${monthValue}`;
      
      options.push({
        value,
        label: `${monthNames[monthIndex]} ${fyYear}`
      });
    }
    
    return options;
  };

  const monthOptions = generateFYMonthOptions();

  // Set default to current month
  useEffect(() => {
    if (isOpen && !selectedMonthYear) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const defaultValue = `${currentYear}-${currentMonth}`;
      setSelectedMonthYear(defaultValue);
    }
  }, [isOpen, selectedMonthYear]);

  const handleConfirm = () => {
    if (selectedMonthYear) {
      onConfirm(selectedMonthYear, selectedClients);
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  // Get FY display text
  const getFYDisplay = () => {
    if (!selectedMonthYear) return '';
    const [year, month] = selectedMonthYear.split('-');
    const monthNum = parseInt(month);
    
    let fyStartYear;
    if (monthNum >= 4) {
      fyStartYear = parseInt(year);
    } else {
      fyStartYear = parseInt(year) - 1;
    }
    
    return `FY ${fyStartYear}-${fyStartYear + 1}`;
  };

  if (!isOpen) return null;

  return (
    <div className="month-dialog-overlay">
      <div className="month-dialog">
        <div className="dialog-header">
          <div className="dialog-title">
            <Calendar className="title-icon" />
            <h2>Select Month & Year</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="dialog-content">
          <div className="selection-info">
            <p className="info-text">
              You have selected <strong>{selectedClients.length}</strong> client{selectedClients.length !== 1 ? 's' : ''} for processing.
            </p>
            <p className="instruction-text">
              Please select the month from the current financial year to proceed.
            </p>
          </div>

          <div className="month-year-selection">
            <div className="selection-group full-width">
              <label htmlFor="month-year-select" className="selection-label">
                Month & Year ({getFYDisplay()})
              </label>
              <select
                id="month-year-select"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                onKeyPress={handleKeyPress}
                className="month-year-select"
              >
                <option value="">Select Month</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="selected-info">
            {selectedMonthYear && (
              <div className="selected-display">
                <Calendar className="display-icon" />
                <span className="selected-text">
                  Selected: {monthOptions.find(m => m.value === selectedMonthYear)?.label}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-actions">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedMonthYear}
          >
            <ArrowRight className="btn-icon" />
            Open Main Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthSelectionDialog;
