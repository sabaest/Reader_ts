﻿import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import DialogManeger from './dialog.mjs';
import ArchiveManager from './archive.mjs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: BrowserWindow;
let swin: BrowserWindow;
let archive: ArchiveManager = null;
let indexList: string[] = [];

let startup = process.argv[2];

export let setting: any;

// #region functions

export const createWindow = async (args: any | undefined) => {

    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    if (args != undefined) {
        win.setSize(args.width, args.height);
        win.setPosition(args.left, args.top);
        if (args.max) win.maximize();
    }

    win.loadFile(path.join(__dirname, '../src/view/main.html'));
    win.menuBarVisible = false;

    await StartupLoad(win);
}

const createSubWindow = () => {

    indexList = archive.getIndexList();

    let [mw, mh] = win.getSize();
    let [sx, sy] = swinPosition(200, mh);

    swin = new BrowserWindow({
        width: 200,
        height: mh / 2,
        x: Math.round(sx),
        y: Math.round(sy),
        frame: false,
        parent: win,
        focusable: true,
        alwaysOnTop: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    swin.loadFile(path.join(__dirname, '../src/view/sub.html'));
    swin.menuBarVisible = false;
}

const StartupLoad = (window: BrowserWindow): Promise<void> => {
    if (startup == undefined) { return; }

    window.webContents.on('did-finish-load', async () => {
        ArchiveManager.build(startup)
            .then((result) => {
                return new Promise((resolve) => {
                    archive = result;
                    resolve(result.getImageBlob(archive.getPageNumber()));
                });
            })
            .then((result) => window.webContents.send('image-send', result));
        console.log('startup:' + startup);
        // await drawImage(startup).then(() => console.log('startup end'));
    });
}

const swinPosition = (subw: number, subh: number): [number, number] => {
    const [x, y] = win.getPosition();
    let rx = 0, ry = 0;

    rx = x - subw;
    ry = y + (subh / 4)

    if (subw < 0) rx = 0;

    return [rx, ry];
}

const drawImage = async (file: string) => {
    return new Promise((resolve) => {
        console.log(file);
        ArchiveManager.build(file).then((result) => {
            archive = result;
            archive.getImageBlob(archive.getPageNumber()).then((result) => {
                resolve(result);
            });
        });
    });
}

// #endregion

// #region events

ipcMain.handle('file-dialog', async (e: Electron.IpcMainInvokeEvent) => {
    let result = DialogManeger.OpenFileDialog(e);
    if (result == '') { return; }
    return drawImage(result);
});

ipcMain.handle('file-drop', async (e: Electron.IpcMainInvokeEvent, filepath: string) => {
    if (filepath == '') { return }
    return drawImage(filepath);
});

ipcMain.handle('page-shift', async (e: Electron.IpcMainEvent, shift: number) => {
    return archive.getImageBlob(archive.getPageNumber() + shift);
});

ipcMain.handle('send-scale', async (arg: any) => {
    let bounds = win.getBounds();

    setting = {
        width : bounds.width,
        height : bounds.height,
        left : bounds.x,
        top : bounds.y,
        scale : arg.Scale,
        max : win.isMaximized(),
    }
});

ipcMain.handle('open-sub-window', () => {
    createSubWindow();
});

ipcMain.handle('close-sub-window', () => {
    swin.close();
    win.webContents.send('sub-window-off');
});

ipcMain.handle('get-index', async (e) => indexList);

ipcMain.handle('page-jump', async (e: Electron.IpcMainEvent, jump: number) => {
    return archive.getImageBlob(archive.getBasePageNumber() + jump).then((result) => {
        win.webContents.send('image-send', result);
    });
});

ipcMain.handle('sync2sub', async (e) => {
    if (swin === undefined) return;
    swin.webContents.send('sync2sub', {
        PageName: archive.getPageName(),
        PageNumber: archive.getPageNumber(),
    });
});

ipcMain.handle('get-page', () => {
    return {
        FileName: path.basename(archive.getFileName()),
        PageName: archive.getPageName(),
        PageNumber: archive.getPageNumber(),
    };
});

// #endregion

