import { app } from 'electron';
import { createWindow, setting } from './index.js';
import SettingManager from './setting.js';

app.on('window-all-closed', (e) => {
    saveSetting()
        .then(() => console.log('save : ' + new Date().toISOString() ));

    app.quit();
});

app.on('ready', (e) => {
    loadSetting()
        .then(async (result) => await createWindow(result));
});

const loadSetting = async () => {
    return await SettingManager.load();
}

const saveSetting = async () => {
    SettingManager.set(setting.width, setting.height, setting.left, setting.top, setting.scale, setting.max)
        .then( async () => await SettingManager.save());
}
