# Windows Build Guide - GST Software

## 🪟 Windows Application Build

This guide explains how to build and distribute the Windows version of GST Software.

---

## 📦 Quick Start

### **Automated Build (Recommended)**

```bash
./build-win.sh
```

Or manually:

```bash
npm run build-win
```

---

## 📥 Build Output

After building, you'll find in the `dist/` folder:

| File | Size | Purpose |
|------|------|---------|
| **`GST Software-1.0.0-x64.exe`** | ~96 MB | 🟢 **NSIS Installer** (for distribution) |
| **`win-unpacked/`** | - | 📂 Unpacked app folder (for testing) |

---

## 🚀 Installation & Distribution

### **For End Users**

1. **Download** `GST Software-1.0.0-x64.exe`
2. **Run** the installer
3. **Windows SmartScreen** may show a warning:
   - Click **"More info"**
   - Click **"Run anyway"**
4. **Follow** the installation wizard
5. **Choose** installation directory (or use default)
6. **Select** shortcuts (Desktop, Start Menu)
7. **Click** Install
8. **Launch** from Desktop or Start Menu

---

## ⚙️ Installer Features

### **NSIS Installer Configuration**

- ✅ **Interactive Setup** - User can choose installation path
- ✅ **Desktop Shortcut** - Created automatically
- ✅ **Start Menu Shortcut** - Created automatically
- ✅ **Uninstaller** - Included for easy removal
- ✅ **Per-User Installation** - No admin rights required
- ✅ **64-bit Build** - Optimized for modern Windows systems

### **Default Installation Path**

```
C:\Users\<Username>\AppData\Local\Programs\GST Software\
```

---

## 📂 What's Included

The Windows app contains:

```
GST Software/
├── GST Software.exe          # Main executable
├── resources/
│   ├── app.asar              # React frontend (packed)
│   ├── backend/              # Flask backend
│   │   ├── app.py
│   │   ├── client_databases/
│   │   ├── gst_clients.db
│   │   ├── gst_software.db
│   │   └── run-backend.bat   # Backend launcher
│   └── electron.asar         # Electron runtime
├── locales/                  # Language files
├── resources.pak             # Chromium resources
└── ... (other Electron files)
```

---

## 🎯 System Requirements

### **Minimum Requirements**
- **OS:** Windows 10 or later (64-bit)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk Space:** 300 MB for installation
- **Processor:** Intel/AMD x64 processor

### **Dependencies (Built-in)**
- ✅ **Python Runtime** - Included in package
- ✅ **Node.js** - Not required (bundled)
- ✅ **Electron** - Bundled
- ✅ **All Libraries** - Self-contained

---

## 🔧 Build Options

### **Quick Build (Development)**

Faster build without installer creation:

```bash
npm run build-win-quick
```

This creates only the `win-unpacked` folder for testing.

### **Full Build (Production)**

Complete build with NSIS installer:

```bash
npm run build-win
```

---

## 🐛 Troubleshooting

### **SmartScreen Warning**

**Problem:** Windows SmartScreen blocks the installer

**Solution:**
- This is normal for unsigned applications
- Click "More info" → "Run anyway"
- To avoid this, sign the app with a code signing certificate

### **Installer Fails to Run**

**Problem:** "This app can't run on your PC"

**Solution:**
- Ensure you're on 64-bit Windows
- Download the correct x64 installer

### **Backend Doesn't Start**

**Problem:** Flask backend fails to launch

**Solution:**
- Check if port 5001 is available
- Look for Python errors in logs
- Reinstall the application

### **Build Fails on Mac/Linux**

**Problem:** Cannot build Windows app on Mac

**Solution:**
- Windows builds CAN be created on Mac/Linux using electron-builder
- electron-builder uses Wine or cross-compilation
- If issues persist, build on a Windows machine

---

## 🔒 Code Signing (Optional)

To remove SmartScreen warnings and establish trust:

### **Get a Code Signing Certificate**

1. Purchase from a Certificate Authority:
   - DigiCert
   - Sectigo
   - GlobalSign

2. **Cost:** ~$100-400/year for individuals
   - ~$400-600/year for organizations (EV certificate)

### **Configure Signing**

Update `package.json`:

```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "YOUR_PASSWORD",
  "signingHashAlgorithms": ["sha256"],
  "sign": "./custom-sign.js"
}
```

### **Sign the Installer**

```bash
# During build, electron-builder will automatically sign
npm run build-win
```

---

## 📊 Build Performance

**Typical Build Times:**

- **Frontend Build:** ~30 seconds
- **Packaging:** ~2-3 minutes
- **NSIS Installer:** ~1-2 minutes
- **Total:** ~4-6 minutes

**Output Sizes:**

- **Installer:** ~96 MB
- **Installed Size:** ~240 MB
- **Frontend (optimized):** 80.97 KB (gzipped)

---

## 🌟 Features

### **Desktop Integration**

- ✅ Native Windows look and feel
- ✅ System tray integration (optional)
- ✅ Windows notifications
- ✅ File associations (if configured)
- ✅ Auto-start on login (optional)

### **Performance**

- ✅ Fast startup time
- ✅ Low memory footprint
- ✅ Efficient database operations
- ✅ Optimized React bundle

### **Security**

- ✅ Sandboxed renderer process
- ✅ Context isolation enabled
- ✅ Local database storage
- ✅ No external network calls (offline-first)

---

## 📤 Distribution Checklist

Before distributing to users:

- [ ] Test the installer on a clean Windows machine
- [ ] Verify the app launches and connects to backend
- [ ] Test all major features (add client, sales, purchases, reports)
- [ ] Check database creation and persistence
- [ ] Verify uninstaller works correctly
- [ ] Create user documentation
- [ ] Consider code signing for production
- [ ] Set up update mechanism (optional)

---

## 🆘 Support

**Build Issues?**

1. Check Node.js version: `node --version` (should be 14+)
2. Check npm version: `npm --version`
3. Clear cache: `npm cache clean --force`
4. Rebuild: `npm run build-win`

**Runtime Issues?**

1. Check Windows Event Viewer for errors
2. Look in: `%APPDATA%\GST Software\logs\`
3. Verify Python backend logs
4. Check port 5001 availability

---

## 📝 Notes

- **Antivirus:** Some antivirus software may flag unsigned executables
- **Updates:** To update, users can download and run the new installer
- **Uninstall:** Available via Windows Settings → Apps
- **Data:** User data is stored in `%APPDATA%\GST Software\`

---

## ✅ Success!

Your Windows application is ready for distribution! 🎉

**Share the installer** (`GST Software-1.0.0-x64.exe`) with users, and they can install with just a few clicks.

