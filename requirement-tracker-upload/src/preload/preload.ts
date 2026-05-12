import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getServerUrl: (): Promise<string> => ipcRenderer.invoke('get-server-url'),
});