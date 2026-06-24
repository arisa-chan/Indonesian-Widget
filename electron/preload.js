const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  setLoginItem: (enabled) => ipcRenderer.invoke('set-login-item', enabled),
  getLoginItem: () => ipcRenderer.invoke('get-login-item'),
  onNewDay: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('new-day', handler)
    // Return cleanup function
    return () => ipcRenderer.removeListener('new-day', handler)
  },
})
