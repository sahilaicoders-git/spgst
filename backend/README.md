# GST Software Backend

Python Flask backend with SQLite database for the GST Software desktop application.

## Features

- **RESTful API** for client management
- **SQLite Database** for data persistence
- **CORS Support** for React frontend integration
- **Test Data Generation** for development and testing

## API Endpoints

### Clients Management
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add a new client
- `PUT /api/clients/<id>` - Update a client
- `DELETE /api/clients/<id>` - Delete a client

### Test Data
- `POST /api/test-data` - Create test client data

### Health Check
- `GET /api/health` - Check backend status

## Database Schema

The `clients` table includes:
- `id` (TEXT PRIMARY KEY) - Unique client identifier
- `client_name` (TEXT NOT NULL) - Client name
- `business_name` (TEXT NOT NULL) - Business name
- `indian_fyear` (TEXT NOT NULL) - Indian Financial Year
- `gst_type` (TEXT NOT NULL) - GST Type (REGULAR/COMPOSITION)
- `gst_no` (TEXT NOT NULL) - GST Number
- `address` (TEXT) - Address (optional)
- `contact` (TEXT) - Contact information (optional)
- `return_frequency` (TEXT NOT NULL) - Return frequency (MONTHLY/QUATARY)
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Installation

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the Flask server:
   ```bash
   python app.py
   ```

The server will start on `http://127.0.0.1:5001`

## Test Data

The backend includes pre-configured test clients:
- **Rajesh Kumar** (Rajesh Electronics) - REGULAR GST, Monthly returns
- **Priya Sharma** (Priya Textiles) - COMPOSITION GST, Quarterly returns  
- **Amit Patel** (Patel Construction) - REGULAR GST, Monthly returns

## Integration

The backend is automatically started by the Electron main process and communicates with the React frontend via HTTP API calls.
