import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export const appDataDir: string = ((): string => {
  const localData = path.join(app.getAppPath(), 'data');
  const appData = app.getPath('userData');
  if (fs.existsSync(localData) && fs.statSync(localData).isDirectory()) {
    return localData;
  } else {
    if (!fs.existsSync(appData)) {
      fs.mkdirSync(appData);
    }
    return appData;
  }
})();

export const majsoulPlusGlobal: MajsoulPlus.Global = {
  SERVER_PORT: 8887,
  // PIPE_PORT: 8888,
  XOR_KEY: 73,
  EXTEND_RES_KEYWORD: 'extendRes',
  REMOTE_DOMAIN: 'https://majsoul.union-game.com/',
  HTTP_REMOTE_DOMAIN: 'http://majsoul.union-game.com/',
  LOCAL_DIR: '/static',
  MODS_DIR: '/mod',
  MODS_CONFIG_PATH: path.join(appDataDir, 'modsEnabled.json'),
  PLUGINS_DIR: '/plugin',
  TOOLS_DIR: '/tool',
  EXECUTES_DIR: '/execute',
  EXECUTES_CONFIG_PATH: path.join(appDataDir, 'executesEnabled.json'),
  USER_CONFIG_PATH: path.join(appDataDir, 'Configs-user.json')
};
