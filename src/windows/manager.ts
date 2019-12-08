import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain
} from 'electron'
import * as path from 'path'
import { SaveConfigJson, UserConfigs } from '../config'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { removeDirSync, updateObject } from '../utils'

export let ManagerWindow: BrowserWindow

export const ManagerWindowStatus: MajsoulPlus.WindowStatus = {
  visible: false,
  muted: false
}

export function initManagerWindow() {
  const config: BrowserWindowConstructorOptions = {
    ...Global.ManagerWindowConfig
  }
  // macOS 专有设置，设置背景为透明色
  if (process.platform === 'darwin') {
    config.frame = false
    config.titleBarStyle = 'hidden'
    config.vibrancy = 'medium-light'
    config.backgroundColor = 'rgba(0,0,0,0)'
  }

  // 计算资源管理器缩放宽高
  config.width *= UserConfigs.window.zoomFactor
  config.height *= UserConfigs.window.zoomFactor

  ManagerWindow = new BrowserWindow(config)

  // 清空菜单
  ManagerWindow.removeMenu()

  ManagerWindow.once('ready-to-show', () => {
    // 根据资源管理器设置的缩放宽高进行缩放操作
    ManagerWindow.webContents.zoomFactor = UserConfigs.window.zoomFactor
    ManagerWindow.show()
  })

  // 阻止页面 title 更改
  ManagerWindow.on('page-title-updated', event => event.preventDefault())

  // 关闭窗口
  ManagerWindow.on('close', () => {
    ipcMain.emit('save-resourcepack-enabled', {})
    ipcMain.emit('save-extension-enabled', {})
    ipcMain.emit('save-tool-enabled', {})
    SaveConfigJson(UserConfigs)
  })

  ManagerWindow.once('closed', () => {
    ManagerWindow = undefined
  })

  // 载入本地页面，对于 Linux 系统 file：// 不能省略
  ManagerWindow.loadURL(
    'file://' + path.join(__dirname, '../manager/index.html')
  )

  // 在 debug 环境下启动会打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    ManagerWindow.webContents.openDevTools({ mode: 'detach' })
  }

  ipcMain.on('clear-cache', event => {
    removeDirSync(Global.LocalCachePath)
    event.returnValue = 0
  })

  ipcMain.on('update-user-config', (event, config: MajsoulPlus.UserConfig) => {
    updateObject(UserConfigs, config)

    // 缩放比例的上下限
    if (UserConfigs.window.zoomFactor < 0.2) {
      UserConfigs.window.zoomFactor = 0.2
    } else if (UserConfigs.window.zoomFactor > 10) {
      UserConfigs.window.zoomFactor = 10
    }
    SaveConfigJson(UserConfigs)

    ManagerWindow.setContentSize(
      Global.ManagerWindowConfig.width * UserConfigs.window.zoomFactor,
      Global.ManagerWindowConfig.height * UserConfigs.window.zoomFactor
    )
    ManagerWindow.webContents.zoomFactor = UserConfigs.window.zoomFactor
  })
}
