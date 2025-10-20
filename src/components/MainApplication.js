import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Download,
  Upload,
  Calculator,
  Database,
  Home,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Percent,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import PurchasePage from './PurchasePage';
import SalesPage from './SalesPage';
import ReportPage from './ReportPage';
import './MainApplication.css';

const MainApplication = ({ selectedClients, selectedMonth, onBack }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(selectedMonth);
  const [settingsTab, setSettingsTab] = useState('general'); // For settings sub-tabs
  const [appData, setAppData] = useState({
    clients: selectedClients,
    month: currentMonth,
    year: new Date().getFullYear(),
    status: 'initialized'
  });

  useEffect(() => {
    console.log('Main Application initialized with:', appData);
    
    // Trigger initial animation
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [appData]);

  // Reset animation when tab changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  const formatMonthYear = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  const getFinancialYear = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const monthNum = parseInt(month);
    
    if (monthNum >= 4) {
      return `${year}-${parseInt(year) + 1}`;
    } else {
      return `${parseInt(year) - 1}-${year}`;
    }
  };

  // Generate month options (only for current financial year)
  const generateMonthOptions = () => {
    const options = [];
    
    // Get current month's financial year
    const [year, month] = currentMonth.split('-');
    const monthNum = parseInt(month);
    
    // Determine FY start year
    let fyStartYear;
    if (monthNum >= 4) {
      // April or later - FY is current year to next year
      fyStartYear = parseInt(year);
    } else {
      // Jan-Mar - FY is previous year to current year
      fyStartYear = parseInt(year) - 1;
    }
    
    // Generate all 12 months of the FY (April to March)
    for (let i = 0; i < 12; i++) {
      const monthIndex = (3 + i) % 12; // Start from April (month 3 in 0-indexed)
      const yearOffset = i >= 9 ? 1 : 0; // After December, move to next year
      const fyYear = fyStartYear + yearOffset;
      const monthValue = String(monthIndex + 1).padStart(2, '0');
      const value = `${fyYear}-${monthValue}`;
      
      options.push({
        value,
        label: formatMonthYear(value)
      });
    }
    
    return options;
  };

  // Handle month change
  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
    setAppData(prev => ({
      ...prev,
      month: newMonth
    }));
  };

  // Update appData when currentMonth changes
  useEffect(() => {
    setAppData(prev => ({
      ...prev,
      month: currentMonth
    }));
  }, [currentMonth]);

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      
      // Handle function keys F1-F6
      if (key.startsWith('F') && key.length === 2) {
        const functionKey = parseInt(key.substring(1));
        if (functionKey >= 1 && functionKey <= 6) {
          event.preventDefault();
          const tabIndex = functionKey - 1;
          if (tabs[tabIndex]) {
            setActiveTab(tabs[tabIndex].id);
          }
        }
      }
      
      // Handle Escape key to go back
      if (key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, shortcut: 'F1' },
    { id: 'purchase', label: 'Purchase', icon: ShoppingCart, shortcut: 'F2' },
    { id: 'sale', label: 'Sale', icon: TrendingUp, shortcut: 'F3' },
    { id: 'report', label: 'Report', icon: FileText, shortcut: 'F4' },
    { id: 'gst', label: 'GST', icon: Percent, shortcut: 'F5' },
    { id: 'settings', label: 'Settings', icon: Settings, shortcut: 'F6' }
  ];

  const renderHome = () => (
    <div className={`home-content ${isAnimating ? 'animating' : ''}`}>
      {/* Modern Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <Calendar size={14} />
            <span>{formatMonthYear(currentMonth)}</span>
          </div>
          <h1 className="hero-title">
            {selectedClients.length === 1 
              ? `Welcome, ${selectedClients[0]?.clientName || 'Client'}`
              : selectedClients.length > 1 
                ? `Managing ${selectedClients.length} Clients`
                : 'GST Management Dashboard'
            }
          </h1>
          <p className="hero-subtitle">
            {selectedClients.length === 1 
              ? `Processing GST returns for ${selectedClients[0]?.businessName || 'your business'}`
              : selectedClients.length > 1 
                ? `Processing GST returns for ${selectedClients.length} selected clients`
                : 'Select clients to begin GST processing'
            }
          </p>
          <div className="hero-meta">
            <div className="meta-item">
              <span className="meta-label">Financial Year</span>
              <span className="meta-value">{getFinancialYear(currentMonth)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Processing Period</span>
              <span className="meta-value">{formatMonthYear(currentMonth)}</span>
            </div>
          </div>
        </div>
        
        {selectedClients.length > 0 && (
          <div className="hero-clients">
            <div className="clients-header">
              <Users size={20} />
              <span>Selected Clients</span>
            </div>
            <div className="clients-list">
              {selectedClients.filter(client => client && client.clientName).slice(0, 3).map((client, index) => (
                <div key={client?.id || index} className="client-chip">
                  <div className="client-avatar">
                    {client?.clientName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="client-info">
                    <span className="client-name">{client?.clientName || 'Unknown Client'}</span>
                    <span className="client-business">{client?.businessName || 'Unknown Business'}</span>
                  </div>
                </div>
              ))}
              {selectedClients.length > 3 && (
                <div className="client-chip more">
                  <div className="client-avatar">+{selectedClients.length - 3}</div>
                  <span className="more-text">More clients</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card modern">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>{selectedClients.length}</h3>
            <p>Active Clients</p>
          </div>
        </div>
        
        <div className="stat-card modern">
          <div className="stat-icon">
            <Calendar />
          </div>
          <div className="stat-content">
            <h3>{formatMonthYear(currentMonth)}</h3>
            <p>Current Period</p>
          </div>
        </div>
        
        <div className="stat-card modern">
          <div className="stat-icon">
            <BarChart3 />
          </div>
          <div className="stat-content">
            <h3>0</h3>
            <p>Processed Returns</p>
          </div>
        </div>
        
        <div className="stat-card modern">
          <div className="stat-icon">
            <FileText />
          </div>
          <div className="stat-content">
            <h3>0</h3>
            <p>Generated Reports</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="action-cards">
        <div className="action-card primary">
          <div className="action-icon">
            <Calculator />
          </div>
          <div className="action-content">
            <h3>Start GST Processing</h3>
            <p>Begin processing GST returns for the selected period</p>
          </div>
          <button className="action-btn primary">
            <Calculator />
            Start Processing
          </button>
        </div>
        
        <div className="action-card">
          <div className="action-icon">
            <FileText />
          </div>
          <div className="action-content">
            <h3>Generate Reports</h3>
            <p>Create comprehensive GST reports and analytics</p>
          </div>
          <button className="action-btn secondary">
            <FileText />
            Generate Reports
          </button>
        </div>
        
        <div className="action-card">
          <div className="action-icon">
            <Download />
          </div>
          <div className="action-content">
            <h3>Export Data</h3>
            <p>Export client data and reports in various formats</p>
          </div>
          <button className="action-btn secondary">
            <Download />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );

  const renderPurchase = () => (
    <PurchasePage 
      selectedClients={selectedClients}
      selectedMonth={currentMonth}
    />
  );

  const renderSale = () => (
    <SalesPage 
      selectedClients={selectedClients}
      selectedMonth={currentMonth}
    />
  );

  const renderReport = () => (
    <ReportPage 
      selectedClient={selectedClients?.[0]}
      selectedMonth={currentMonth}
    />
  );

  const renderGST = () => (
    <div className="tab-content">
      <h2>GST Processing</h2>
      <p>Process GST returns and calculations for {formatMonthYear(currentMonth)}</p>
      <div className="feature-placeholder">
        <Percent size={48} />
        <h3>GST Module</h3>
        <p>GST calculations, return filing, and compliance tracking will be implemented here.</p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="tab-content">
      <div className="settings-container">
        <div className="settings-header">
      <h2>Settings & Configuration</h2>
      <p>Configure application settings and preferences</p>
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${settingsTab === 'general' ? 'active' : ''}`}
            onClick={() => setSettingsTab('general')}
          >
            General
          </button>
          <button 
            className={`settings-tab ${settingsTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setSettingsTab('shortcuts')}
          >
            Keyboard Shortcuts
          </button>
          <button 
            className={`settings-tab ${settingsTab === 'about' ? 'active' : ''}`}
            onClick={() => setSettingsTab('about')}
          >
            About
          </button>
        </div>
        
        <div className="settings-content">
          {settingsTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="settings-group">
                <label>Default Month</label>
                <select className="settings-input">
                  <option value="current">Current Month</option>
                  <option value="previous">Previous Month</option>
                </select>
              </div>
              <div className="settings-group">
                <label>Theme</label>
                <select className="settings-input">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          )}
          
          {settingsTab === 'shortcuts' && (
            <div className="settings-section">
              <h3>Keyboard Shortcuts</h3>
              <div className="shortcuts-list">
                <div className="shortcut-category">
                  <h4>Navigation</h4>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F1</span>
                    <span className="shortcut-description">Home</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F2</span>
                    <span className="shortcut-description">Purchase</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F3</span>
                    <span className="shortcut-description">Sale</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F4</span>
                    <span className="shortcut-description">Report</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F5</span>
                    <span className="shortcut-description">GST</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F6</span>
                    <span className="shortcut-description">Settings</span>
                  </div>
                </div>
                
                <div className="shortcut-category">
                  <h4>General</h4>
                  <div className="shortcut-item">
                    <span className="shortcut-key">Esc</span>
                    <span className="shortcut-description">Go Back to Client List</span>
                  </div>
                </div>
                
                <div className="shortcut-category">
                  <h4>Client List</h4>
                  <div className="shortcut-item">
                    <span className="shortcut-key">↑↓</span>
                    <span className="shortcut-description">Navigate between clients</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">Enter</span>
                    <span className="shortcut-description">Select/Deselect client</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">Space</span>
                    <span className="shortcut-description">Open main application</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {settingsTab === 'about' && (
            <div className="settings-section">
              <h3>About GST Software</h3>
              <div className="about-content">
                <div className="about-item">
                  <strong>Version:</strong> 1.0.0
                </div>
                <div className="about-item">
                  <strong>Description:</strong> Professional GST Management System
                </div>
                <div className="about-item">
                  <strong>Features:</strong> B2B/B2C Sales, Purchase Management, HSN Summary, ITC Tracking, Reports
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'purchase':
        return renderPurchase();
      case 'sale':
        return renderSale();
      case 'report':
        return renderReport();
      case 'gst':
        return renderGST();
      case 'settings':
        return renderSettings();
      default:
        return renderHome();
    }
  };

  return (
    <div className="main-application">
      {/* Top Bar with Integrated Menu */}
      <div className="top-bar">
        <div className="top-bar-content">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft />
            Back to Client List
          </button>
          
          <div className="nav-tabs-container">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={`${tab.label} (${tab.shortcut})`}
                >
                  <Icon className="nav-tab-icon" />
                  <span className="nav-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="app-title">
            <h1 title={
              selectedClients.length === 1 
                ? selectedClients[0]?.clientName || 'Unknown Client'
                : selectedClients.length > 1 
                  ? selectedClients.map(client => client?.clientName || 'Unknown Client').join(', ')
                  : 'No Clients Selected'
            }>
              {selectedClients.length === 1 
                ? selectedClients[0]?.clientName || 'Unknown Client'
                : selectedClients.length > 1 
                  ? `${selectedClients.length} Clients Selected`
                  : 'No Clients Selected'
              }
            </h1>
            <div className="month-selector-wrapper">
              <Calendar size={16} className="calendar-icon" />
              <select 
                className="month-selector-dropdown"
                value={currentMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                title="Change Month"
              >
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="dropdown-chevron" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainApplication;
