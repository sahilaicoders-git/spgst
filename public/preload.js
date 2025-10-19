const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Client management
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (clientData) => ipcRenderer.invoke('add-client', clientData),
  updateClient: (id, clientData) => ipcRenderer.invoke('update-client', id, clientData),
  deleteClient: (id) => ipcRenderer.invoke('delete-client', id),
  
  // Menu events
  onMenuNewClient: (callback) => ipcRenderer.on('menu-new-client', callback),
  removeMenuListener: () => ipcRenderer.removeAllListeners('menu-new-client')
});
