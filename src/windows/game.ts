import { BrowserWindow, ipcMain, Menu, MenuItem } from 'electron'
import { AddressInfo } from 'net'
import * as path from 'path'
import { UserConfigs } from '../config'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { httpsServer } from '../server'
import { takeScreenshot } from '../utils-refactor'
import { initPlayer, shutoffPlayer } from './audioPlayer'
import { ManagerWindow } from './manager'

// tslint:disable-next-line
export let GameWindow: BrowserWindow
// tslint:disable-next-line
export const GameWindowStatus: MajsoulPlus.WindowStatus = {
  visible: false,
  muted: false
}

export function initGameWindow() {
  GameWindow = new BrowserWindow(Global.GameWindowConfig)

  // 阻止标题更改
  GameWindow.on('page-title-updated', event => event.preventDefault())

  // 监听 console 信息并转发至主进程
  GameWindow.webContents.on('console-message', (_, level, msg) => {
    console[level](msg)
  })

  GameWindow.on('closed', () => {
    // 关闭后台音频播放器
    shutoffPlayer()
    // 关闭本地镜像服务器
    httpsServer.close()
    // 依据用户设置显示被隐藏的管理器窗口
    if (UserConfigs.window.isManagerHide) {
      if (ManagerWindow) {
        ManagerWindow.show()
      }
    }
  })

  initPlayer()
  Menu.setApplicationMenu(GameWindowMenu)

  ipcMain.on('main-loader-ready', () => {
    GameWindow.webContents.send(
      'server-port-load',
      (httpsServer.address() as AddressInfo).port
    )
  })

  ipcMain.on('server-port-loaded', () => {
    GameWindow.webContents.send('executes-load', [])
  })

  ipcMain.on('executes-loaded', () => {
    // 加载本地服务器地址
    // TODO: 这里需要适配多服务器
    // FIXME: 这里硬编码了 /0/ ，与国际服不兼容
    console.error(
      `https://localhost:${(httpsServer.address() as AddressInfo).port}/0/`
    )
    GameWindow.webContents.send(
      'load-url',
      `https://localhost:${(httpsServer.address() as AddressInfo).port}/0/`
    )
  })

  // 载入本地启动器
  GameWindow.loadURL('file://' + path.join(__dirname, '../bin/main/index.html'))

  // Detect environment variable to open developer tools
  // 在 debug 启动环境下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    GameWindow.webContents.openDevTools({
      mode: 'detach'
    })
  }
}

// tslint:disable-next-line
export const GameWindowMenu: Menu = new Menu()

GameWindowMenu.append(
  new MenuItem({
    label: '游戏',
    role: 'services',
    submenu: [
      {
        label: '截图',
        accelerator: 'F12',
        click: (menuItem, browserWindow) => {
          takeScreenshot(browserWindow.webContents)
        }
      },
      {
        label: '截图',
        accelerator: 'CmdOrCtrl+P',
        enabled: true,
        visible: false,
        click: (menuItem, browserWindow) => {
          takeScreenshot(browserWindow.webContents)
        }
      },
      {
        label: '重新载入',
        accelerator: 'CmdOrCtrl+R',
        click: (menuItem, browserWindow) => {
          browserWindow.reload()
        }
      },
      {
        label: '退出游戏',
        accelerator: 'Alt+F4',
        click: (menuItem, browserWindow) => {
          browserWindow.close()
        }
      }
    ]
  })
)

GameWindowMenu.append(
  new MenuItem({
    label: '窗口',
    role: 'window',
    submenu: [
      {
        label: '置顶',
        accelerator: 'CmdOrCtrl+T',
        click: (menuItem, browserWindow) => {
          browserWindow.setAlwaysOnTop(!browserWindow.isAlwaysOnTop())
        }
      },
      {
        label: '全屏',
        accelerator: 'F11',
        click: (menuItem, browserWindow) => {
          if (!UserConfigs.window.isKioskModeOn) {
            browserWindow.setFullScreen(!browserWindow.isFullScreen())
          } else {
            browserWindow.setKiosk(!browserWindow.isKiosk())
          }
        }
      },
      {
        label: '全屏',
        accelerator: 'F5',
        enabled: true,
        visible: false,
        click: (menuItem, browserWindow) => {
          if (!UserConfigs.window.isKioskModeOn) {
            browserWindow.setFullScreen(!browserWindow.isFullScreen())
          } else {
            browserWindow.setKiosk(!browserWindow.isKiosk())
          }
        }
      },
      {
        label: '退出全屏',
        accelerator: 'Esc',
        click: (menuItem, browserWindow) => {
          if (browserWindow.isFullScreen()) {
            browserWindow.setFullScreen(false)
            return
          }
          if (browserWindow.isKiosk()) {
            browserWindow.setKiosk(false)
          }
        }
      }
    ]
  })
)

GameWindowMenu.append(
  new MenuItem({
    label: '编辑',
    role: 'editMenu'
  })
)

GameWindowMenu.append(
  new MenuItem({
    label: '更多',
    submenu: [
      {
        label: '开发者工具',
        accelerator: 'CmdOrCtrl+I',
        click: (menuItem, browserWindow) => {
          browserWindow.webContents.openDevTools({ mode: 'detach' })
          browserWindow.webContents.send('open-devtools')
        }
      }
    ]
  })
)
