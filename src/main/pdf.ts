import { PDFDocumentProxy, getDocument } from "pdfjs-dist";
import { IArchive } from "./archive.js"

export default class Pdf implements IArchive {

    private pdf: PDFDocumentProxy;
    private file: string = "";
    private pageNumber: number = -1;
    private index: string[] = [];

    constructor(file: string) {
        this.file = file;
        getDocument(this.file).promise.then((result) => this.pdf = result);
        this.pageNumber = this.pdf.numPages;
        this.buildIndexes(this.pageNumber).then((result) => this.index = result);;
    }

    public async getImageBlob(page: number): Promise<any> {
        return new Promise(async (resolve) => {
            const data = await this.pdf.getPage(page);
            const viewport = data.getViewport({ scale: 1 });
            const canvas = new HTMLCanvasElement;
            const canvasContext = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const base64 = canvas.toDataURL('image/png')
            const tmp = base64.split(',')
            const blob = atob(tmp[1])
            const mime = tmp[0].split(':')[1].split(';')[0]
            const buf = new Uint8Array(blob.length)
            for (let i = 0; i < blob.length; i++) {
                buf[i] = blob.charCodeAt(i)
            }

            resolve({
                Buffer: buf,
                Type: mime,
            });
        });
    }

    public getPageNumber(): number {
        return this.pageNumber;
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
}
