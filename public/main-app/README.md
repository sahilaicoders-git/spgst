# Main GST Application

This is the main GST application that opens after selecting clients and choosing a month.

## Features

- **Client Management**: Manage selected clients
- **Month Processing**: Process GST returns for selected month
- **Reports**: Generate GST reports
- **Dashboard**: Overview of GST activities

## Files Structure

- `main-app.js` - Main application entry point
- `dashboard.js` - Dashboard component
- `client-processor.js` - Client processing logic
- `report-generator.js` - Report generation
- `month-selector.js` - Month selection component
- `gst-calculator.js` - GST calculation utilities
- `data-manager.js` - Data management
- `export-handler.js` - Export functionality

## Usage

1. Select clients from the client list
2. Click "Open Main App" button
3. Select month and year in the dialog
4. Click "Enter" or "Open Main Application"
5. Main application opens with selected clients and month

## API Integration

The main application integrates with the Flask backend API for:
- Client data retrieval
- GST calculations
- Report generation
- Data export
