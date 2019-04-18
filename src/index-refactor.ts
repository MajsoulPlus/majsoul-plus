import { app, BrowserWindow, globalShortcut, Menu } from 'electron'
import * as https from 'https'
import * as os from 'os'
import { UserConfigs } from './config-refactor'
import { Server, serverOptions } from './server'
import { GameWindow } from './windows/game'
import { initManagerWindow, ManagerWindow } from './windows/manager'
import { LoadExtension } from './extension/extension'

LoadExtension()
export const httpsServer = https.createServer(serverOptions, Server.callback())

// in-process GPU
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
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Exit when all the windows are closed
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
    event.preventDefault()
    callback(true)
  }
)

app.on('ready', info => {
  // console.log(info);

  // remove application menu
  Menu.setApplicationMenu(null);

  // add boss key
  (() => {
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
            visible: boolean;
            muted: boolean;
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
  })();

  // ipc listeners
  (() => {
    //
  })()

  // initialize manager window
  initManagerWindow()
})

// uncaught exception
process.on('uncaughtException', err => {
  console.error(err)
})
