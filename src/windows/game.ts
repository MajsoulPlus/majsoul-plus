import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  dialog,
  ipcMain,
  Menu,
  MenuItem,
  screen,
  MenuItemConstructorOptions,
  app
} from 'electron'
import { AddressInfo } from 'net'
import * as path from 'path'
import { SaveConfigJson, UserConfigs } from '../config'
import { Global, Logger, RemoteDomains } from '../global'
import i18n from '../i18n'
import {
  CloseServer,
  httpServer,
  httpsServer,
  ListenServer,
  LoadServer
} from '../server'
import { ToolManager } from '../tool/tool'
import { AudioPlayer, initPlayer, shutoffPlayer } from './audioPlayer'
import { ManagerWindow } from './manager'

export class GameWindows {
  private static windows: Map<number, BrowserWindow> = new Map()
  private static windowIdCount = 0
  private static windowCount = 0
  static get size() {
    return this.windowCount
  }

  static get(index: number) {
    return this.windows.get(index)
  }

  static newWindow() {
    const id = this.windowIdCount++
    this.windowCount++
    this.windows.set(id, newGameWindow(id))

    if (id === 0) {
      initPlayer()
    }
    return id
  }

  static destroyWindow(id: number) {
    this.windows.delete(id)

    if (this.windowCount === 1) {
      // 关闭后台音频播放器
      shutoffPlayer()
      // 关闭本地镜像服务器
      CloseServer()
      // 依据用户设置显示被隐藏的管理器窗口
      if (UserConfigs.window.isManagerHide) {
        app.relaunch()
      }
    }
    this.windowCount--
  }

  static forEach(callback: (window: BrowserWindow, id: number) => void) {
    this.windows.forEach((window, id) => callback(window, id))
  }
}

export function initGameWindow() {}

export function newGameWindow(id: number) {
  let window: BrowserWindow

  const config: BrowserWindowConstructorOptions = {
    ...Global.GameWindowConfig,
    title: getGameWindowTitle(id),
    frame: !UserConfigs.window.isNoBorder,
    webPreferences:
      GameWindows.size > 1
        ? {
            ...Global.GameWindowConfig.webPreferences,
            partition: String(id)
          }
        : Global.GameWindowConfig.webPreferences
  }

  if (UserConfigs.window.gameWindowSize !== '') {
    const windowSize = UserConfigs.window.gameWindowSize
      .split(',')
      .map((value: string) => Number(value))
    config.width = windowSize[0]
    config.height = windowSize[1]
  }

  window = new BrowserWindow(config)

  // 阻止标题更改
  window.on('page-title-updated', event => event.preventDefault())

  window.setMenu(getGameWindowMenu(id))

  window.webContents.on('dom-ready', () => {
    // 加载本地服务器地址
    const http = UserConfigs.userData.useHttpServer
    const port = (UserConfigs.userData.useHttpServer
      ? (httpServer.address() as AddressInfo)
      : (httpsServer.address() as AddressInfo)
    ).port
    const url = `http${
      UserConfigs.userData.useHttpServer ? '' : 's'
    }://localhost:${port}/`

    window.webContents.send(
      'load-url',
      url,
      port,
      http,
      id > 0 ? String(id) : undefined
    )
  })

  window.on('close', () => {
    // TODO: 退出确认
    GameWindows.destroyWindow(id)
  })

  // 监听到崩溃事件，输出 console
  window.webContents.on('crashed', () =>
    Logger.error(i18n.text.main.webContentsCrashed())
  )

  // 当且仅当只有一个游戏窗口时修改游戏窗口
  // 监听尺寸更改事件，保存用户的窗口大小
  if (GameWindows.size === 1) {
    window.on('resize', () => {
      UserConfigs.window.gameWindowSize = window.getSize().toString()
      SaveConfigJson(UserConfigs)
    })
  }

  window.once('ready-to-show', () => {
    // 设置页面缩放比例为 1 来防止缩放比例异常
    // 但这样会造成截图提示悬浮窗尺寸不合适
    window.webContents.zoomFactor = 1
    window.show()
  })

  // 设置 GameWindow 的 userAgent
  window.webContents.userAgent = Global.HttpGetUserAgent

  // 载入本地启动器
  window.loadURL('file://' + path.join(__dirname, '../bin/main/index.html'))

  // 在 debug 启动环境下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    window.webContents.openDevTools({
      mode: 'detach'
    })
  }

  return window
}

