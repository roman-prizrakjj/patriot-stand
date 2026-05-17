const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

contextBridge.exposeInMainWorld('patriotHost', {
  launchExternal: (target: string) => ipcRenderer.invoke('patriot:launch-external', target),
});
