#!/bin/bash

# GST Software - Mac App Build Script
# This script builds a complete standalone Mac application

set -e  # Exit on error

echo "=================================="
echo "GST Software - Mac App Builder"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Python installation
echo -e "${YELLOW}[1/7] Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3 from https://www.python.org/downloads/"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ Found $PYTHON_VERSION${NC}"
echo ""

# Step 2: Check Node.js installation
echo -e "${YELLOW}[2/7] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ Found Node $NODE_VERSION${NC}"
echo -e "${GREEN}✓ Found npm $NPM_VERSION${NC}"
echo ""

# Step 3: Install Python dependencies
echo -e "${YELLOW}[3/7] Installing Python dependencies...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet
echo -e "${GREEN}✓ Python dependencies installed${NC}"
cd ..
echo ""

# Step 4: Install Node dependencies
echo -e "${YELLOW}[4/7] Installing Node.js dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install --silent
else
    echo "Dependencies already installed"
fi
echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
echo ""

# Step 5: Build React frontend
echo -e "${YELLOW}[5/7] Building React frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 6: Create standalone Python bundle
echo -e "${YELLOW}[6/7] Preparing backend for packaging...${NC}"

# Create a launcher script for the backend
cat > backend/start_backend.sh << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
source venv/bin/activate
python3 app.py
EOF

chmod +x backend/start_backend.sh
echo -e "${GREEN}✓ Backend launcher created${NC}"
echo ""

# Step 7: Build Mac app with Electron
echo -e "${YELLOW}[7/7] Building Mac application...${NC}"
npm run electron-pack -- --mac
echo -e "${GREEN}✓ Mac app built successfully${NC}"
echo ""

# Success message
echo "=================================="
echo -e "${GREEN}BUILD COMPLETED SUCCESSFULLY!${NC}"
echo "=================================="
echo ""
echo "Your Mac app is ready at:"
echo -e "${GREEN}dist/GST Software.app${NC}"
echo ""
echo "To install the app:"
echo "1. Open Finder"
echo "2. Navigate to the 'dist' folder"
echo "3. Drag 'GST Software.app' to Applications folder"
echo ""
echo "The app includes:"
echo "  ✓ React Frontend"
echo "  ✓ Flask Backend"
echo "  ✓ SQLite Databases"
echo "  ✓ All dependencies bundled"
echo ""

