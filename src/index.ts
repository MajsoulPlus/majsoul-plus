import { app, ipcMain, Menu } from 'electron'
import * as os from 'os'
import { UserConfigs } from './config'
import { LoadExtension } from './extension/extension'
import { Global, InitGlobal } from './global'
import { LoadResourcePack } from './resourcepack/resourcepack'
import { httpServer, httpsServer, LoadServer } from './server'
import bossKey from './utilities/bossKey'
import sandbox from './utilities/sandbox'
import screenshot from './utilities/screenshot'
import { initGameWindow } from './windows/game'
import { initManagerWindow, ManagerWindow } from './windows/manager'
import { initToolManager } from './windows/tool'

// 初始化全局变量
InitGlobal()

// 加载资源包
LoadResourcePack()

// 加载扩展
LoadExtension()

// 代理设置
if (UserConfigs.chromium.proxyUrl !== '') {
  app.commandLine.appendSwitch('proxy-server', UserConfigs.chromium.proxyUrl)
}

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

// 当全部窗口退出后，结束进程
app.on('window-all-closed', app.quit)

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

  // 资源管理器通知启动游戏
  ipcMain.on('start-game', () => {
    // 加载服务器路由规则
    LoadServer()

    // 初始化本地镜像服务器，当端口被占用时会随机占用另一个端口
    if (UserConfigs.userData.useHttpServer) {
      httpServer.listen(Global.ServerPort)
      httpServer.on('error', err => {
        // TODO: 验证 http 端口冲突时的提示信息是否是下面的内容
        if (err.name === 'EADDRINUSE') {
          httpServer.close()
          // 随机监听一个空闲端口
          httpServer.listen(0)
        }
      })
    } else {
      httpsServer.listen(Global.ServerPort)
      httpsServer.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          httpsServer.close()
          // 随机监听一个空闲端口
          httpsServer.listen(0)
        }
      })
    }

    // 初始化游戏窗口
    initGameWindow()

    // 根据设置决定销毁 / 隐藏 Manager 窗口
    if (UserConfigs.window.isManagerHide) {
      ManagerWindow.hide()
    } else {
      ManagerWindow.close()
    }
  })

  bossKey.register() // 注册老板键功能
  screenshot.register() // 注册截图功能
  sandbox.register() // 注册工具窗口的沙盒功能

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
