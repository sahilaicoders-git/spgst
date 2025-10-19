// Data Manager for Main GST Application
// Handles data management and persistence

class DataManager {
  constructor(appInstance) {
    this.app = appInstance;
    this.data = {
      clients: [],
      calculations: [],
      reports: [],
      settings: {}
    };
    this.storageKey = 'gst_app_data';
  }

  // Initialize data manager
  initialize() {
    console.log('Initializing Data Manager...');
    this.loadData();
    this.setupAutoSave();
  }

  // Load data from storage
  loadData() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        this.data = JSON.parse(savedData);
        console.log('Data loaded from storage');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Save data to storage
  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      console.log('Data saved to storage');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Setup auto-save functionality
  setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      this.saveData();
    }, 30000);
  }

  // Add client data
  addClient(clientData) {
    const client = {
      ...clientData,
      id: this.generateId(),
      addedAt: new Date().toISOString(),
      month: this.app.selectedMonth
    };
    
    this.data.clients.push(client);
    this.saveData();
    return client;
  }

  // Add calculation data
  addCalculation(calculationData) {
    const calculation = {
      ...calculationData,
      id: this.generateId(),
      calculatedAt: new Date().toISOString(),
      month: this.app.selectedMonth
    };
    
    this.data.calculations.push(calculation);
    this.saveData();
    return calculation;
  }

  // Add report data
  addReport(reportData) {
    const report = {
      ...reportData,
      id: this.generateId(),
      generatedAt: new Date().toISOString(),
      month: this.app.selectedMonth
    };
    
    this.data.reports.push(report);
    this.saveData();
    return report;
  }

  // Get all clients
  getClients() {
    return this.data.clients;
  }

  // Get all calculations
  getCalculations() {
    return this.data.calculations;
  }

  // Get all reports
  getReports() {
    return this.data.reports;
  }

  // Get client by ID
  getClientById(id) {
    return this.data.clients.find(client => client.id === id);
  }

  // Get calculations for client
  getCalculationsForClient(clientId) {
    return this.data.calculations.filter(calc => calc.clientId === clientId);
  }

  // Get reports for month
  getReportsForMonth(month) {
    return this.data.reports.filter(report => report.month === month);
  }

  // Update client data
  updateClient(id, updateData) {
    const clientIndex = this.data.clients.findIndex(client => client.id === id);
    if (clientIndex !== -1) {
      this.data.clients[clientIndex] = {
        ...this.data.clients[clientIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.saveData();
      return this.data.clients[clientIndex];
    }
    return null;
  }

  // Delete client
  deleteClient(id) {
    const clientIndex = this.data.clients.findIndex(client => client.id === id);
    if (clientIndex !== -1) {
      const deletedClient = this.data.clients.splice(clientIndex, 1)[0];
      this.saveData();
      return deletedClient;
    }
    return null;
  }

  // Clear all data
  clearAllData() {
    this.data = {
      clients: [],
      calculations: [],
      reports: [],
      settings: {}
    };
    this.saveData();
  }

  // Export data
  exportData(format = 'json') {
    const exportData = {
      ...this.data,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }
    
    return exportData;
  }

  // Import data
  importData(data) {
    try {
      const importedData = typeof data === 'string' ? JSON.parse(data) : data;
      this.data = {
        ...this.data,
        ...importedData
      };
      this.saveData();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get data statistics
  getDataStats() {
    return {
      totalClients: this.data.clients.length,
      totalCalculations: this.data.calculations.length,
      totalReports: this.data.reports.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
} else if (typeof window !== 'undefined') {
  window.DataManager = DataManager;
}
