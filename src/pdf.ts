import { PDFDocumentProxy, getDocument } from "pdfjs-dist";
import { IArchive } from "./archive.js";

export default class Pdf implements IArchive {

    private pdf: PDFDocumentProxy;
    private pageNumber: number = -1;
    private index: string[] = [];

    constructor() {}

    public static async build(file: string) : Promise<Pdf> {
        const p = new Pdf();
        p.pdf = await getDocument(file).promise;
        p.pageNumber = p.pdf.numPages;
        p.buildIndexes(p.pageNumber).then((result) => p.index = result);
        return p;
    }

    public async getImageBlob(page: number): Promise<any> {
        return new Promise(async (resolve) => {
            const pageProxy = await this.pdf.getPage(page);
            const viewport = pageProxy.getViewport();
            const renderContext = { viewport, };
            resolve({ Page: pageProxy, Context: renderContext, });
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
