// Export Handler for Main GST Application
// Handles data export functionality

class ExportHandler {
  constructor(appInstance) {
    this.app = appInstance;
    this.supportedFormats = ['json', 'csv', 'excel', 'pdf'];
  }

  // Export data to file
  exportToFile(data, filename, format = 'json') {
    console.log(`Exporting data to ${filename} in ${format} format...`);
    
    let blob;
    let mimeType;
    
    switch (format.toLowerCase()) {
      case 'json':
        blob = this.createJSONBlob(data);
        mimeType = 'application/json';
        break;
      case 'csv':
        blob = this.createCSVBlob(data);
        mimeType = 'text/csv';
        break;
      case 'excel':
        blob = this.createExcelBlob(data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        blob = this.createPDFBlob(data);
        mimeType = 'application/pdf';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    this.downloadFile(blob, filename, mimeType);
  }

  // Create JSON blob
  createJSONBlob(data) {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  // Create CSV blob
  createCSVBlob(data) {
    let csvContent = '';
    
    if (Array.isArray(data)) {
      // Handle array data
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';
        
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          });
          csvContent += values.join(',') + '\n';
        });
      }
    } else if (typeof data === 'object') {
      // Handle object data
      csvContent += 'Key,Value\n';
      Object.entries(data).forEach(([key, value]) => {
        csvContent += `${key},"${value}"\n`;
      });
    }
    
    return new Blob([csvContent], { type: 'text/csv' });
  }

  // Create Excel blob (placeholder)
  createExcelBlob(data) {
    console.log('Excel export not implemented yet');
    // In a real implementation, you would use a library like SheetJS
    return new Blob(['Excel export not implemented'], { type: 'text/plain' });
  }

  // Create PDF blob (placeholder)
  createPDFBlob(data) {
    console.log('PDF export not implemented yet');
    // In a real implementation, you would use a library like jsPDF
    return new Blob(['PDF export not implemented'], { type: 'text/plain' });
  }

  // Download file
  downloadFile(blob, filename, mimeType) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Export client data
  exportClientData(clients, format = 'csv') {
    const filename = `clients_${this.app.selectedMonth}_${new Date().toISOString().split('T')[0]}.${format}`;
    this.exportToFile(clients, filename, format);
  }

  // Export calculation data
  exportCalculationData(calculations, format = 'csv') {
    const filename = `calculations_${this.app.selectedMonth}_${new Date().toISOString().split('T')[0]}.${format}`;
    this.exportToFile(calculations, filename, format);
  }

  // Export report data
  exportReportData(reports, format = 'json') {
    const filename = `reports_${this.app.selectedMonth}_${new Date().toISOString().split('T')[0]}.${format}`;
    this.exportToFile(reports, filename, format);
  }

  // Export all data
  exportAllData(data, format = 'json') {
    const filename = `gst_data_${this.app.selectedMonth}_${new Date().toISOString().split('T')[0]}.${format}`;
    this.exportToFile(data, filename, format);
  }

  // Get supported formats
  getSupportedFormats() {
    return this.supportedFormats;
  }

  // Validate export format
  validateFormat(format) {
    return this.supportedFormats.includes(format.toLowerCase());
  }

  // Generate export summary
  generateExportSummary(data) {
    const summary = {
      exportDate: new Date().toISOString(),
      month: this.app.selectedMonth,
      totalRecords: Array.isArray(data) ? data.length : 1,
      dataTypes: this.getDataTypes(data),
      fileSize: this.estimateFileSize(data)
    };
    
    return summary;
  }

  // Get data types in the export
  getDataTypes(data) {
    const types = new Set();
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            types.add(typeof item[key]);
          });
        }
      });
    } else if (typeof data === 'object') {
      Object.values(data).forEach(value => {
        types.add(typeof value);
      });
    }
    
    return Array.from(types);
  }

  // Estimate file size
  estimateFileSize(data) {
    const jsonString = JSON.stringify(data);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportHandler;
} else if (typeof window !== 'undefined') {
  window.ExportHandler = ExportHandler;
}
