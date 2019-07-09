import {
  app as electronApp,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu
} from 'electron'
import * as express from 'express'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'
import { Util } from './utils'

const server = express()

// const i18n = require('./i18nInstance')
import { AddressInfo } from 'net'
import { I18n } from './i18n'
import { Global, GlobalPath } from './global'
const i18n = new I18n({
  autoReload: process.env.NODE_ENV === 'development',
  actives: [electronApp.getLocale()]
})

// 尝试读取用户设置项 configs-user.json
let userConfigs
try {
  userConfigs = JSON.parse(
    fs.readFileSync(Global.UserConfigPath, { encoding: 'utf-8' })
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
fs.writeFileSync(Global.UserConfigPath, JSON.stringify(userConfigs))

// 获取用户数据 %appdata% 路径
const userDataDir = electronApp.getPath('userData')
// 获取 Configs 记录的扩展资源路径
const paths = [GlobalPath.ExecutesDir, GlobalPath.ToolsDir]
paths
  .map(dir => path.join(userDataDir, dir))
  .forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir))

// 创建一个 https 服务器
const sererHttps = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'certificate/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificate/cert.crt'))
  },
  server
)

const windowControl = {
  windowMap: { toolsMap: {} },

  // 读取插件文件夹并返回一个数组
  // 注意：这个函数同样也会从模组中加载插件
  _getExecuteScripts: () => {
    let executeScripts
    try {
      const data = fs.readFileSync(Global.ExecutesConfigPath)
      executeScripts = JSON.parse(data.toString('utf-8'))
    } catch (error) {
      console.error(error)
      executeScripts = []
    }
    try {
      // const data = fs.readFileSync(Global.ModsConfigPath)
      // const mods = JSON.parse(data.toString('utf-8'))
      // mods.forEach(mod => {
      //   if (mod.execute) {
      //     mod.execute.filesDir = mod.filesDir
      //     executeScripts.push(mod.execute)
      //   }
      // })
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

  // 添加监听器
  addAppListener: () => {
    // 资源管理器消息
    // 手柄：'application-message' 命名绝对错了
    ipcMain.on('application-message', (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          // 通知更新用户设置，目前仅用于更改缩放比例
          case 'update-user-config': {
            userConfigs = JSON.parse(
              fs.readFileSync(Global.UserConfigPath, { encoding: 'utf-8' })
            )
            windowControl.windowMap['manager'].setContentSize(
              Global.ManagerWindowConfig.width * userConfigs.window.zoomFactor,
              Global.ManagerWindowConfig.height * userConfigs.window.zoomFactor
            )
            windowControl.windowMap['manager'].webContents.setZoomFactor(
              userConfigs.window.zoomFactor
            )
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
              clipboardText.includes(Global.RemoteDomain)
            ) {
              // FIXME: remove type assertion
              windowControl.windowMap['game'].webContents.send(
                'load-url',
                (new RegExp(
                  Global.RemoteDomain.replace(/\./g, '\\.') +
                    '[-A-Za-z0-9+&@#/%?=~_|!:,.;]*'
                ).exec(clipboardText) as string[])[0]
              )
            } else if (
              clipboardText &&
              // 如果剪切板内容包含 configs 设置的服务器 URL，则加载
              // TODO: 这里需要适配多服务器
              // HTTP_REMOTE_DOMAIN 似乎已经被废弃
              clipboardText.includes(Global.HttpRemoteDomain)
            ) {
              windowControl.windowMap['game'].webContents.send(
                'load-url',
                (new RegExp(
                  Global.HttpRemoteDomain.replace(/\./g, '\\.') +
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

  // 启动雀魂 Plus 程序
  start: () => {
    windowControl.electronReady().then(() => {
      windowControl.addAppListener()
    })
  }
}
// 立即启动程序
windowControl.start()
