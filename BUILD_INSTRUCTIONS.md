# GST Software - Mac App Build Instructions

This guide will help you build a complete standalone Mac application that includes the React frontend, Flask backend, and SQLite databases all bundled together.

## 📋 Prerequisites

Before building the Mac app, ensure you have the following installed:

### Required Software

1. **macOS** (10.14 or later recommended)
2. **Python 3.8+**
   ```bash
   python3 --version
   ```
   Download from: https://www.python.org/downloads/

3. **Node.js 16+** and npm
   ```bash
   node --version
   npm --version
   ```
   Download from: https://nodejs.org/

4. **Xcode Command Line Tools** (for Mac development)
   ```bash
   xcode-select --install
   ```

## 🚀 Quick Build (Automated)

The easiest way to build the Mac app is using the automated build script:

```bash
# Make the build script executable (first time only)
chmod +x build-mac.sh

# Run the build script
./build-mac.sh
```

This script will:
1. ✅ Check Python installation
2. ✅ Check Node.js installation
3. ✅ Install Python dependencies (Flask, Flask-CORS)
4. ✅ Install Node.js dependencies
5. ✅ Build the React frontend
6. ✅ Prepare the Flask backend
7. ✅ Package everything into a Mac .app bundle

## 📦 Manual Build Steps

If you prefer to build manually, follow these steps:

### Step 1: Install Python Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Build the React Frontend

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Step 4: Build the Mac Application

```bash
npm run electron-pack -- --mac
```

Or use the quick build command:

```bash
npm run build-mac-quick
```

## 📁 Build Output

After a successful build, you'll find the Mac app in the `dist/` folder:

```
dist/
├── GST Software.app          # The Mac application
├── GST Software-1.0.0.dmg    # DMG installer (drag & drop)
└── GST Software-1.0.0-mac.zip # Zipped version
```

## 💾 What's Included in the App

The built Mac application contains:

✅ **React Frontend** - Complete UI built with React
✅ **Flask Backend** - Python backend server
✅ **SQLite Databases** - All client databases and data
✅ **Electron Runtime** - Desktop app framework
✅ **All Dependencies** - Bundled libraries and modules
✅ **Python Virtual Environment** - Isolated Python runtime

## 📲 Installing the App

### Option 1: Direct Installation (Recommended)

1. Open Finder
2. Navigate to the `dist` folder in your project
3. Drag `GST Software.app` to the `Applications` folder
4. Double-click to launch

### Option 2: DMG Installer

1. Open `GST Software-1.0.0.dmg`
2. Drag the app icon to the Applications folder
3. Eject the DMG
4. Launch from Applications

### Option 3: Zip Distribution

1. Unzip `GST Software-1.0.0-mac.zip`
2. Move the .app to Applications
3. Launch the app

## 🔒 Security Notes

### First Launch

When you first open the app, macOS may show a security warning because the app is not signed with an Apple Developer certificate.

**To open the app:**

1. Right-click (or Control-click) the app
2. Select "Open" from the menu
3. Click "Open" in the dialog that appears

**Alternative method:**

1. Go to System Preferences → Security & Privacy
2. Click "Open Anyway" next to the GST Software warning

### For Distribution

If you want to distribute the app to others without security warnings, you need:

1. **Apple Developer Account** ($99/year)
2. **Code Signing Certificate**
3. **Notarization** (for macOS 10.15+)

## 🛠️ Troubleshooting

### Python Not Found

**Error:** `Python 3 is not installed`

**Solution:**
```bash
# Install Python from official website
# Or use Homebrew:
brew install python3
```

### Node Modules Error

**Error:** `Cannot find module...`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Build Failed

**Error:** Build process fails

**Solution:**
```bash
# Clean previous builds
rm -rf dist build

# Rebuild from scratch
npm run build
npm run electron-pack -- --mac
```

### Backend Not Starting

**Error:** Flask backend doesn't start in the app

**Solution:**
- Ensure Python 3 is installed system-wide
- Check backend/requirements.txt is present
- Verify backend/app.py exists

### Database Errors

**Error:** Cannot access database

**Solution:**
- Check that `backend/client_databases/` folder exists
- Ensure SQLite database files have proper permissions
- Databases will be created automatically on first run

## 📊 File Structure in Built App

```
GST Software.app/
├── Contents/
│   ├── MacOS/
│   │   └── GST Software          # Main executable
│   ├── Resources/
│   │   ├── app.asar              # Bundled frontend
│   │   ├── backend/              # Flask backend
│   │   │   ├── app.py
│   │   │   ├── client_databases/
│   │   │   ├── gst_clients.db
│   │   │   ├── gst_software.db
│   │   │   └── requirements.txt
│   │   └── electron.js           # Electron main process
│   └── Info.plist                # App metadata
```

## 🔧 Build Scripts Available

| Command | Description |
|---------|-------------|
| `npm start` | Run dev server (frontend only) |
| `npm run build` | Build React frontend for production |
| `npm run electron-dev` | Run app in development mode |
| `npm run electron-pack` | Build Electron app (after building frontend) |
| `npm run build-mac` | Full automated build (recommended) |
| `npm run build-mac-quick` | Quick build (skips dependency checks) |

## 🎯 Development vs Production

### Development Mode

```bash
npm run electron-dev
```

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:5001`
- Hot reload enabled
- DevTools available

### Production Build

```bash
./build-mac.sh
```

- Frontend served from local files
- Backend embedded in app
- Optimized and minified
- Ready for distribution

## 📝 Version Management

To update the app version:

1. Edit `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. Rebuild:
   ```bash
   ./build-mac.sh
   ```

The new version will be reflected in:
- App name: `GST Software-1.0.1.dmg`
- About dialog
- macOS Get Info

## 🌐 Backend Configuration

The Flask backend automatically:
- Starts when the app launches
- Runs on `http://localhost:5001`
- Creates databases in the app's resources folder
- Shuts down when the app quits

## 💡 Tips for Success

1. **Clean builds** - Delete `dist/` and `build/` folders between major changes
2. **Test first** - Always test with `npm run electron-dev` before building
3. **Check logs** - View Console.app for debugging production builds
4. **Update dependencies** - Keep npm packages and Python packages up to date
5. **Backup databases** - The client databases are preserved in updates

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review build logs in terminal
- Check Electron DevTools in development mode
- Verify all prerequisites are installed

## 🎉 Success!

Once built successfully, you'll have a complete, standalone Mac application that:
- ✅ Runs entirely offline
- ✅ Includes all dependencies
- ✅ Manages GST clients and data
- ✅ Provides professional desktop experience
- ✅ Can be distributed to users

---

**Built with:** React + Electron + Flask + SQLite
**Platform:** macOS
**Build Date:** $(date)

