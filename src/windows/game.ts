import { BrowserWindow, Menu, MenuItem } from 'electron'
import { Configs } from '../config'
import { takeScreenshot } from '../utils-refactor'
import { UserConfigs } from '../config-refactor'

// tslint:disable-next-line
export let GameWindow: BrowserWindow;

export function initGameWindow() {
  GameWindow = new BrowserWindow(Configs.GAME_WINDOW_CONFIG)
}

// tslint:disable-next-line
export const GameWindowMenu: Menu = new Menu();

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
