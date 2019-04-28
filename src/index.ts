import {
  app as electronApp,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  MenuItem,
  nativeImage
} from 'electron'
import * as express from 'express'
import * as fs from 'fs'
import * as https from 'https'
import * as os from 'os'
import * as path from 'path'
import { Configs } from './config'
import { Util } from './utils'

const server = express()

// const i18n = require('./i18nInstance')
import { AddressInfo } from 'net'
import { I18n } from './i18n'
const i18n = new I18n({
  autoReload: process.env.NODE_ENV === 'development',
  actives: [electronApp.getLocale()]
})

// 尝试读取用户设置项 configs-user.json
let userConfigs
try {
  userConfigs = JSON.parse(
    fs.readFileSync(Configs.USER_CONFIG_PATH, { encoding: 'utf-8' })
  )
} catch (error) {
  userConfigs = {}
}

// 同步 configs-user.json，如果当前存储的结构较旧则会被更新
function jsonKeyUpdate(ja, jb) {
  Object.keys(ja).forEach(key => {
    if (typeof ja[key] === 'object' && typeof jb[key] === 'object') {
      jsonKeyUpdate(ja[key], jb[key])
    }
    if (jb[key] === undefined) {
      delete ja[key]
    }
  })
  Object.keys(jb).forEach(key => {
    if (ja[key] === undefined) {
      ja[key] = jb[key]
    }
  })
}
jsonKeyUpdate(userConfigs, require(path.join(__dirname, 'configs-user.json')))
// 写入 configs-user.json
fs.writeFileSync(Configs.USER_CONFIG_PATH, JSON.stringify(userConfigs))

// 获取用户数据 %appdata% 路径
const userDataDir = electronApp.getPath('userData')
// 获取 Configs 记录的扩展资源路径
const paths = [Configs.EXECUTES_DIR, Configs.MODS_DIR, Configs.TOOLS_DIR]
paths
  .map(dir => path.join(userDataDir, dir))
  .forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir))

// 启用或禁用 in-process-gpu
if (userConfigs.chromium.isInProcessGpuOn) {
  const osplatform = os.platform()
  switch (osplatform) {
    case 'darwin':
    case 'win32':
      electronApp.commandLine.appendSwitch('in-process-gpu')
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
if (userConfigs.chromium.isIgnoreGpuBlacklist) {
  electronApp.commandLine.appendSwitch('ignore-gpu-blacklist')
}

// 创建一个 https 服务器
const sererHttps = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
  },
  server
)

// 禁用 / 启用 硬件加速
if (
  (() => {
    try {
      if (userConfigs.chromium['isHardwareAccelerationDisable'] === true) {
        return true
      }
    } catch (err) {
      return false
    }
    return false
  })()
) {
  electronApp.disableHardwareAcceleration()
}

// 阻止启动多个雀魂 Plus 实例（已废弃）
// if (!electronApp.requestSingleInstanceLock()) {
//   console.error('Failed to make Majsoul Plus a single instance!');
// }

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// 声明 express 路由，需要改写路由函数以适配国际服
server.get('*', Util.processRequest)

// 允许媒体资源的自动播放
electronApp.commandLine.appendSwitch(
  'autoplay-policy',
  'no-user-gesture-required'
)

// 当所有窗口被关闭了，退出。
electronApp.on('window-all-closed', () => {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  // if (process.platform !== 'darwin') {
  electronApp.quit()
  // }
})

// 阻止证书验证
electronApp.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    if (
      certificate.fingerprint ===
      // 祖传证书
      'sha256/UMNIGcBbbIcru/0L2e1idl+aQS7PUHqsZDcrETqdMsc='
    ) {
      event.preventDefault()
      callback(true) // eslint-disable-line standard/no-callback-literal
    } else {
      callback(false)
    }
  }
)

// 监听 GPU 进程崩溃事件
electronApp.on('gpu-process-crashed', (event, killed) => {
  console.error(`gpu-process-crashed: ${killed}`)
})

