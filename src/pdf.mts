import { loadavg } from 'os';
import * as pdfjs from 'pdfjs-dist/build/pdf.min.mjs';
import { IArchive } from './archive.mjs';
import fs from 'fs';

pdfjs.GlobalWorkerOptions.workerSrc = '../build/pdf.worker.min.mjs';

export default class Pdf implements IArchive {

    private pageCount: number = -1;
    private pageNumber: number = 1;
    private index: string[] = [];
    private data: Buffer;
    private loading: boolean = true;

    constructor() {}

    public static async build(file: string) : Promise<Pdf> {
        return new Promise((resolve) => {
            const p = new Pdf();
            p.readFileAsync(file).then((data) => {
                p.data = data;
                p.loading = false;
                pdfjs.getDocument(file).promise.then((doc) => {
                    p.pageCount = doc.numPages;
                    p.buildIndexes(p.pageCount).then((result) => p.index = result);
                    p.loading = true;
                });
                resolve(p);
            });
        });
    }

    public async getImageBlob(page: number): Promise<any> {
        if (!this.loading) {
            return new Promise((resolve) => {
                resolve({ Mode: 'pdf', Data: this.data, Page: 1, });
            });
        }
        else {
            return new Promise((resolve) => {
                let p = page < 1 ? this.pageCount : page > this.pageCount ? 1 : page ;
                this.pageNumber = p;
                resolve({ Mode: 'pdf', Data: this.data, Page: p, });
            });
        }
    }

    public getPageCount(): number {
        return this.pageCount;
    }

    public getPageNumber() {
        return this.pageNumber;
    }

    public getBasePageNumber() {
        return 1;
    }

    public getPageName(): string {
        return '';
    }

    public getIndexList(): string[] {
        return this.index;
    }

    private async buildIndexes(page: number): Promise<string[]> {
        return new Promise((resolve) => {
            const digit = page.toString().length;
            const zero = '0'.repeat(digit);
            let i = 1;
            let index: string[] = [];
            for (i = 1; i <= page; i++) {
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
