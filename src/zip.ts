import admZip from 'adm-zip';
import { IMAGE_EXT } from './constants.js'
import { IArchive } from './archive.js';

export default class Zip implements IArchive {

    private zip: admZip = null;
    private file: string = '';
    private mime: string = ''
    private pageNumber: number = -1;
    private index: string[] = [];

    public constructor(file: string) {
        this.file = file;
    }

    public static async build(file: string) : Promise<Zip> {
        const p = new Zip(file);
        p.zip = new admZip(file);
        p.checkContents().then((result) => p.pageNumber = result);
        return p;
    }

    public getPageNumber(): number {
        return this.pageNumber;
    }

    public async getImageBlob(page: number): Promise<any> {
        return new Promise((resolve) => {
            const zipEntry = this.zip.getEntries()[page];
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