// 为程序设置一个菜单
const gameWindowMenu: Menu = new Menu()
gameWindowMenu.append(
  new MenuItem({
    label: '游戏',
    role: 'services',
    submenu: [
      {
        label: '截图',
        accelerator: 'F12',
        click: (menuItem, browserWindow) => {
          Util.takeScreenshot(browserWindow.webContents)
        }
      },
      {
        label: '截图',
        accelerator: 'CmdOrCtrl+P',
        enabled: true,
        visible: false,
        click: (menuItem, browserWindow) => {
          Util.takeScreenshot(browserWindow.webContents)
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
gameWindowMenu.append(
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
          if (!userConfigs.window.isKioskModeOn) {
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
          if (!userConfigs.window.isKioskModeOn) {
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
gameWindowMenu.append(
  // TODO: 该菜单需要 i18n 支持，即需要手动设置菜单所有项目
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

const windowControl = {
  windowMap: { toolsMap: {} },
  // 获取窗口标题，有 0.5% 概率显示为喵喵喵
  // TODO: 此处 i18n 适配有问题
  _getGameWindowTitle: () => {
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
    // FIXME: remove type assertion
    return titles[index as number].text
  },

  // 读取插件文件夹并返回一个数组
  // 注意：这个函数同样也会从模组中加载插件
  _getExecuteScripts: () => {
    let executeScripts
    try {
      const data = fs.readFileSync(Configs.EXECUTES_CONFIG_PATH)
      executeScripts = JSON.parse(data.toString('utf-8'))
    } catch (error) {
      console.error(error)
      executeScripts = []
    }
    try {
      const data = fs.readFileSync(Configs.MODS_CONFIG_PATH)
      const mods = JSON.parse(data.toString('utf-8'))
      mods.forEach(mod => {
        if (mod.execute) {
          mod.execute.filesDir = mod.filesDir
          executeScripts.push(mod.execute)
        }
      })
    } catch (error) {
      console.error(error)
    }
    return executeScripts
  },

  // Electron app ready 事件
  // 手柄：个人觉得没必要每个事件都抽象化成函数，太绕了……
  electronReady: () => {
    return new Promise(resolve => electronApp.once('ready', resolve))
  },

  // 初始化本地镜像服务器，当端口被占用时会随机占用另一个端口
  initLocalMirrorServer: (serverHttps: https.Server, port: number) => {
    return new Promise(resolve => {
      serverHttps.listen(port)
      serverHttps.on('listening', resolve)
      serverHttps.on('error', err => {
        // 如果端口被占用
        if (err.code === 'EADDRINUSE') {
          console.warn(i18n.text.main.portInUse())
          serverHttps.close()
          // 随机监听一个空闲端口
          serverHttps.listen(0)
        }
      })
    })
  },

  // 初始化扩展资源管理器窗口
  initManagerWindow: managerWindowConfig => {
    const config = {
      ...managerWindowConfig
    }
    // hack macOS config
    // macOS 专有设置，设置背景为透明色
    if (process.platform === 'darwin') {
      config.frame = false
      config.titleBarStyle = 'hidden'
      if (Number(process.versions.electron.split('.')[0]) > 2) {
        config.vibrancy = 'light'
        config.backgroundColor = 'rgba(0,0,0,0)'
      }
    }

    // 计算资源管理器缩放宽高
    config.width *= userConfigs.window.zoomFactor
    config.height *= userConfigs.window.zoomFactor

    const managerWindow = new BrowserWindow(config)

    managerWindow.once('ready-to-show', () => {
      // 根据资源管理器设置的缩放宽高进行缩放操作
      managerWindow.webContents.setZoomFactor(userConfigs.window.zoomFactor)
      managerWindow.show()
    })

    // 锁定资源管理器窗口标题
    managerWindow.on('page-title-updated', evt => evt.preventDefault())
    managerWindow.once('close', evt => {
      evt.preventDefault()
      // 隐藏窗口，发送消息提示储存设置，待返回消息后再真正关闭窗口
      managerWindow.hide()
      evt.sender.send('saveConfig')
    })
    // 载入本地页面，对于 Linux 系统 file：// 不能省略
    managerWindow.loadURL(
      'file://' + path.join(__dirname, 'manager/index.html')
    )

    // Add environment config to open developer tools
    // 在 debug 环境下启动会打开开发者工具
    if (process.env.NODE_ENV === 'development') {
      managerWindow.webContents.openDevTools({ mode: 'detach' })
    }

    // 链接至统一的 windowMap 进行管理
    // 手柄：明明是 Object 不是 Map
    windowControl.windowMap['manager'] = managerWindow
  },

  // 初始化游戏窗口
  // TODO: 为游戏窗口设置类似资源管理器的模态标题栏
  initGameWindow: gameWindowConfig => {
    const config = {
      ...gameWindowConfig,
      title: windowControl._getGameWindowTitle(),
      frame: !userConfigs.window.isNoBorder
    }
    // TODO: wait new setting system
    // TODO: 等待新设置系统 UI 设计和功能实现
    if (userConfigs['window']['gameWindowSize'] !== '') {
      const windowSize: number[] = userConfigs['window']['gameWindowSize']
        .split(',')
        .map((value: string) => Number(value))
      config.width = windowSize[0]
      config.height = windowSize[1]
    }
    const gameWindow = new BrowserWindow(config)
    // 阻止标题更改
    gameWindow.on('page-title-updated', event => event.preventDefault())
    // 监听尺寸更改事件，用于正确得到截图所需要的窗口尺寸
    gameWindow.on('resize', () => {
      userConfigs['window']['gameWindowSize'] = gameWindow.getSize().toString()
      const obj = {
        mainKey: 'window',
        key: 'gameWindowSize',
        value: userConfigs['window']['gameWindowSize']
      }
      windowControl.windowMap['manager'].send(
        'changeConfig',
        JSON.stringify(obj)
      )
      // 将窗口尺寸信息发送给渲染进程用于截图
      gameWindow.webContents.send('window-resize', gameWindow.getBounds())
    })
    // 监听移动事件，用途同上
    gameWindow.on('move', () => {
      gameWindow.webContents.send('window-resize', gameWindow.getBounds())
    })
    gameWindow.on('moved', () => {
      gameWindow.webContents.send('window-resize', gameWindow.getBounds())
    })
    // 监听关闭事件
    gameWindow.on('closed', () => {
      // 关闭后台音频播放器
      Util.shutoffPlayer()
      // 关闭本地镜像服务器
      sererHttps.close()
      // 依据用户设置显示被隐藏的管理器窗口
      if (userConfigs.window.isManagerHide) {
        const managerWindow = windowControl.windowMap['manager']
        if (managerWindow) {
          managerWindow.show()
        }
      }
    })
    // 初始化后台音频播放器，目前仅用于播放截图音效
    Util.initPlayer()
    // 如果重复启动游戏，则重新加载模组
    Util.loadMods()
    // 监听到崩溃事件，输出 console
    gameWindow.webContents.on('crashed', () =>
      console.warn(i18n.text.main.webContentsCrashed())
    )
    gameWindow.once('ready-to-show', () => {
      // 设置页面缩放比例为 1 来防止缩放比例异常
      // 但这样会造成截图提示悬浮窗尺寸不合适
      gameWindow.webContents.setZoomFactor(1)
      gameWindow.show()
      // 窗口展示后，通知渲染窗口实际尺寸以便截图
      gameWindow.webContents.send('window-resize', gameWindow.getBounds())
    })
    // 监听 console 信息并转发至主进程
    gameWindow.webContents.on('console-message', (
      evt,
      level,
      msg /*, line, sourceId  */
    ) => {
      // 1 == log
      if (level !== 'log') {
        console.warn(`${i18n.text.main.consoleMessage()}: ${msg}`)
      }
    })
    // 载入本地启动器
    gameWindow.loadURL('file://' + path.join(__dirname, 'bin/main/index.html'))

    // Add environment config to open developer tools
    // 在 debug 启动环境下打开开发者工具
    if (process.env.NODE_ENV === 'development') {
      gameWindow.webContents.openDevTools({ mode: 'detach' })
    }

    // 应用菜单
    Menu.setApplicationMenu(gameWindowMenu)

    // 链接至统一的 windowMap 进行管理
    windowControl.windowMap['game'] = gameWindow
  },

  // 关闭资源管理器窗口
  closeManagerWindow: () => {
    const managerWindow = windowControl.windowMap['manager']
    if (managerWindow) {
      managerWindow.close()
    }
  },

  // 隐藏资源管理器窗口
  hideManagerWindow: () => {
    const managerWindow: Electron.BrowserWindow =
      windowControl.windowMap['manager']
    if (managerWindow) {
      managerWindow.hide()
    }
  },

  // 添加监听器
  addAppListener: () => {
    // 资源管理器消息
    // 手柄：'application-message' 命名绝对错了
    ipcMain.on('application-message', (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          // 资源管理器通知启动游戏
          case 'start-game': {
            windowControl
              .initLocalMirrorServer(sererHttps, Configs.SERVER_PORT)
              .then(() => {
                windowControl.initGameWindow(Configs.GAME_WINDOW_CONFIG)
                if (userConfigs.window.isManagerHide) {
                  windowControl.hideManagerWindow()
                } else {
                  windowControl.closeManagerWindow()
                }
              })
            break
          }
          // 启动指定工具
          case 'start-tool': {
            // 工具信息
            const toolInfo = args[1]
            if (!toolInfo.windowOptions) {
              toolInfo.windowOption = {}
            }
            const toolConfig = {
              ...Configs.TOOL_WINDOW_CONFIG,
              ...toolInfo.windowOptions
            }
            const indexPage = toolInfo.index ? toolInfo.index : 'index.html'
            toolConfig.parent = windowControl.windowMap['manager']

            const toolWindow = new BrowserWindow(toolConfig)

            windowControl.windowMap.toolsMap[toolInfo.filesDir] = toolWindow

            if (process.env.NODE_ENV === 'development') {
              toolWindow.webContents.openDevTools({
                mode: 'detach'
              })
            }

            toolWindow.loadURL(
              'file://' + path.join(toolInfo.filesDir, indexPage)
            )
            break
          }
          // 通知更新用户设置，目前仅用于更改缩放比例
          case 'update-user-config': {
            userConfigs = JSON.parse(
              fs.readFileSync(Configs.USER_CONFIG_PATH, { encoding: 'utf-8' })
            )
            windowControl.windowMap['manager'].setContentSize(
              Configs.MANAGER_WINDOW_CONFIG.width *
                userConfigs.window.zoomFactor,
              Configs.MANAGER_WINDOW_CONFIG.height *
                userConfigs.window.zoomFactor
            )
            windowControl.windowMap['manager'].webContents.setZoomFactor(
              userConfigs.window.zoomFactor
            )
            break
          }
          // 通知进行截图
          case 'take-screenshot': {
            // 接收到的截图 Buffer
            const buffer: Buffer = args[1]
            // 由主进程进行保存
            const filePath = path.join(
              electronApp.getPath('pictures'),
              electronApp.getName(),
              Date.now() + '.png'
            )
            // 写入文件
            Util.writeFile(filePath, buffer).then(() => {
              // 通知渲染进程（游戏宿主窗口）截图已保存，并由渲染进程弹窗
              windowControl.windowMap['game'].webContents.send(
                'screenshot-saved',
                filePath
              )
            })
            // 写入图像到剪切板
            clipboard.writeImage(nativeImage.createFromBuffer(buffer))
            break
          }
          // 通知已保存完毕，可以关闭资源管理器
          case 'close-ready': {
            console.log('Manager ready to be closed.')
            windowControl.windowMap['manager'].close()
            break
          }
          // 未知或错误的指令
          default:
            console.warn('Received unknown command.' + args[0])
            break
        }
      }
    })
    // 游戏宿主窗口消息
    ipcMain.on('main-loader-message', (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          // 游戏宿主窗口已创建并初始化完毕，需要加载端口信息
          case 'main-loader-ready': {
            windowControl.windowMap['game'].webContents.send(
              'server-port-load',
              (sererHttps.address() as AddressInfo).port
            )
            break
          }
          // 游戏宿主窗口已获知本地服务器端口，需要加载脚本（插件）资源以注入
          case 'server-port-loaded': {
            const executeScripts = windowControl._getExecuteScripts()
            windowControl.windowMap['game'].webContents.send(
              'executes-load',
              executeScripts
            )
            break
          }
          // 游戏宿主窗口已获知插件资源，需要主进程提供 URL 以载入
          case 'executes-loaded': {
            const clipboardText = clipboard.readText()
            if (
              clipboardText &&
              // 如果剪切板内容包含 configs 设置的服务器 URL，则加载
              // TODO: 这里需要适配多服务器
              clipboardText.includes(Configs.REMOTE_DOMAIN)
            ) {
              // FIXME: remove type assertion
              windowControl.windowMap['game'].webContents.send(
                'load-url',
                (new RegExp(
                  Configs.REMOTE_DOMAIN.replace(/\./g, '\\.') +
                    '[-A-Za-z0-9+&@#/%?=~_|!:,.;]*'
                ).exec(clipboardText) as string[])[0]
              )
            } else if (
              clipboardText &&
              // 如果剪切板内容包含 configs 设置的服务器 URL，则加载
              // TODO: 这里需要适配多服务器
              // HTTP_REMOTE_DOMAIN 似乎已经被废弃
              clipboardText.includes(Configs.HTTP_REMOTE_DOMAIN)
            ) {
              windowControl.windowMap['game'].webContents.send(
                'load-url',
                (new RegExp(
                  Configs.HTTP_REMOTE_DOMAIN.replace(/\./g, '\\.') +
                    '[-A-Za-z0-9+&@#/%?=~_|!:,.;]*'
                ).exec(clipboardText) as string[])[0]
              )
            } else {
              // 加载本地服务器地址
              // TODO: 这里需要适配多服务器
              // FIXME: 这里硬编码了 /0/ ，与国际服不兼容
              windowControl.windowMap['game'].webContents.send(
                'load-url',
                `https://localhost:${
                  (sererHttps.address() as AddressInfo).port
                }/0/`
              )
            }
            break
          }
          // 打开文件弹窗
          case 'open-file-dialog': {
            dialog.showOpenDialog(
              {
                properties: ['openFile', 'openDirectory']
              },
              files => {
                if (files) {
                  // 送回所选择的问价内容
                  evt.sender.send('selected-directory', files)
                }
              }
            )
            break
          }
          default:
            break
        }
      }
    })
  },

  // 声明 Accelerator
  addAccelerator() {
    // 老板键
    // TODO: 此处的 静音 对以下几个窗口无效
    //        1. 游戏宿主窗口内的游戏窗口 (webview)
    //        2. 音频播放器后台窗口
    const addBossKey = () => {
      const windowsStatus = {
        gameWindowVisible: false,
        gameWindowMuted: false,
        managerWindowVisible: false,
        managerWindowMuted: false,
        bosskeyActive: false
      }
      globalShortcut.register('Alt+X', () => {
        const gameWindow: Electron.BrowserWindow =
          windowControl.windowMap['game']
        const managerWindow: Electron.BrowserWindow =
          windowControl.windowMap['manager']

        if (windowsStatus.bosskeyActive) {
          // 如果老板键已经被按下
          windowsStatus.bosskeyActive = false

          if (managerWindow) {
            if (windowsStatus.managerWindowVisible) {
              managerWindow.show()
            }
            managerWindow.webContents.setAudioMuted(
              windowsStatus.managerWindowMuted
            )
          }
          if (gameWindow) {
            if (windowsStatus.gameWindowVisible) {
              gameWindow.show()
            }
            gameWindow.webContents.setAudioMuted(windowsStatus.gameWindowMuted)
          }
        } else {
          // 备份窗口信息并隐藏窗口
          windowsStatus.bosskeyActive = true

          if (managerWindow) {
            windowsStatus.managerWindowVisible = managerWindow.isVisible()
            windowsStatus.managerWindowMuted = managerWindow.webContents.isAudioMuted()
            managerWindow.webContents.on('crashed', e => {
              electronApp.relaunch()
              electronApp.quit()
            })

            managerWindow.hide()
            managerWindow.webContents.setAudioMuted(true)
          }
          if (gameWindow) {
            windowsStatus.gameWindowVisible = gameWindow.isVisible()
            windowsStatus.gameWindowMuted = gameWindow.webContents.isAudioMuted()
            gameWindow.webContents.on('crashed', e => {
              electronApp.relaunch()
              electronApp.quit()
            })

            gameWindow.hide()
            gameWindow.webContents.setAudioMuted(true)
          }
        }
      })
    }
    addBossKey()
  },

  // 启动雀魂 Plus 程序
  start: () => {
    windowControl.electronReady().then(() => {
      // 清空菜单
      Menu.setApplicationMenu(null)
      // 注册 Accelerator
      windowControl.addAccelerator()
      // 注册监听器
      windowControl.addAppListener()
      // 初始化扩展资源管理器
      windowControl.initManagerWindow({ ...Configs.MANAGER_WINDOW_CONFIG })
    })
  }
}
// 立即启动程序
windowControl.start()

// 未捕获的异常
process.on('uncaughtException', err => {
  console.error(err)
})
