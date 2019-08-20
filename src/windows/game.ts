import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  dialog,
  ipcMain,
  Menu,
  MenuItem,
  screen,
  WebContents
} from 'electron'
import { AddressInfo } from 'net'
import * as path from 'path'
import { SaveConfigJson, UserConfigs } from '../config'
import { Global, Logger, RemoteDomains } from '../global'
import i18n from '../i18n'
import { MajsoulPlus } from '../majsoul_plus'
import {
  httpServer,
  httpsServer,
  LoadServer,
  CloseServer,
  ListenServer
} from '../server'
import { AudioPlayer, initPlayer, shutoffPlayer } from './audioPlayer'
import { ManagerWindow } from './manager'

// tslint:disable-next-line
export let GameWindow: BrowserWindow
// tslint:disable-next-line
export const GameWindowStatus: MajsoulPlus.WindowStatus = {
  visible: false,
  muted: false
}

export function initGameWindow() {
  const config: BrowserWindowConstructorOptions = {
    ...Global.GameWindowConfig,
    title: getGameWindowTitle(),
    frame: !UserConfigs.window.isNoBorder
  }

  if (UserConfigs.window.gameWindowSize !== '') {
    const windowSize: number[] = UserConfigs.window.gameWindowSize
      .split(',')
      .map((value: string) => Number(value))
    config.width = windowSize[0]
    config.height = windowSize[1]
  }

  GameWindow = new BrowserWindow(config)

  // 阻止标题更改
  GameWindow.on('page-title-updated', event => event.preventDefault())

  // 监听到崩溃事件，输出 console
  GameWindow.webContents.on('crashed', () =>
    Logger.warning(i18n.text.main.webContentsCrashed())
  )

  // 监听尺寸更改事件，用于正确得到截图所需要的窗口尺寸
  GameWindow.on('resize', () => {
    UserConfigs.window.gameWindowSize = GameWindow.getSize().toString()
    if (!ManagerWindow.isDestroyed()) {
      ManagerWindow.webContents.send(
        'change-config-game-window-size',
        UserConfigs.window.gameWindowSize
      )
    }
  })

  GameWindow.on('closed', () => {
    // 关闭后台音频播放器
    shutoffPlayer()
    // 关闭本地镜像服务器
    CloseServer()
    // 依据用户设置显示被隐藏的管理器窗口
    if (UserConfigs.window.isManagerHide) {
      if (ManagerWindow) {
        ManagerWindow.show()
      }
    }
  })

  initPlayer()
  Menu.setApplicationMenu(gameWindowMenu)

  ipcMain.on('main-loader-ready', () => {
    // 加载本地服务器地址
    const http = UserConfigs.userData.useHttpServer
    const port = (UserConfigs.userData.useHttpServer
      ? (httpServer.address() as AddressInfo)
      : (httpsServer.address() as AddressInfo)
    ).port
    const url = `http${
      UserConfigs.userData.useHttpServer ? '' : 's'
    }://localhost:${port}/`
    GameWindow.webContents.send('load-url', url, port, http)
  })

  ipcMain.on(
    'save-local-storage',
    (event: Electron.Event, localStorage: string[][]) => {
      UserConfigs.localStorage[
        RemoteDomains[UserConfigs.userData.serverToPlay.toString()].name
      ] = localStorage.filter(arr => arr[1] !== '' && arr[1] !== 'FKU!!!')
      SaveConfigJson(UserConfigs)
      dialog.showMessageBox(GameWindow, {
        type: 'info',
        title: i18n.text.main.programName(),
        // TODO: i18n
        message: '保存帐号信息成功!',
        buttons: ['OK']
      })
    }
  )

  GameWindow.once('ready-to-show', () => {
    // 设置页面缩放比例为 1 来防止缩放比例异常
    // 但这样会造成截图提示悬浮窗尺寸不合适
    GameWindow.webContents.setZoomFactor(1)
    GameWindow.show()
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

const gameWindowMenu = new Menu()

gameWindowMenu.append(
  new MenuItem({
    label: '游戏',
    role: 'services',
    submenu: [
      ...['F12', 'CmdOrCtrl+P'].map((acc, index) => {
        return {
          label: '截图',
          accelerator: acc,
          visible: index === 0,
          click: () => {
            takeScreenshot()
          }
        }
      }),
      {
        label: '写入帐号信息',
        accelerator: 'CmdOrCtrl+Y',
        click: () => {
          GameWindow.webContents.send('get-local-storage')
        }
      },
      {
        label: '退出游戏',
        accelerator: 'Alt+F4',
        click: () => {
          GameWindow.close()
        }
      }
    ]
  })
)

gameWindowMenu.append(
  new MenuItem({
    label: '窗口',
    role: 'window',
    submenu: [
      {
        label: '置顶',
        accelerator: 'CmdOrCtrl+T',
        click: () => {
          GameWindow.setAlwaysOnTop(!GameWindow.isAlwaysOnTop())
        }
      },
      ...['F11', 'F5'].map((acc, index) => {
        return {
          label: '全屏',
          accelerator: acc,
          visible: index === 0,
          click: () => {
            if (!UserConfigs.window.isKioskModeOn) {
              GameWindow.setFullScreen(!GameWindow.isFullScreen())
            } else {
              GameWindow.setKiosk(!GameWindow.isKiosk())
            }
          }
        }
      })
    ]
  })
)

gameWindowMenu.append(
  new MenuItem({
    label: '编辑',
    role: 'editMenu'
  })
)

gameWindowMenu.append(
  new MenuItem({
    label: '更多',
    submenu: [
      {
        label: '重新载入',
        accelerator: 'CmdOrCtrl+R',
        click: (_, browserWindow) => {
          CloseServer()
          ipcMain.emit('refresh-resourcepack', {})
          ipcMain.emit('refresh-extension', {})
          LoadServer()
          ListenServer(Global.ServerPort)
          browserWindow.reload()
        }
      },
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

// 获取窗口标题，有 0.5% 概率显示为喵喵喵
function getGameWindowTitle(): string {
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

  return titles[index].text
}

// 截取屏幕画面
function takeScreenshot() {
  AudioPlayer.webContents.send(
    'audio-play',
    path.join(__dirname, '../bin/audio/screenshot.mp3')
  )

  const rect = GameWindow.getBounds()
  const display = screen.getDisplayMatching({
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.floor(rect.width),
    height: Math.floor(rect.height)
  })
  GameWindow.webContents.send('take-screenshot', display.scaleFactor)
}
