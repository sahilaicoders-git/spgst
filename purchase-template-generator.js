// Excel Template Generator for Purchase Import
// This file can be used to generate Excel templates programmatically

const purchaseTemplateData = {
  headers: [
    'Supplier GSTIN',
    'Supplier Name', 
    'Invoice Number',
    'Invoice Type',
    'Invoice Date',
    'Invoice Value',
    'Place of Supply',
    'Reverse Charge',
    'Taxable Value',
    'Integrated Tax',
    'Central Tax',
    'State Tax',
    'Cess',
    'ITC Available',
    'Tax Rate'
  ],
  
  sampleData: [
    // Empty template - users will fill with their own data
  ],
  
  fieldDescriptions: {
    'Supplier GSTIN': '15-character GST identification number of the supplier',
    'Supplier Name': 'Name of the supplier/vendor company',
    'Invoice Number': 'Invoice number as mentioned on the supplier invoice',
    'Invoice Type': 'Type of invoice: Regular, Debit Note, Credit Note, Refund Voucher',
    'Invoice Date': 'Date of invoice in DD/MM/YYYY format',
    'Invoice Value': 'Total invoice amount including all taxes',
    'Place of Supply': 'State where the supply is made',
    'Reverse Charge': 'Whether reverse charge applies: Yes or No',
    'Taxable Value': 'Value of goods/services before tax',
    'Integrated Tax': 'IGST amount for inter-state supplies',
    'Central Tax': 'CGST amount for intra-state supplies',
    'State Tax': 'SGST amount for intra-state supplies',
    'Cess': 'Cess amount if applicable',
    'ITC Available': 'Whether Input Tax Credit is available: Yes or No',
    'Tax Rate': 'Tax rate percentage (e.g., 18%, 12%, 5%)'
  },
  
  validationRules: {
    'Supplier GSTIN': 'Must be exactly 15 characters, format: 2 digits + state code + 10 alphanumeric',
    'Invoice Date': 'Must be in DD/MM/YYYY format',
    'Invoice Value': 'Must be numeric with decimal places',
    'Taxable Value': 'Must be numeric with decimal places',
    'Integrated Tax': 'Must be numeric with decimal places',
    'Central Tax': 'Must be numeric with decimal places',
    'State Tax': 'Must be numeric with decimal places',
    'Cess': 'Must be numeric with decimal places',
    'Reverse Charge': 'Must be exactly "Yes" or "No"',
    'ITC Available': 'Must be exactly "Yes" or "No"',
    'Tax Rate': 'Must include % symbol (e.g., 18%, 12%, 5%)'
  },
  
  commonValues: {
    'Invoice Type': ['Regular', 'Debit Note', 'Credit Note', 'Refund Voucher'],
    'Place of Supply': [
      'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi',
      'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh',
      'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana',
      'Bihar', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh',
      'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa'
    ],
    'Reverse Charge': ['Yes', 'No'],
    'ITC Available': ['Yes', 'No'],
    'Tax Rate': ['5%', '12%', '18%', '28%']
  }
};

// Function to generate CSV content
function generateCSVTemplate() {
  const headers = purchaseTemplateData.headers.join(',');
  const sampleRows = purchaseTemplateData.sampleData.map(row => 
    Object.values(row).join(',')
  );
  
  return [headers, ...sampleRows].join('\n');
}

// Function to validate purchase data
function validatePurchaseData(data) {
  const errors = [];
  
  // Check required fields
  const requiredFields = ['supplierGSTIN', 'supplierName', 'invoiceNumber', 'invoiceDate', 'invoiceValue'];
  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate GSTIN format
  if (data.supplierGSTIN && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.supplierGSTIN)) {
    errors.push('Supplier GSTIN must be in valid format (15 characters)');
  }
  
  // Validate date format
  if (data.invoiceDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(data.invoiceDate)) {
    errors.push('Invoice Date must be in DD/MM/YYYY format');
  }
  
  // Validate numeric fields
  const numericFields = ['invoiceValue', 'taxableValue', 'integratedTax', 'centralTax', 'stateTax', 'cess'];
  numericFields.forEach(field => {
    if (data[field] && isNaN(parseFloat(data[field]))) {
      errors.push(`${field} must be numeric`);
    }
  });
  
  // Validate Yes/No fields
  const yesNoFields = ['reverseCharge', 'itcAvailable'];
  yesNoFields.forEach(field => {
    if (data[field] && !['Yes', 'No'].includes(data[field])) {
      errors.push(`${field} must be "Yes" or "No"`);
    }
  });
  
  return errors;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    purchaseTemplateData,
    generateCSVTemplate,
    validatePurchaseData
  };
}
