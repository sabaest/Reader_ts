import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import DialogManeger from './dialog';
import ArchiveManager from './archive';

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
            preload: path.join(__dirname, 'main_preload.js'),
        }
    });

    if (args != undefined) {
        win.setSize(args.width, args.height);
        win.setPosition(args.left, args.top);
        if (args.max) win.maximize();
    }

    win.loadFile('./src/renderer/main.html');
    win.menuBarVisible = false;

    await StartupLoad(win);
}

const createSubWindow = () => {

    indexList = archive.getIndexList();

    win.webContents.send('to-sub', {
        NowPage: archive.NowPage,
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
            preload: path.join(__dirname, 'sub_preload.js'),
        }
    });

    swin.loadFile('./src/renderer/sub.html');
    swin.menuBarVisible = false;
}

const StartupLoad = async (window: BrowserWindow): Promise<void> => {
    if (startup == undefined) { return; }

    window.webContents.on('did-finish-load', () => {

        archive = new ArchiveManager(startup);
        const data = archive.getImageBlob(archive.NowPage);

        window.webContents.send('image-send', data);
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

// #endregion

// #region events

ipcMain.handle('file-dialog', async (e: Electron.IpcMainInvokeEvent) => {
    let result = DialogManeger.OpenFileDialog(e);
    if (result == '') { return; }

    archive = new ArchiveManager(result);
    return archive.getImageBlob(archive.NowPage);
});

ipcMain.handle('file-drop', async (e: Electron.IpcMainInvokeEvent, filepath: string) => {
    if (filepath == '') { return }

    archive = new ArchiveManager(filepath);
    return archive.getImageBlob(archive.NowPage);
});

ipcMain.handle('page-shift', async (e: Electron.IpcMainEvent, shift: number) => {
    let p = archive.NowPage + shift;
    return archive.getImageBlob(p);
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

ipcMain.handle('page-jump', (e: Electron.IpcMainEvent, jump: number) => {
    archive.getImageBlob(jump).then((result) => win.webContents.send('image-send', result));
});

// #endregion
