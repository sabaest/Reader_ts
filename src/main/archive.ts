import { MODE } from "./constants";
import Zip from "./zip"
import Pdf from "./pdf";

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
        this.Mode = this.checkFileExt();

        if (this.Mode != MODE.none) {
            this.getArchiveSelect();
            this.PageNumber = this.archive.getPageNumber();
        }
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
        const ext = this.File.split('.').pop();
        console.log(ext);
        switch (ext) {
            case "zip":
                return MODE.zip;
            case "pdf":
                return MODE.pdf;
            default:
        }
        return MODE.none;
    }

    private getArchiveSelect() {
        switch (this.Mode) {
            case MODE.zip:
                this.archive = new Zip(this.File);
                break;
            case MODE.pdf:
                // this.archive = new Pdf(this.File);
                break;
            default:
        }
    }
}