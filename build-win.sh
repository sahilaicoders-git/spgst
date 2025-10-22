#!/bin/bash

# GST Software - Windows Build Script
# This script automates building the Windows application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "GST Software - Windows App Builder"
echo "=================================="
echo ""

# Step 1: Check Python
echo -e "${YELLOW}[1/7] Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Found $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 is not installed${NC}"
    echo "Please install Python 3 from https://python.org"
    exit 1
fi

# Step 2: Check Node.js
echo -e "${YELLOW}[2/7] Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Found Node $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ Found npm $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

# Step 3: Install Python dependencies
echo -e "${YELLOW}[3/7] Installing Python dependencies...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null || echo "Note: Could not activate venv, continuing..."
pip install -q -r requirements.txt
deactivate 2>/dev/null || true
cd ..
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Step 4: Install Node.js dependencies
echo -e "${YELLOW}[4/7] Installing Node.js dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo "Dependencies already installed"
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
fi

# Step 5: Build React frontend
echo -e "${YELLOW}[5/7] Building React frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 6: Prepare backend for packaging
echo -e "${YELLOW}[6/7] Preparing backend for packaging...${NC}"
# Create a simple launcher script for Windows
cat > backend/run-backend.bat << 'EOF'
@echo off
cd /d "%~dp0"
python app.py
EOF
chmod +x backend/run-backend.bat
echo -e "${GREEN}✓ Backend launcher created${NC}"

# Step 7: Build Windows application
echo -e "${YELLOW}[7/7] Building Windows application...${NC}"
echo "This may take several minutes..."
npm run electron-pack -- --win

echo ""
echo -e "${GREEN}=================================="
echo "✓ BUILD COMPLETE!"
echo "==================================${NC}"
echo ""
echo "Your Windows application is ready in the 'dist' folder:"
echo "  📦 GST Software-1.0.0-x64.exe (Installer)"
echo ""
echo "To install:"
echo "  1. Run the .exe installer"
echo "  2. Follow the installation wizard"
echo "  3. Launch from Start Menu or Desktop shortcut"
echo ""
echo -e "${YELLOW}Note: The installer is unsigned. Users may see a Windows SmartScreen warning.${NC}"
echo -e "${YELLOW}Click 'More info' → 'Run anyway' to install.${NC}"
echo ""

