# GST Software Desktop Application

A modern desktop application for GST client management built with Electron and React.

## Features

- **Universal Client Page**: Manage all your GST clients in one place
- **Modern UI**: Beautiful frosted glass design with smooth animations
- **Client Management**: Add, view, edit, and delete client records
- **Local Storage**: Data is stored locally using electron-store
- **Responsive Design**: Works perfectly on different screen sizes
- **Form Validation**: Comprehensive validation for all client fields

## Client Database Fields

- **CLIENT NAME** (Required)
- **BUSINESS NAME** (Required)
- **INDIAN FYEAR** (Required)
- **GST TYPE**: REGULAR or COMPOSITION (Required)
- **GST INO** (Required) - Validates GST number format
- **ADDRESS** (Optional)
- **CONTACT** (Optional)
- **RETURN FREQUENCY**: MONTHLY or QUATARY (Required)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the application in development mode:

```bash
npm run electron-dev
```

This will start both the React development server and Electron.

## Building for Production

To build the application for production:

```bash
npm run build
npm run electron-pack
```

The built application will be available in the `dist` folder.

## Available Scripts

- `npm start` - Start React development server
- `npm run electron` - Start Electron (requires built React app)
- `npm run electron-dev` - Start both React and Electron in development mode
- `npm run build` - Build React app for production
- `npm run electron-pack` - Package Electron app for distribution

## Technology Stack

- **Frontend**: React 18
- **Desktop**: Electron 27
- **Storage**: electron-store
- **Icons**: Lucide React
- **Styling**: CSS3 with modern features (backdrop-filter, CSS Grid, Flexbox)

## System Requirements

- Node.js 16 or higher
- npm 8 or higher
- macOS, Windows, or Linux

## License

MIT License
