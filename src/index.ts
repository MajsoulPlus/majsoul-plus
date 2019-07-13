import { clipboard, ipcMain } from 'electron'
import * as https from 'https'

import { AddressInfo } from 'net'
import { Global } from './global'

// 创建一个 https 服务器
const sererHttps = https.createServer()

const windowMap = {}

ipcMain.on('main-loader-message', (evt, ...args) => {
  if (args && args.length > 0) {
    switch (args[0]) {
      // 游戏宿主窗口已获知本地服务器端口，需要加载脚本（插件）资源以注入
      case 'server-port-loaded': {
        const executeScripts = []
        windowMap['game'].webContents.send('executes-load', executeScripts)
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
          windowMap['game'].webContents.send(
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
          windowMap['game'].webContents.send(
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
          windowMap['game'].webContents.send(
            'load-url',
            `https://localhost:${(sererHttps.address() as AddressInfo).port}/0/`
          )
        }
        break
      }
      default:
        break
    }
  }
})
