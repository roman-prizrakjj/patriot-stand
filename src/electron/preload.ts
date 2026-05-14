import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('patriotHost', {
  launchExternal: (target: string) => ipcRenderer.invoke('patriot:launch-external', target),
});
