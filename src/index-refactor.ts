import { app, BrowserWindow, globalShortcut, ipcMain, Menu } from 'electron'
import * as os from 'os'
import * as path from 'path'
import { UserConfigs } from './config'
import { appDataDir, InitGlobal } from './global'
import { MajsoulPlus } from './majsoul_plus'
import { GameWindow } from './windows/game'
import { initManagerWindow, ManagerWindow } from './windows/manager'
import { ToolManager, initToolManager } from './windows/tool'

// 初始化全局变量
// Initialize Global variables
InitGlobal()

// TODO: 将这一步移至启动游戏后
// LoadExtension()

// in-process GPU
// 禁用/启用进程内 GPU 处理
if (UserConfigs.chromium.isInProcessGpuOn) {
  const osplatform = os.platform()
  switch (osplatform) {
    case 'darwin':
    case 'win32':
      app.commandLine.appendSwitch('in-process-gpu')
      break
    case 'aix':
    case 'android':
    case 'cygwin':
    case 'freebsd':
    case 'openbsd':
    case 'sunos':
    default:
      break
  }
}

// Ignore GPU Blacklist
// 忽略 GPU 黑名单
if (UserConfigs.chromium.isIgnoreGpuBlacklist) {
  app.commandLine.appendArgument('ignore-gpu-blacklist')
}

// Disable Hardware Acceleration
if (UserConfigs.chromium.isHardwareAccelerationDisable) {
  app.disableHardwareAcceleration()
}

// Disable certificate validation TLS connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// ignore certificate error
// 忽略证书错误
// app.commandLine.appendSwitch('ignore-certificate-errors')

// 允许自动播放音视频
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Exit when all the windows are closed
// 当全部窗口退出后，结束进程
app.on('window-all-closed', () => {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  // if (process.platform !== 'darwin') {
  app.quit()
  // }
})

// 阻止证书验证
app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    if (
      certificate.fingerprint ===
      // 祖传本地证书
      'sha256/UMNIGcBbbIcru/0L2e1idl+aQS7PUHqsZDcrETqdMsc='
    ) {
      event.preventDefault()
      callback(true)
    } else {
      callback(false)
    }
  }
)

app.on('ready', info => {
  // console.log(info);

  // remove application menu
  Menu.setApplicationMenu(null)

  // add boss key
  const windowsStatus = {
    bosskeyActive: false,
    game: {
      visible: false,
      muted: false
    },
    manager: {
      visible: false,
      muted: false
    }
  }
  globalShortcut.register('Alt+X', () => {
    windowsStatus.bosskeyActive = !windowsStatus.bosskeyActive
    if (windowsStatus.bosskeyActive) {
      const hideAll = (
        window: BrowserWindow,
        option: {
          visible: boolean
          muted: boolean
        }
      ) => {
        if (window) {
          option.visible = window.isVisible()
          option.muted = ManagerWindow.webContents.isAudioMuted()
          window.webContents.on('crashed', e => {
            app.relaunch()
            app.quit()
          })

          window.hide()
          window.webContents.setAudioMuted(true)
        }
      }

      // backup window information & hide window
      hideAll(ManagerWindow, windowsStatus.manager)
      hideAll(GameWindow, windowsStatus.game)
    } else {
      const showAll = (
        window: BrowserWindow,
        option: { visible: boolean; muted: boolean }
      ) => {
        if (window) {
          if (option.visible) {
            window.show()
          }
          window.webContents.setAudioMuted(option.muted)
        }
      }

      // reopen windows
      showAll(ManagerWindow, windowsStatus.manager)
      showAll(GameWindow, windowsStatus.game)
    }
  })

  // ipc listeners
  ipcMain.on('application-message', (event: Electron.Event, ...args) => {
    if (args && args.length > 0) {
      switch (args[0]) {
        case 'start-tool':
          ToolManager.start((args[1] as MajsoulPlus.ToolConfig).id)
          break
        case 'close-ready': {
          console.log('Manager ready to be closed.')
          ManagerWindow.close()
          break
        }
        default:
          break
      }
    }
  })

  // sandbox
  ipcMain.on('sandbox-dirname-request', (event: Electron.Event) => {
    event.returnValue = path.resolve(__dirname, '..')
  })
  ipcMain.on('sandbox-appdata-request', (event: Electron.Event) => {
    event.returnValue = appDataDir
  })

  // initialize manager window
  // 初始化扩展资源管理器窗口
  initManagerWindow()
  initToolManager()
})

// uncaught exception
process.on('uncaughtException', err => {
  console.error(err)
})
