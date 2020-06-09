import { app } from 'electron'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as semver from 'semver'
import { ConsoleLogger } from './logger'
import { MajsoulPlus } from './majsoul_plus'
import { copyFolderSync, getFoldersSync, removeDirSync } from './utils'

export const Logger = new ConsoleLogger('Majsoul_Plus')

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

// 应用图标
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

export const GlobalPath: MajsoulPlus.GlobalPath = {
  LocalDir: '/static',
  ResourcePackDir: 'resourcepack',
  ExtensionDir: 'extension',
  ToolsDir: 'tool'
}

export const RemoteDomains = [
  { id: 0, name: 'zh', domain: 'https://game.maj-soul.com/1' },
  { id: 1, name: 'jp', domain: 'https://game.mahjongsoul.com' },
  { id: 2, name: 'en', domain: 'https://mahjongsoul.game.yo-star.com' }
]

export const Global: MajsoulPlus.Global = {
  version: app.getVersion(),
  ServerPort: 8887,
  XOR_KEY: 73,
  EXTEND_RES_KEYWORD: 'extendRes',
  ResourcePackConfigPath: '',
  ExtensionConfigPath: '',
  ToolConfigPath: '',
  UserConfigPath: path.join(appDataDir, 'user-config.json'),
  LocalCachePath: path.join(appDataDir, GlobalPath.LocalDir),
  ResourceFolderPath: path.join(appDataDir, GlobalPath.ResourcePackDir),
  ExtensionFolderPath: path.join(appDataDir, GlobalPath.ExtensionDir),
  ToolFolderPath: path.join(appDataDir, GlobalPath.ToolsDir),

  GameWindowConfig: {
    width: 1280 + 16,
    height: 720 + 39,
    frame: true,
    resizable: true,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    // useContentSize: true,
    icon: appIcon,
    show: true,
    enableLargerThanScreen: true,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  },
  ManagerWindowConfig: {
    width: 1280, // + 16,
    height: 720, // + 39,
    frame: false,
    resizable: false,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    },
    title: '雀魂Plus',
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
  ;[
    Global.ResourcePackConfigPath,
    Global.ExtensionConfigPath,
    Global.ToolConfigPath
  ] = [
    GlobalPath.ResourcePackDir,
    GlobalPath.ExtensionDir,
    GlobalPath.ToolsDir
  ].map(dir => {
    const from = path.join(__dirname, 'bin', dir)
    const to = path.join(appDataDir, dir)
    if (!fs.existsSync(to) && app) {
      copyFolderSync(from, appDataDir)
    } else {
      const folders = getFoldersSync(from)
      folders.forEach(ext => {
        if (
          // 首先该拓展需要存在
          fs.existsSync(path.join(to, ext, `${dir}.json`)) &&
          (() => {
            try {
              const old = JSON.parse(
                fs.readFileSync(path.join(to, ext, `${dir}.json`), {
                  encoding: 'utf-8'
                })
              )
              const latest = JSON.parse(
                fs.readFileSync(path.join(from, ext, `${dir}.json`), {
                  encoding: 'utf-8'
                })
              )
              if (old.version === undefined) throw new Error('1.x')
              else {
                // 版本号合法性检查
                if (!semver.valid(old.version)) {
                  throw new Error('invalid version')
                }
                // 比对版本号是否是新的大于旧的
                return semver.gt(latest.version, old.version)
              }
            } catch {
              return true
            }
          })()
        ) {
          const exactFrom = path.join(from, ext)
          removeDirSync(path.join(to, ext))
          copyFolderSync(exactFrom, to)
        }
      })
    }
    return path.join(to, 'active.json')
  })
}
