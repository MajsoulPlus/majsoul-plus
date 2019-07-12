import * as electron from 'electron'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { ncp } from 'ncp'
import { MajsoulPlus } from './majsoul_plus'

// 提供 app模块
const app = electron.app ? electron.app : electron.remote.app

/**
 * 应用保存数据的路径
 */
export const appDataDir: string = ((): string => {
  const localData = path.resolve(
    process.env.NODE_ENV === 'development'
      ? path.resolve(__dirname, '..')
      : path.resolve(app.getAppPath(), '../..'),
    'data'
  )
  const appData = app.getPath('userData')
  if (fs.existsSync(localData) && fs.statSync(localData).isDirectory()) {
    return localData
  } else {
    if (!fs.existsSync(appData)) {
      fs.mkdirSync(appData)
    }
    return appData
  }
})()

/**
 * 应用图标
 * //TODO: 修改图标路径 减少目录层级
 */
export const appIcon: string = (() => {
  switch (os.platform()) {
    case 'win32':
      return path.join(__dirname, 'bin', 'icons/icon.ico')
    case 'darwin':
      return path.join(__dirname, 'bin', 'icons/icon.icns')
    default:
      return path.join(__dirname, 'bin', 'icons/icon.png')
  }
})()

// tslint:disable-next-line
export const GlobalPath: MajsoulPlus.GlobalPath = {
  LocalDir: '/static',
  ResourcePackDir: 'resourcepack',
  ExtensionDir: 'extension',
  ToolsDir: 'tool',
  ExecutesDir: 'execute'
}

// tslint:disable-next-line
export const RemoteDomains = {
  zh: 'https://majsoul.union-game.com/0/',
  jp: 'https://game.mahjongsoul.com/',
  en: 'https://mahjongsoul.game.yo-star.com/'
}

// tslint:disable-next-line
export const Global: MajsoulPlus.Global = {
  version: '1.12.0-beta.3',
  ServerPort: 8887,
  // PIPE_PORT: 8888,
  XOR_KEY: 73,
  EXTEND_RES_KEYWORD: 'extendRes',
  RemoteDomain: 'https://majsoul.union-game.com/',
  HttpRemoteDomain: 'http://majsoul.union-game.com/',
  ResourcePackConfigPath: '',
  ExtensionConfigPath: '',
  ExecutesConfigPath: '',
  ToolConfigPath: '',
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
    show: true,
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
}

export function InitGlobal() {
  [
    Global.ResourcePackConfigPath,
    Global.ExtensionConfigPath,
    Global.ExecutesConfigPath,
    Global.ToolConfigPath
  ] = [
    GlobalPath.ResourcePackDir,
    GlobalPath.ExtensionDir,
    GlobalPath.ExecutesDir,
    GlobalPath.ToolsDir
  ].map(dir => {
    const folder = path.join(appDataDir, dir)
    if (!fs.existsSync(folder)) {
      ncp(path.join(__dirname, 'bin', dir), folder, err => {
        if (err) console.error(err)
      })
    }
    return path.join(folder, 'active.json')
  })
}
