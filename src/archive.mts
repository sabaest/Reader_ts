import { MODE } from './constants.mjs';
import Zip from './zip.mjs'
import Pdf from './pdf.mjs';

export interface IArchive {
    getImageBlob(page: number): Promise<any>;
    getPageCount(): number;
    getPageNumber(): number;
    getBasePageNumber(): number;
    getPageName(): string;
    getIndexList(): string[];
}

export default class ArchiveManager {

    protected archive: IArchive;
    protected file: string = '';
    protected mode: MODE = MODE.none;

    public constructor (file: string) {
        this.file = file;
    }

    public static async build(file: string): Promise<ArchiveManager> {
        return new Promise(async (resolve) => {
            const b = new ArchiveManager(file);
            b.mode = b.checkFileExt();
            if (b.mode != MODE.none) {
                b.getArchiveSelect().then(() => resolve(b));
            }
        });
    }

    public getFileName() {
        return this.file;
    }

    public getPageName() {
        return this.archive.getPageName();
    }

    public getPageCount() {
        return this.archive.getPageCount();
    }

    public getPageNumber() {
        return this.archive.getPageNumber();
    }

    public getBasePageNumber() {
        return this.archive.getBasePageNumber();
    }

    public getMode() {
        return this.mode;
    }

    public async getImageBlob(page: number): Promise<any> {
        return this.archive.getImageBlob(page);
    }

    public getIndexList(): string[] {
        return this.archive.getIndexList();
    }

    private checkFileExt(): MODE {
        switch (this.file.split('.').pop()) {
            case 'zip':
                return MODE.zip;
            case 'pdf':
                return MODE.pdf;
            default:
        }
        return MODE.none;
    }

    private async getArchiveSelect() {
        switch (this.mode) {
            case MODE.zip:
                this.archive = await Zip.build(this.file);
                break;
            case MODE.pdf:
                this.archive = await Pdf.build(this.file);
                break;
            default:
        }
    }
}