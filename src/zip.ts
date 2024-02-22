import admZip from 'adm-zip';
import { IMAGE_EXT } from './constants.js'
import { IArchive } from './archive.js';

export default class Zip implements IArchive {

    private zip: admZip = null;
    private pageCount: number = -1;
    private pageNumber: number = 0;
    private pageName: string = '';
    private index: string[] = [];

    public constructor() {}

    public static async build(file: string) : Promise<Zip> {
        return new Promise((resolve) => {
            const p = new Zip();
            p.zip = new admZip(file);
            p.checkContents().then((result) => p.pageCount = result);
            resolve(p);
        });
    }

    public getPageCount(): number {
        return this.pageCount;
    }

    public getPageNumber() {
        return this.pageNumber;
    }

    public async getImageBlob(page: number): Promise<any> {
        return new Promise((resolve) => {
            this.pageNumber = page < 0 ? this.pageCount : page > this.pageCount ? 0 : page ;
            const zipEntry = this.zip.getEntries()[this.pageNumber];
            this.pageName = zipEntry.entryName;
            resolve({
                Mode: 'zip',
                Buffer: zipEntry.getData(),
                Mime: this.getMime(zipEntry.name),
            });
        });
    }

    public getIndexList(): string[] {
        return this.index;
    }

    public getPageName() {
        return this.pageName;
    }

    private async checkContents(): Promise<number> {
        return new Promise((resolve) => {
            let num = 0;
            this.index = [];

            for (const entry of this.zip.getEntries()) {
                let name = entry.name;
                let ext = name.split('.').pop();
                if (Object.keys(IMAGE_EXT).includes(ext)) {
                    num++;
                    this.index.push(entry.name);
                }
            }

            resolve(num - 1);
        });

    }

    private getMime(file: string): string {
        const ext = file.split('.').pop();
        switch (ext) {
            case 'bmp':
                return 'image/bmp';
            case 'jpg':
            case 'jpeg':
                    return 'image/jpeg';
            default:
        }
        return '';
    }
}

