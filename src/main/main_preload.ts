import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld(
    'api', {
        on: (channel: string, callback: any) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
        send: (channel: string, args: any) => ipcRenderer.invoke(channel, args),
        openFileDialog: () => ipcRenderer.invoke('file-dialog'),
        getDrop: (filepath: string) => ipcRenderer.invoke('file-drop', filepath),
        pageShift: async (shift: number) => ipcRenderer.invoke('page-shift', shift),
        openSubWindow: () => ipcRenderer.invoke('open-sub-window'),
        closeSubWindow: () => ipcRenderer.invoke('close-sub-window'),
    });

