import Store from 'electron-Store';

const store = new Store();

export default class SettingManager {

    static data = {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
        scale: 1,
        max: true,
    };

    static readonly savepath = 'save_setting';

    public static async set(
            w_setting: number | any, h: number,
            x: number, y: number,
            s: number = 1, m: boolean = false): Promise<void> {

        if (typeof w_setting === 'number') {
            this.data.width = w_setting;
            this.data.height = h;
            this.data.left = x;
            this.data.top = y;
            this.data.scale = s;
            this.data.max = m;
        }
        else {
            this.data = w_setting;
        }
    }

    public static async save(): Promise<void> {
        let json = JSON.stringify(this.data);
        store.set(this.savepath, json);
    }

    public static async load(): Promise<any> {
        let json = store.get(this.savepath) as string;
        if (json == undefined) return undefined;
        let data = JSON.parse(json);
        return data;
    }
}


