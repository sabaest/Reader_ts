﻿import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import DialogManeger from './dialog.js';
import ArchiveManager from './archive.js';
import { fileURLToPath } from 'url';

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

    // win.webContents.openDevTools();

    win.loadFile(path.join(__dirname, '../src/view/main.html'));
    win.menuBarVisible = false;

    await StartupLoad(win);
}

const createSubWindow = () => {

    indexList = archive.getIndexList();

    win.webContents.send('to-sub', {
        NowPage: archive.getPageNumber(),
    });

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

    swin.loadFile(path.join(__dirname, './src/view/sub.html'));
    swin.menuBarVisible = false;
}

const StartupLoad = async (window: BrowserWindow): Promise<void> => {
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

const sendArchive = () => {
    win.webContents.send('get-archve', {
        FileName: path.basename(archive.getFileName()),
        PageNum: archive.getPageNumber(),
        PageName: archive.getPageName(),
    })
}

const drawImage = async (file: string) => {
    return new Promise((resolve) => {
        ArchiveManager.build(file).then((result) => {
            archive = result;
            archive.getImageBlob(archive.getPageNumber()).then((result) => {
                sendArchive();
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
    return archive.getImageBlob(archive.getPageNumber() + shift).then((result) => {
        sendArchive();
        return result;
    });
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
    return archive.getImageBlob(jump).then((result) => {
        sendArchive();
        win.webContents.send('image-send', result);
    });
});

// #endregion

