import * as fs from 'fs'
import { Global } from '../global'
import ExtensionManager from './manager'
import { ipcMain, Event } from 'electron'

export function LoadExtension() {
  // Load from config file

  // Config file should only save extension folder name
  // Detailed setting should be read from dedicated files

  // TODO: Toposort for extension dependencies
  const enabled: string[] = JSON.parse(
    fs.readFileSync(Global.ExtensionConfigPath, {
      encoding: 'utf-8'
    })
  )
  enabled.forEach(extension => ExtensionManager.use(extension))

  // Register ipcMain
  ipcMain.on('extension-list', (event: Event) => {
    event.returnValue = []
  })

  ipcMain.on('extension-detail', (event: Event) => {
    event.returnValue = ExtensionManager.getDetails()
  })
}
