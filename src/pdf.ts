import { getDocument } from 'pdfjs-dist';
import { IArchive } from './archive.js';
import fs from 'fs';

export default class Pdf implements IArchive {

    private pageNumber: number = -1;
    private index: string[] = [];
    private data: Buffer;

    constructor() {}

    public static async build(file: string) : Promise<Pdf> {
        return new Promise((resolve) => {
            const p = new Pdf();
            p.readFileAsync(file).then((data) => {
                p.data = data;
                getDocument(file).promise
                    .then((doc) => {
                        p.pageNumber = doc.numPages;
                        return p.buildIndexes(p.pageNumber);
                    }).then((result) => {
                        p.index = result;
                    });
                resolve(p);
            });
        });
    }

    public async getImageBlob(page: number): Promise<any> {
        return new Promise(async (resolve) => {
            resolve({ Mode: 'pdf', Data: this.data, Page: page + 1, });
        });
    }

    public getPageNumber(): number {
        return this.pageNumber - 1;
    }
    public getIndexList(): string[] {
        return this.index;
    }

    private async buildIndexes(page: number): Promise<string[]> {
        return new Promise((resolve) => {
            const digit = page.toString().length;
            const zero = '0'.repeat(digit);
            let i = 0;
            let index: string[] = [];
            for (i = 0; i < page; i++) {
                index.push((zero + i ).slice(-digit));
            }
            resolve(index);
        });
    }

    private readFileAsync(file: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            resolve(fs.readFileSync(file));
        });
    }
}
