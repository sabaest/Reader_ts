declare global {
    interface Window {
        api: IApi;
        sub: ISubApi;
    }
}

export interface IApi {
    reciever: (channel: string, callback: any) => Promise<void>;
    sender: (channel: string, args: any) => Promise<any>;
    openFileDialog: () => Promise<any>;
    getDrop: (file: string) => Promise<any>;
    pageShift: (shift: number) => Promise<any>;
    openSubWindow: () => void;
    closeSubWindow: () => void;
}

export interface ISubApi {
    reciever: (channel: string, callback: any) => Promise<void>;
    sender: (channel: string, args: any) => Promise<any>;
    getIndexList: () => Promise<string[]>;
    pageJump: (jump: number) => void;
}
