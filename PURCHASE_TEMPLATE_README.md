# Purchase Import Template - GST Software

## Overview
This template is designed for importing purchase data into the GST Software. It includes all required fields and validation rules to ensure accurate data import.

## Files Included

### 1. `purchase-import-template.csv`
- Ready-to-use CSV template with sample data
- Contains all required headers
- Includes 6 sample purchase entries
- Can be opened in Excel, Google Sheets, or any spreadsheet application

### 2. `purchase-import-template.txt`
- Detailed instructions and documentation
- Field descriptions and validation rules
- Common values and examples
- Tax calculation examples

### 3. `purchase-template-generator.js`
- JavaScript utility for generating templates programmatically
- Data validation functions
- Can be integrated into the application

## Required Headers

| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| Supplier GSTIN | 15-character GST identification | 15 alphanumeric | 27AMUPB2207Q1ZN |
| Supplier Name | Name of supplier/vendor | Text | BABA GOVINDRAM COLLE |
| Invoice Number | Invoice number from supplier | Text | 198 |
| Invoice Type | Type of invoice | Dropdown | Regular, Debit Note, Credit Note |
| Invoice Date | Date of invoice | DD/MM/YYYY | 05/09/2025 |
| Invoice Value | Total invoice amount | Decimal | 6940.00 |
| Place of Supply | State where supply is made | Text | Maharashtra |
| Reverse Charge | Whether reverse charge applies | Yes/No | No |
| Taxable Value | Value before tax | Decimal | 6609.60 |
| Integrated Tax | IGST amount | Decimal | 0.00 |
| Central Tax | CGST amount | Decimal | 165.24 |
| State Tax | SGST amount | Decimal | 165.24 |
| Cess | Cess amount | Decimal | 0.00 |
| ITC Available | Whether ITC is available | Yes/No | Yes |
| Tax Rate | Tax rate percentage | Percentage | 100% |

## How to Use

### Step 1: Download Template
1. Download `purchase-import-template.csv`
2. Open in Excel, Google Sheets, or any spreadsheet application

### Step 2: Fill Data
1. Replace sample data with your actual purchase data
2. Ensure all required fields are filled
3. Follow the format guidelines for each field

### Step 3: Validate Data
1. Check GSTIN format (15 characters)
2. Verify date format (DD/MM/YYYY)
3. Ensure numeric fields contain only numbers
4. Confirm Yes/No fields use exact values

### Step 4: Import
1. Save the file as CSV or Excel format
2. Go to Purchase tab in GST Software
3. Click "Import Excel" button
4. Select your file and import

## Validation Rules

### GSTIN Format
- Must be exactly 15 characters
- Format: 2 digits + state code + 10 alphanumeric
- Example: 27AMUPB2207Q1ZN

### Date Format
- Must be in DD/MM/YYYY format
- Example: 15/09/2025
- Invalid: 15-09-2025, 2025-09-15

### Numeric Fields
- Must contain only numbers and decimal point
- Use decimal format for currency
- Example: 15000.00, 1234.56

### Yes/No Fields
- Must be exactly "Yes" or "No"
- Case sensitive
- No other variations accepted

## Common Values

### Invoice Types
- Regular
- Debit Note
- Credit Note
- Refund Voucher

### Places of Supply
- Maharashtra
- Gujarat
- Karnataka
- Tamil Nadu
- Delhi
- Uttar Pradesh
- West Bengal
- Rajasthan
- Madhya Pradesh
- Andhra Pradesh
- Telangana
- Kerala
- Punjab
- Haryana
- Bihar
- Odisha
- Assam
- Jharkhand
- Chhattisgarh
- Uttarakhand
- Himachal Pradesh
- Jammu and Kashmir
- Goa

### Tax Rates
- 5%
- 12%
- 18%
- 28%

## Tax Calculation Examples

### Intra-state Supply (18% GST)
- Taxable Value: ₹1,000.00
- CGST (9%): ₹90.00
- SGST (9%): ₹90.00
- Total Tax: ₹180.00
- Invoice Value: ₹1,180.00

### Inter-state Supply (18% IGST)
- Taxable Value: ₹1,000.00
- IGST (18%): ₹180.00
- CGST: ₹0.00
- SGST: ₹0.00
- Total Tax: ₹180.00
- Invoice Value: ₹1,180.00

## Troubleshooting

### Common Issues

1. **GSTIN Format Error**
   - Ensure GSTIN is exactly 15 characters
   - Check for typos in state code
   - Verify PAN format in GSTIN

2. **Date Format Error**
   - Use DD/MM/YYYY format only
   - Don't use dashes or other separators
   - Ensure month and day are valid

3. **Numeric Field Error**
   - Remove any text or special characters
   - Use decimal point, not comma
   - Don't include currency symbols

4. **Yes/No Field Error**
   - Use exactly "Yes" or "No"
   - Don't use "Y", "N", "yes", "no"
   - Check for extra spaces

### Data Validation Checklist

- [ ] All required fields are filled
- [ ] GSTIN is 15 characters long
- [ ] Dates are in DD/MM/YYYY format
- [ ] Numeric fields contain only numbers
- [ ] Yes/No fields use exact values
- [ ] Invoice types are from valid list
- [ ] Places of supply are valid states
- [ ] Tax rates include % symbol

## Support

If you encounter any issues with the template or import process:

1. Check the validation rules above
2. Verify your data format
3. Contact technical support
4. Provide sample of problematic data

## Version History

- v1.0: Initial template with basic fields
- v1.1: Added validation rules and examples
- v1.2: Enhanced documentation and troubleshooting
