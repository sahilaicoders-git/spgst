const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let flaskProcess;

function startFlaskBackend() {
  // Determine backend path based on development or production
  let backendPath;
  if (isDev) {
    backendPath = path.join(__dirname, '../backend');
  } else {
    // In production, backend is in app resources
    backendPath = path.join(process.resourcesPath, 'backend');
  }
  
  console.log(`Backend path: ${backendPath}`);
  
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  flaskProcess = spawn(pythonCommand, ['app.py'], {
    cwd: backendPath,
    stdio: 'pipe',
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1'
    }
  });

  flaskProcess.stdout.on('data', (data) => {
    console.log(`Flask: ${data}`);
  });

  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask Error: ${data}`);
  });

  flaskProcess.on('close', (code) => {
    console.log(`Flask process exited with code ${code}`);
  });

  flaskProcess.on('error', (err) => {
    console.error(`Failed to start Flask: ${err.message}`);
  });
}

function createWindow() {
  // Start Flask backend
  startFlaskBackend();

  // Wait a moment for Flask to start
  setTimeout(() => {
    // Create the browser window with Windows-specific settings
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      },
      icon: path.join(__dirname, process.platform === 'win32' ? 'spgsticon.png' : 'assets/icon.png'),
      titleBarStyle: 'default',
      frame: true,
      show: false,
      backgroundColor: '#f8fafc',
      autoHideMenuBar: false,
      fullscreenable: true,
      maximizable: true,
      resizable: true
    });

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }, 2000); // Wait 2 seconds for Flask to start
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Client',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-new-client');
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Clean up Flask process when app quits
app.on('before-quit', () => {
  if (flaskProcess) {
    flaskProcess.kill();
  }
});
