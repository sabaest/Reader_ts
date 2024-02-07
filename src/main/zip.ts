import admZip from "adm-zip";
import { IMAGE_EXT } from "./constants"
import { IArchive } from "./archive";

export default class Zip implements IArchive {

    private zip: admZip = null;
    private file: string = '';
    private mime: string = ''
    private pageNumber: number = -1;
    private index: string[] = [];

    public constructor(file: string) {
        this.file = file;
        this.zip = new admZip(this.file);
        this.checkContents().then((result) => this.pageNumber = result);
    }

    public getPageNumber(): number {
        return this.pageNumber;
    }

    public async getImageBlob(page: number): Promise<any> {
        return new Promise((resolve) => {
            const zipEntry = this.zip.getEntries()[page];
            resolve({
                Buffer: zipEntry.getData(),
                Mime: this.getMime(zipEntry.name),
            });
        });
    }

    public getIndexList(): string[] {
        return this.index;
    }

    private async checkContents(): Promise<number> {
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

        return num - 1;
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