function getGameWindowMenu(id: number) {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: i18n.text.main.programName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ] as MenuItemConstructorOptions[]
          }
        ]
      : []),
    {
      label: '游戏',
      role: 'services',
      submenu: [
        ...['F12', 'CmdOrCtrl+P'].map((acc, index) => {
          return {
            label: '截图',
            accelerator: acc,
            visible: index === 0,
            click: (item: MenuItem, window: BrowserWindow) => {
              takeScreenshot(id)
            }
          }
        }),
        {
          label: GameWindows.size > 1 ? '关闭窗口' : '结束游戏',
          accelerator: 'Alt+F4',
          click: (item: MenuItem, window: BrowserWindow) => {
            window.close()
          }
        }
      ] as MenuItemConstructorOptions[]
    },
    {
      label: '窗口',
      role: 'window',
      submenu: [
        {
          label: '多开',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: (item: MenuItem, window: BrowserWindow) => {
            GameWindows.newWindow()
          }
        },
        {
          label: '置顶',
          accelerator: 'CmdOrCtrl+T',
          type: 'checkbox',
          click: (item: MenuItem, window: BrowserWindow) => {
            window.setAlwaysOnTop(!window.isAlwaysOnTop())
          }
        },
        ...['F11', 'F5'].map((acc, index) => {
          return {
            label: '全屏',
            accelerator: acc,
            type: 'checkbox',
            enabled: GameWindows.size === 1,
            visible: index === 0,
            click: (item: MenuItem, window: BrowserWindow) => {
              if (!UserConfigs.window.isKioskModeOn) {
                window.setFullScreen(!window.isFullScreen())
              } else {
                window.setKiosk(!window.isKiosk())
              }
            }
          }
        })
      ] as MenuItemConstructorOptions[]
    },
    {
      label: '编辑',
      role: 'editMenu'
    },
    {
      label: '工具',
      role: 'tool',
      submenu: Object.entries(ToolManager.getDetails()).map(([id, tool]) => {
        return {
          label: tool.metadata.name,
          click: (item: MenuItem, window: BrowserWindow) => {
            ipcMain.emit('start-tool', {}, id)
          }
        }
      })
    },
    {
      label: '开发',
      submenu: [
        {
          label: '重载全部资源',
          accelerator: 'Shift+Alt+R',
          click: (item: MenuItem, window: BrowserWindow) => {
            CloseServer()
            ipcMain.emit('refresh-resourcepack', {})
            ipcMain.emit('refresh-extension', {})
            LoadServer()
            ListenServer(Global.ServerPort)
            GameWindows.forEach(window => window.reload())
          }
        },
        {
          label: '重新载入本窗口',
          accelerator: 'CmdOrCtrl+R',
          click: (item: MenuItem, window: BrowserWindow) => {
            window.reload()
          }
        },
        {
          label: '重新载入所有窗口',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: (item: MenuItem, window: BrowserWindow) => {
            // FIXME: 某些情况下会直接卡死
            // 非常快速地创建新窗口可以稳定复现(一秒内5个左右)
            // 原因未知 但用户应该不会用这么快手速多开(
            GameWindows.forEach(window => window.reload())
          }
        },
        {
          label: '开发者工具',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: (item: MenuItem, window: BrowserWindow) => {
            if (process.env.NODE_ENV === 'development') {
              window.webContents.openDevTools({ mode: 'detach' })
            }
            window.webContents.send('open-devtools')
          }
        }
      ] as MenuItemConstructorOptions[]
    }
  ] as MenuItemConstructorOptions[]

  return Menu.buildFromTemplate(template)
}

// 获取窗口标题，有 0.5% 概率显示为喵喵喵
function getGameWindowTitle(id: number): string {
  // 彩蛋标题
  const titles = [
    {
      text: i18n.text.main.programName(),
      weight: 200
    },
    {
      text: i18n.text.main.nya(),
      weight: 1
    }
  ]
  const sumWeight = titles.reduce((last, value) => last + value.weight, 0)
  let randomResult = Math.random() * sumWeight

  const index = titles.reduce((last: number | null, value, i) => {
    if (typeof last === 'number' && Number.isInteger(last)) {
      return last
    }

    randomResult -= value.weight
    if (randomResult <= 0) {
      return i
    }

    return null
  }, null)

  return titles[index].text + (id > 0 ? ` #${id}` : '')
}

// 截取屏幕画面
function takeScreenshot(id: number) {
  AudioPlayer.webContents.send(
    'audio-play',
    path.join(__dirname, '../bin/audio/screenshot.mp3')
  )

  const window = GameWindows.get(id)
  const rect = window.getBounds()
  const display = screen.getDisplayMatching({
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.floor(rect.width),
    height: Math.floor(rect.height)
  })
  window.webContents.send('take-screenshot', id, display.scaleFactor)
}
