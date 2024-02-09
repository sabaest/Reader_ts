import { BrowserWindow, dialog } from 'electron';
import { TARGET_EXT } from "./constants.js";

export default class DialogManager {

    public static OpenFileDialog(e: Electron.IpcMainInvokeEvent): string {
        const webContents = e.sender;
        const win = BrowserWindow.fromWebContents(webContents);

        let filename = dialog.showOpenDialogSync(win!, {
            properties: ['openFile'],
            title: 'Select open file',
            defaultPath: '.',
            filters: [
                { name: 'Arcive file', extensions: TARGET_EXT}
            ]
        });

        let file: string;
        switch (filename) {
            case null:
            case undefined:
                file = "";
                break;
            default:
                file = filename[0];
        }
        return file;
    }
}

