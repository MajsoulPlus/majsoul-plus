import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
  Menu,
  MenuItem,
  WebContents
} from 'electron'
import { AddressInfo } from 'net'
import * as path from 'path'
import { UserConfigs } from '../config'
import { Global } from '../global'
import i18n from '../i18n'
import { MajsoulPlus } from '../majsoul_plus'
import { httpServer, httpsServer } from '../server'
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

  // TODO: 等待新设置系统 UI 设计和功能实现
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

  // 监听 console 信息并转发至主进程
  GameWindow.webContents.on('console-message', (_, level, msg) => {
    switch (level) {
      case 'warn':
        console.warn(msg)
        break
      case 'error':
        console.error(msg)
        break
      case 'log':
        console.log(msg)
        break
      default:
    }
  })

  // 监听到崩溃事件，输出 console
  GameWindow.webContents.on('crashed', () =>
    console.warn(i18n.text.main.webContentsCrashed())
  )

  // 监听尺寸更改事件，用于正确得到截图所需要的窗口尺寸
  GameWindow.on('resize', () => {
    UserConfigs.window.gameWindowSize = GameWindow.getSize().toString()
    const newConfig = {
      mainKey: 'window',
      key: 'gameWindowSize',
      value: UserConfigs.window.gameWindowSize
    }
    ManagerWindow.webContents.send('change-config', newConfig)
    // 将窗口尺寸信息发送给渲染进程用于截图
    GameWindow.webContents.send('window-resize', GameWindow.getBounds())
  })
  // 监听移动事件，用途同上
  GameWindow.on('move', () => {
    GameWindow.webContents.send('window-resize', GameWindow.getBounds())
  })
  GameWindow.on('moved', () => {
    GameWindow.webContents.send('window-resize', GameWindow.getBounds())
  })

  GameWindow.on('closed', () => {
    // 关闭后台音频播放器
    shutoffPlayer()
    // 关闭本地镜像服务器
    UserConfigs.userData.useHttpServer
      ? httpServer.close()
      : httpsServer.close()
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
      (UserConfigs.userData.useHttpServer
        ? (httpServer.address() as AddressInfo)
        : (httpsServer.address() as AddressInfo)
      ).port
    )
  })

  ipcMain.on('server-port-loaded', () => {
    GameWindow.webContents.send('executes-load', [])
  })

  ipcMain.on('executes-loaded', () => {
    // 加载本地服务器地址
    // TODO: 这里需要适配多服务器
    // FIXME: 这里硬编码了 /0/ ，与国际服不兼容
    const url = `http${
      UserConfigs.userData.useHttpServer ? '' : 's'
    }://localhost:${
      (UserConfigs.userData.useHttpServer
        ? (httpServer.address() as AddressInfo)
        : (httpsServer.address() as AddressInfo)
      ).port
    }/0/`
    console.log(url)
    GameWindow.webContents.send('load-url', url)
  })

  GameWindow.once('ready-to-show', () => {
    // 设置页面缩放比例为 1 来防止缩放比例异常
    // 但这样会造成截图提示悬浮窗尺寸不合适
    GameWindow.webContents.setZoomFactor(1)
    GameWindow.show()
    // 窗口展示后，通知渲染窗口实际尺寸以便截图
    GameWindow.webContents.send('window-resize', GameWindow.getBounds())
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

// 获取窗口标题，有 0.5% 概率显示为喵喵喵
// TODO: 此处 i18n 适配有问题
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

/**
 * 截取屏幕画面
 * @param webContents
 */
export function takeScreenshot(webContents: WebContents) {
  AudioPlayer.webContents.send(
    'audio-play',
    path.join(__dirname, 'bin/audio/screenshot.mp3')
  )
  webContents.send('take-screenshot')
}
