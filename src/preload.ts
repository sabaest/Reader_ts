const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld(
    'api', {
        reciever: (channel: string, callback: any) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
        sender: (channel: string, args: any) => ipcRenderer.invoke(channel, args),
        openFileDialog: () => ipcRenderer.invoke('file-dialog'),
        getDrop: (filepath: string) => ipcRenderer.invoke('file-drop', filepath),
        pageShift: async (shift: number) => ipcRenderer.invoke('page-shift', shift),
        openSubWindow: () => ipcRenderer.invoke('open-sub-window'),
        closeSubWindow: () => ipcRenderer.invoke('close-sub-window'),
    });

contextBridge.exposeInMainWorld(
    'sub', {
        reciever: (channel: string, callback: any) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
        sender: (channel: string, args: any) => ipcRenderer.invoke(channel, args),
        getIndexList: async () => ipcRenderer.invoke('get-index'),
        pageJump: (jump: number) => ipcRenderer.invoke('page-jump', jump),
    });
