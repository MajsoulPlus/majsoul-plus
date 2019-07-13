import { app, ipcMain, Menu } from 'electron'
import * as os from 'os'
import * as path from 'path'
import { UserConfigs } from './config'
import { LoadExtension } from './extension/extension'
import { appDataDir, Global, InitGlobal } from './global'
import { LoadResourcePack } from './resourcepack/resourcepack'
import { httpsServer, LoadServer, httpServer } from './server'
import bossKey from './utilities/bossKey'
import screenshot from './utilities/screenshot'
import { initGameWindow } from './windows/game'
import { initManagerWindow, ManagerWindow } from './windows/manager'
import { initToolManager } from './windows/tool'

// 初始化全局变量
InitGlobal()

// 加载资源包
LoadResourcePack()

// TODO: 将这一步移至启动游戏后
LoadExtension()

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

// 忽略 GPU 黑名单
if (UserConfigs.chromium.isIgnoreGpuBlacklist) {
  app.commandLine.appendArgument('ignore-gpu-blacklist')
}

// 禁用 / 启用 硬件加速
if (UserConfigs.chromium.isHardwareAccelerationDisable) {
  app.disableHardwareAcceleration()
}

// Disable certificate validation TLS connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// 忽略证书错误
// app.commandLine.appendSwitch('ignore-certificate-errors')

// 允许自动播放音视频
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Exit when all the windows are closed
// 当全部窗口退出后，结束进程
app.on('window-all-closed', () => {
  app.quit()
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

app.on('ready', () => {
  // 清空菜单
  Menu.setApplicationMenu(null)

  // 注册老板键
  bossKey.register()

  // 资源管理器通知启动游戏
  ipcMain.on('start-game', () => {
    // 初始化本地镜像服务器，当端口被占用时会随机占用另一个端口
    LoadServer()
    if (UserConfigs.userData.useHttpServer) {
      httpServer.listen(Global.ServerPort)
      httpServer.on('error', err => {
        if (err.name === 'EADDRINUSE') {
          // console.warn(i18n.text.main.portInUse())
          httpServer.close()
          // 随机监听一个空闲端口
          httpServer.listen(0)
        }
      })
    } else {
      httpsServer.listen(Global.ServerPort)
      httpsServer.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          // console.warn(i18n.text.main.portInUse())
          httpsServer.close()
          // 随机监听一个空闲端口
          httpsServer.listen(0)
        }
      })
    }

    initGameWindow()

    if (UserConfigs.window.isManagerHide) {
      ManagerWindow.hide()
    } else {
      ManagerWindow.close()
    }
  })

  // 截图
  screenshot.register()

  // sandbox
  ipcMain.on('sandbox-dirname-request', (event: Electron.Event) => {
    event.returnValue = path.resolve(__dirname, '..')
  })
  ipcMain.on('sandbox-appdata-request', (event: Electron.Event) => {
    event.returnValue = appDataDir
  })

  // 初始化扩展资源管理器窗口
  initManagerWindow()
  initToolManager()
})

// 监听 GPU 进程崩溃事件
app.on('gpu-process-crashed', (event, killed) => {
  console.error(`gpu-process-crashed: ${killed}`)
})

// uncaught exception
process.on('uncaughtException', err => {
  console.error(err)
})
