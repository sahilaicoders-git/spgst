// Database Manager for Client-Specific Operations
// This utility handles operations on individual client databases

class ClientDatabaseManager {
  constructor() {
    this.API_BASE_URL = 'http://127.0.0.1:5001/api';
  }

  // Get client database information
  async getClientDatabaseInfo(clientId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/database`);
      if (!response.ok) {
        throw new Error('Failed to get client database info');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting client database info:', error);
      throw error;
    }
  }

  // Create database for existing client
  async createClientDatabase(clientId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create client database');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating client database:', error);
      throw error;
    }
  }

  // Get purchases for a specific client
  async getClientPurchases(clientId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.status) queryParams.append('status', filters.status);
      
      const url = `${this.API_BASE_URL}/clients/${clientId}/purchases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get client purchases');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting client purchases:', error);
      throw error;
    }
  }

  // Add purchase to client database
  async addClientPurchase(clientId, purchaseData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
      if (!response.ok) {
        throw new Error('Failed to add client purchase');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding client purchase:', error);
      throw error;
    }
  }

  // Update purchase in client database
  async updateClientPurchase(clientId, purchaseId, purchaseData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
      if (!response.ok) {
        throw new Error('Failed to update client purchase');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating client purchase:', error);
      throw error;
    }
  }

  // Delete purchase from client database
  async deleteClientPurchase(clientId, purchaseId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/purchases/${purchaseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete client purchase');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting client purchase:', error);
      throw error;
    }
  }

  // Get sales for a specific client
  async getClientSales(clientId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.transactionType) params.append('transaction_type', filters.transactionType);
      
      const url = `${this.API_BASE_URL}/clients/${clientId}/sales${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get client sales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting client sales:', error);
      throw error;
    }
  }

  // Add a new sale entry for a client
  async addClientSale(clientId, saleData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add sale');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding client sale:', error);
      throw error;
    }
  }

  // Update a sale entry for a client
  async updateClientSale(clientId, saleId, saleData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/sales/${saleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sale');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating client sale:', error);
      throw error;
    }
  }

  // Delete a sale entry for a client
  async deleteClientSale(clientId, saleId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/sales/${saleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sale');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting client sale:', error);
      throw error;
    }
  }

  // Bulk add sales for a client
  async bulkAddClientSales(clientId, salesData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/sales/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sales: salesData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk add sales');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error bulk adding client sales:', error);
      throw error;
    }
  }

  // B2C Sales Methods
  async getClientB2CSales(clientId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      
      const url = `${this.API_BASE_URL}/clients/${clientId}/b2c-sales${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get client B2C sales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting client B2C sales:', error);
      throw error;
    }
  }

  async addClientB2CSale(clientId, b2cSaleData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/b2c-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(b2cSaleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add B2C sale');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding client B2C sale:', error);
      throw error;
    }
  }

  async updateClientB2CSale(clientId, b2cSaleId, b2cSaleData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/b2c-sales/${b2cSaleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(b2cSaleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update B2C sale');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating client B2C sale:', error);
      throw error;
    }
  }

  async deleteClientB2CSale(clientId, b2cSaleId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/b2c-sales/${b2cSaleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete B2C sale');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting client B2C sale:', error);
      throw error;
    }
  }

  async bulkAddClientB2CSales(clientId, b2cSalesData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/b2c-sales/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ b2cSales: b2cSalesData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk add B2C sales');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error bulk adding client B2C sales:', error);
      throw error;
    }
  }

  // Import purchases from CSV for a specific client
  async importClientPurchases(clientId, csvData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/purchases/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });
      if (!response.ok) {
        throw new Error('Failed to import client purchases');
      }
      return await response.json();
    } catch (error) {
      console.error('Error importing client purchases:', error);
      throw error;
    }
  }

  // Get client database statistics
  async getClientDatabaseStats(clientId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/database/stats`);
      if (!response.ok) {
        throw new Error('Failed to get client database stats');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting client database stats:', error);
      throw error;
    }
  }

  // Backup client database
  async backupClientDatabase(clientId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/database/backup`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to backup client database');
      }
      return await response.json();
    } catch (error) {
      console.error('Error backing up client database:', error);
      throw error;
    }
  }

  // Restore client database
  async restoreClientDatabase(clientId, backupData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/clients/${clientId}/database/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupData }),
      });
      if (!response.ok) {
        throw new Error('Failed to restore client database');
      }
      return await response.json();
    } catch (error) {
      console.error('Error restoring client database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const clientDBManager = new ClientDatabaseManager();
export default ClientDatabaseManager;
