import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld(
    'sub', {
        on: (channel: string, callback: any) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
        send: (channel: string, args: any) => ipcRenderer.invoke(channel, args),
        getIndexList: async () => ipcRenderer.invoke('get-index'),
        pageJump: (jump: number) => ipcRenderer.invoke('page-jump', jump),
    });
