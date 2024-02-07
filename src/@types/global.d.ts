declare global {
    interface Window {
        api: IApi;
        sub: ISubApi;
    }
}

export interface IApi {
    on: (channel: string, callback: any) => Promise<void>;
    send: (channel: string, args: any) => Promise<void>;
    openFileDialog: () => Promise<any>;
    getDrop: (file: string) => Promise<any>;
    pageShift: (shift: number) => Promise<any>;
    openSubWindow: () => void;
    closeSubWindow: () => void;
}

export interface ISubApi {
    on: (channel: string, callback: any) => Promise<void>;
    send: (channel: string, args: any) => Promise<void>;
    getIndexList: () => Promise<string[]>;
    pageJump: (jump: number) => void;
}
