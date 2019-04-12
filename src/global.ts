import * as electron from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { MajsoulPlus } from './majsoul_plus';

// 提供 app模块
const app = electron.app ? electron.app : electron.remote.app;

/**
 * 应用保存数据的路径
 */
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

/**
 * 应用图标
 * //TODO: 修改图标路径 减少目录层级
 */
export const appIcon: string = (() => {
  switch (os.platform()) {
    case 'win32':
      return path.join(__dirname, '/bin/icons/icon.ico');
    case 'darwin':
      return path.join(__dirname, '/bin/icons/icon.icns');
    default:
      return path.join(__dirname, '/bin/icons/icon.png');
  }
})();

// tslint:disable-next-line
export const GlobalPath: MajsoulPlus.GlobalPath = {
  LocalDir: '/static',
  ModsDir: 'mod',
  ExtensionDir: 'extension',
  ToolsDir: 'tool',
  ExecutesDir: 'execute'
};

// tslint:disable-next-line
export const Global: MajsoulPlus.Global = {
  version: '1.12.0-beta.3',
  ServerPort: 8887,
  // PIPE_PORT: 8888,
  XOR_KEY: 73,
  EXTEND_RES_KEYWORD: 'extendRes',
  RemoteDomain: 'https://majsoul.union-game.com/',
  HttpRemoteDomain: 'http://majsoul.union-game.com/',
  ModsConfigPath: ((): string => {
    const p = path.join(appDataDir, 'modsEnabled.json');
    if (!fs.existsSync(p)) {
      fs.copyFileSync(
        path.join(__dirname, '../', GlobalPath.ModsDir, 'active.json'),
        p
      );
    }
    return p;
  })(),
  ExtensionConfigPath: ((): string => {
    const p = path.join(appDataDir, 'extensions.json');
    if (!fs.existsSync(p)) {
      fs.copyFileSync(
        path.join(__dirname, '../', GlobalPath.ExtensionDir, 'extensions.json'),
        p
      );
    }
    return p;
  })(),
  ExecutesConfigPath: ((): string => {
    const p = path.join(appDataDir, 'executesEnabled.json');
    if (!fs.existsSync(p)) {
      fs.copyFileSync(
        path.join(__dirname, '../', GlobalPath.ExecutesDir, 'active.json'),
        p
      );
    }
    return p;
  })(),
  UserConfigPath: path.join(appDataDir, 'Configs-user.json'),

  GameWindowConfig: {
    width: 1280 + 16,
    height: 720 + 39,
    frame: true,
    resizable: true,
    backgroundColor: '#000000',
    webPreferences: {
      webSecurity: false
      // nodeIntegration: false
      // plugins: true
    },
    autoHideMenuBar: true,
    // useContentSize: true,
    icon: appIcon,
    show: false,
    enableLargerThanScreen: true
  },
  ManagerWindowConfig: {
    width: 1280, // + 16,
    height: 720, // + 39,
    frame: false,
    resizable: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    title: '雀魂Plus',
    autoHideMenuBar: true,
    icon: appIcon,
    maximizable: false,
    fullscreenable: false,
    show: false
  },
  ToolWindowConfig: {
    width: 960, // + 16,
    height: 540, // + 39,
    frame: true,
    resizable: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    autoHideMenuBar: true,
    icon: appIcon,
    maximizable: false,
    fullscreenable: false,
    useContentSize: true
  },
  HttpGetUserAgent: `Mozilla/5.0 (${os.type()} ${os.release()}; ${os.arch()}) MajsoulPlus/${app.getVersion()} Chrome/${
    process.versions.chrome
  }`
};
