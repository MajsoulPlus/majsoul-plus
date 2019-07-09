import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain
} from 'electron'
import * as path from 'path'
import { UserConfigs } from '../config'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'

// tslint:disable-next-line
export let ManagerWindow: BrowserWindow
// tslint:disable-next-line
export const ManagerWindowStatus: MajsoulPlus.WindowStatus = {
  visible: false,
  muted: false
}

export function initManagerWindow() {
  const config: BrowserWindowConstructorOptions = {
    ...Global.ManagerWindowConfig
  }
  // hack macOS config
  if (process.platform === 'darwin') {
    config.frame = false
    config.titleBarStyle = 'hidden'
    if (Number(process.versions.electron.split('.')[0]) > 2) {
      config.vibrancy = 'light'
      config.backgroundColor = 'rgba(0,0,0,0)'
    }
  }

  config.width *= UserConfigs.window.zoomFactor
  config.height *= UserConfigs.window.zoomFactor

  ManagerWindow = new BrowserWindow(config)

  ManagerWindow.once('ready-to-show', () => {
    ManagerWindow.webContents.setZoomFactor(UserConfigs.window.zoomFactor)
    ManagerWindow.show()
  })

  ManagerWindow.on('page-title-updated', event => event.preventDefault())
  ManagerWindow.once('close', event => {
    event.preventDefault()
    ManagerWindow.hide()
    event.sender.send('saveConfig')
  })

  ipcMain.on('close-manager', () => {
    ManagerWindow.close()
  })

  ManagerWindow.loadURL(
    'file://' + path.join(__dirname, '../manager/index.html')
  )

  // Add environment config to open developer tools
  if (process.env.NODE_ENV === 'development') {
    ManagerWindow.webContents.openDevTools({ mode: 'detach' })
  }
}
