import { MODE } from "./constants.js";
import Zip from "./zip.js"
import Pdf from "./pdf.js";

export interface IArchive {
    getImageBlob(page: number): Promise<any>;
    getPageNumber(): number;
    getIndexList(): string[];
}

export default class ArchiveManager {

    protected archive: IArchive;
    protected File: string = "";
    protected Mode: MODE = MODE.none;
    protected PageNumber: number = -1;

    public NowPage: number = 0;

    public constructor (file: string) {
        this.File = file;
    }

    public static async build(file: string): Promise<ArchiveManager> {
        let b = new ArchiveManager(file);
        b.Mode = b.checkFileExt();
        if (b.Mode != MODE.none) {
            await b.getArchiveSelect();
            b.PageNumber = b.archive.getPageNumber();
        }
        return b;
    }

    public getMode() {
        return this.Mode;
    }

    public async getImageBlob (page: number): Promise<any> {
        const p = this.archive.getPageNumber();
        this.NowPage = page > p ? 0 : page < 0 ? p : page;
        return this.archive.getImageBlob(this.NowPage);
    }

    public getIndexList(): string[] {
        return this.archive.getIndexList();
    }

    private checkFileExt(): MODE {
        switch (this.File.split('.').pop()) {
            case "zip":
                return MODE.zip;
            case "pdf":
                return MODE.pdf;
            default:
        }
        return MODE.none;
    }

    private async getArchiveSelect() {
        switch (this.Mode) {
            case MODE.zip:
                this.archive = await Zip.build(this.File);
                break;
            case MODE.pdf:
                this.archive = await Pdf.build(this.File);
                break;
            default:
        }
    }
}