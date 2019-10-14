import { app, dialog, ipcMain } from 'electron'
import * as os from 'os'
import * as path from 'path'
import { UserConfigs } from './config'
import { LoadExtension } from './extension/extension'
import { Global, InitGlobal, Logger } from './global'
import i18n from './i18n'
import { LoadResourcePack } from './resourcepack/resourcepack'
import { ListenServer, LoadServer } from './server'
import { LoadTool } from './tool/tool'
import bossKey from './utilities/bossKey'
import openFile from './utilities/openFile'
import sandbox from './utilities/sandbox'
import screenshot from './utilities/screenshot'
import { initPlayer, AudioPlayer } from './windows/audioPlayer'
import { GameWindows, initGameWindow } from './windows/game'
import { initManagerWindow, ManagerWindow } from './windows/manager'
import { initToolManager } from './windows/tool'

// 初始化全局变量
InitGlobal()

// 加载资源包
LoadResourcePack()

// 加载扩展
LoadExtension()

// 加载工具
LoadTool()

// 代理设置
if (UserConfigs.chromium.proxyUrl !== '') {
  if (UserConfigs.chromium.proxyUrl !== 'system-proxy') {
    app.commandLine.appendSwitch('proxy-server', UserConfigs.chromium.proxyUrl)
  }
} else {
  app.commandLine.appendArgument('no-proxy-server')
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

if (os.platform() === 'win32') {
  app.commandLine.appendSwitch('disable-direct-composition')
}

// Disable certificate validation TLS connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// 允许不安全的 localhost
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true')

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

app.requestSingleInstanceLock()
app.on('second-instance', (event, argv, directory) => {
  if (ManagerWindow && !ManagerWindow.isDestroyed()) {
    // ManagerWindow Mode
    if (argv.length > 2 + Number(process.env.NODE_ENV === 'development')) {
      const upath = path.resolve(
        process.argv[1 + Number(process.env.NODE_ENV === 'development')]
      )
      openFile.setPath(upath)
      openFile.register()
      ManagerWindow.webContents.send('refresh-all')
    }
  } else {
    // GameWindow Mode
    if (argv.length > 2 + Number(process.env.NODE_ENV === 'development')) {
      dialog.showMessageBox(AudioPlayer, {
        type: 'info',
        title: i18n.text.main.programName(),
        // TODO: i18n
        message: '游戏界面中无法导入雀魂 Plus 拓展!',
        buttons: ['OK']
      })
    }
  }
})

app.on('will-finish-launching', () => {
  // macOS open-file
  app.on('open-file', (event, path) => {
    event.preventDefault()
    openFile.setPath(path)
    openFile.register()
  })
})

app.on('ready', () => {
  // 初始化游戏窗口
  initGameWindow()

  // 资源管理器通知启动游戏
  ipcMain.on('start-game', () => {
    // 加载服务器路由规则
    LoadServer()

    // 启动服务器
    ListenServer(Global.ServerPort)

    if (!process.env.SERVER_ONLY) {
      GameWindows.newWindow()
    } else {
      // 通过 audioPlayer 窗口阻止程序退出
      initPlayer()
    }

    ManagerWindow.close()
  })

  bossKey.register() // 注册老板键功能
  screenshot.register() // 注册截图功能
  sandbox.register() // 注册工具窗口的沙盒功能

  if (process.platform !== 'darwin') {
    openFile.register() // 注册文件打开导入拓展功能
  }

  // 初始化扩展资源管理器窗口
  initManagerWindow()
  initToolManager()
})

// 监听 GPU 进程崩溃事件
app.on('gpu-process-crashed', (event, killed) => {
  Logger.error(`gpu-process-crashed, killed: ${killed}`)
})

// uncaught exception
process.on('uncaughtException', err => {
  Logger.error(`uncaughtException ${err.name}: ${err.message}`)
})
