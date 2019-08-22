import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
  Menu
} from 'electron'
import * as path from 'path'
import { SaveConfigJson, UserConfigs } from '../config'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { removeDirSync, updateObject } from '../utils'

// tslint:disable-next-line
export let ManagerWindow: BrowserWindow
// tslint:disable-next-line
export const ManagerWindowStatus: MajsoulPlus.WindowStatus = {
  visible: false,
  muted: false
}

export function initManagerWindow() {
  // 清空菜单
  Menu.setApplicationMenu(null)

  const config: BrowserWindowConstructorOptions = {
    ...Global.ManagerWindowConfig
  }
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
  config.width *= UserConfigs.window.zoomFactor
  config.height *= UserConfigs.window.zoomFactor

  ManagerWindow = new BrowserWindow(config)

  ManagerWindow.once('ready-to-show', () => {
    // 根据资源管理器设置的缩放宽高进行缩放操作
    ManagerWindow.webContents.setZoomFactor(UserConfigs.window.zoomFactor)
    ManagerWindow.show()
  })

  // 阻止页面 title 更改
  ManagerWindow.on('page-title-updated', event => event.preventDefault())

  // 隐藏窗口，发送消息提示储存设置，待返回消息后再真正关闭窗口
  ManagerWindow.once('close', event => {
    event.preventDefault()
    ManagerWindow.hide()
    ManagerWindow.webContents.send('save-config')
  })

  ipcMain.on('close-manager', () => {
    ManagerWindow.close()
  })

  // 载入本地页面，对于 Linux 系统 file：// 不能省略
  ManagerWindow.loadURL(
    'file://' + path.join(__dirname, '../manager/index.html')
  )

  // 在 debug 环境下启动会打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    ManagerWindow.webContents.openDevTools({ mode: 'detach' })
  }

  ipcMain.on('clear-cache', (event: Electron.Event) => {
    removeDirSync(Global.LocalCachePath)
    event.returnValue = 0
  })

  ipcMain.on(
    'update-user-config',
    (event: Electron.Event, config: MajsoulPlus.UserConfig) => {
      updateObject(UserConfigs, config)
      SaveConfigJson(config)

      ManagerWindow.setContentSize(
        Global.ManagerWindowConfig.width * UserConfigs.window.zoomFactor,
        Global.ManagerWindowConfig.height * UserConfigs.window.zoomFactor
      )
      ManagerWindow.webContents.setZoomFactor(UserConfigs.window.zoomFactor)
    }
  )
}
