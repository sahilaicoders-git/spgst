# 🚀 Quick Build Guide

## Build Mac App in 3 Simple Steps

### 1️⃣ Make Build Script Executable (First Time Only)
```bash
chmod +x build-mac.sh
```

### 2️⃣ Run the Build
```bash
./build-mac.sh
```

### 3️⃣ Install the App
```bash
# Find the app in the dist folder
open dist

# Drag "GST Software.app" to Applications folder
```

---

## 📦 What You Get

After running `./build-mac.sh`, you'll have:

```
dist/
├── GST Software.app          ← Drag this to Applications
├── GST Software-1.0.0.dmg    ← Installer for others
└── GST Software-1.0.0-mac.zip ← Compressed version
```

---

## ⚡ Quick Commands

| Want to... | Command |
|------------|---------|
| **Build everything** | `./build-mac.sh` |
| **Quick rebuild** | `npm run build-mac-quick` |
| **Test before building** | `npm run electron-dev` |
| **Clean and rebuild** | `rm -rf dist build && ./build-mac.sh` |

---

## ✅ Requirements Check

Before building, ensure you have:

- ✅ **macOS** (10.14+)
- ✅ **Python 3.8+** → `python3 --version`
- ✅ **Node.js 16+** → `node --version`
- ✅ **Xcode Tools** → `xcode-select --install`

---

## 🎯 First Launch

After installing:

1. Open **Applications** folder
2. Right-click **GST Software.app**
3. Click **Open**
4. Click **Open** in the security dialog

> This is only needed the first time (unsigned app warning)

---

## 🔧 Troubleshooting

### Build Failed?
```bash
# Try cleaning first
rm -rf dist build node_modules
npm install
./build-mac.sh
```

### Backend Not Working?
```bash
# Check Python
python3 --version

# Should be 3.8 or higher
```

### Can't Open App?
```bash
# Right-click → Open (don't double-click)
# Or go to System Preferences → Security & Privacy → Open Anyway
```

---

## 📖 Need More Details?

See **BUILD_INSTRUCTIONS.md** for complete documentation.

---

**Build Time:** ~2-5 minutes  
**App Size:** ~200-300 MB  
**Includes:** React + Flask + SQLite + All Dependencies

